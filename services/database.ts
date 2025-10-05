import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
// FIX: Add missing type imports for casting.
// FIX: Add missing type import for 'AssessmentType'.
import { Degree, Module, Assessment, AcademicInfo, SystemSettings, FormData, DegreeStatus, AcademicTerm, ModuleType, ModuleStatus, AssessmentStatus, AssessmentType, EffortCategory, Language, ModuleBlueprint, ModuleOffering, FilterMode, AcademicOSBackup, DegreeProfileData, ApplicationSettingsData } from '../types';
import { isWithinInterval, parseISO } from 'date-fns';


let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

let currentBatchSize = 0;
let currentBatchIndex = 0;

export function setAssessmentBatchSize(size: number) {
  currentBatchSize = size;
  currentBatchIndex = 0;
}

const DB_NAME = 'academic_os_db';
const DB_VERSION = 2;

async function initDatabase() {
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });
  }
  if (!db) {
    const savedDb = localStorage.getItem(DB_NAME);
    let newlyCreated = false;
    if (savedDb) {
      const dbData = Uint8Array.from(atob(savedDb), c => c.charCodeAt(0));
      db = new SQL.Database(dbData);
    } else {
      db = new SQL.Database();
      newlyCreated = true;
    }
    
    if (newlyCreated) {
        await createTablesV2();
        db.exec(`PRAGMA user_version = ${DB_VERSION}`);
    } else {
        await migrate();
    }
  }
}

function saveDatabase() {
  if (db) {
    const dbData = db.export();
    const dbString = btoa(String.fromCharCode(...dbData));
    localStorage.setItem(DB_NAME, dbString);
  }
}

async function migrate() {
    if (!db) return;
    const versionRes = db.exec('PRAGMA user_version');
    const version = (versionRes[0]?.values[0]?.[0] as number) || 0;

    if (version < 2) {
        console.log('[Database] Migrating from v1 to v2...');
        await migrate_v1_to_v2();
        console.log('[Database] Migration to v2 complete.');
    } else {
        // Patch for existing v2 databases that may not have the user_dashboard_settings table.
        // This ensures the table exists before any queries are run against it.
        db.exec(`CREATE TABLE IF NOT EXISTS user_dashboard_settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          default_filter_mode TEXT DEFAULT 'smart'
        );`);
    }
}

async function migrate_v1_to_v2() {
    if (!db) return;
    try {
        db.exec(`
            ALTER TABLE Module RENAME TO Module_old;

            CREATE TABLE Module (
                id TEXT PRIMARY KEY,
                moduleCode TEXT UNIQUE,
                moduleName TEXT,
                credits INTEGER,
                moduleType TEXT,
                minFinalGrade REAL,
                minExamEntrance REAL,
                minExamGrade REAL,
                targetFinalGrade REAL,
                notes TEXT,
                prerequisites TEXT
            );

            CREATE TABLE ModuleOffering (
                id TEXT PRIMARY KEY,
                moduleId TEXT,
                anchorTermId TEXT,
                startDate TEXT,
                endDate TEXT,
                status TEXT,
                FOREIGN KEY(moduleId) REFERENCES Module(id),
                FOREIGN KEY(anchorTermId) REFERENCES AcademicTerm(id)
            );

            CREATE TABLE TermClosure (
                ancestorId TEXT,
                descendantId TEXT,
                depth INTEGER,
                PRIMARY KEY (ancestorId, descendantId)
            );
        `);

        const oldModulesStmt = db.prepare('SELECT * FROM Module_old');
        const blueprints = new Map<string, any>();
        const offerings: any[] = [];

        while (oldModulesStmt.step()) {
            const row = oldModulesStmt.getAsObject();
            const moduleCode = row.moduleCode as string;
            
            if (!blueprints.has(moduleCode)) {
                blueprints.set(moduleCode, {
                    id: `mod-${moduleCode}-${Date.now()}`,
                    moduleCode,
                    moduleName: row.moduleName,
                    credits: row.credits,
                    moduleType: row.moduleType,
                    minFinalGrade: row.minFinalGrade,
                    minExamEntrance: row.minExamEntrance,
                    minExamGrade: row.minExamGrade,
                    targetFinalGrade: row.targetFinalGrade,
                    notes: row.notes,
                    prerequisites: row.prerequisites,
                });
            }
            
            offerings.push({
                id: row.id,
                moduleId: blueprints.get(moduleCode).id,
                anchorTermId: row.termId,
                startDate: row.startDate,
                endDate: row.endDate,
                status: row.status,
            });
        }
        oldModulesStmt.free();
        
        const blueprintStmt = db.prepare('INSERT INTO Module (id, moduleCode, moduleName, credits, moduleType, minFinalGrade, minExamEntrance, minExamGrade, targetFinalGrade, notes, prerequisites) VALUES (:id, :moduleCode, :moduleName, :credits, :moduleType, :minFinalGrade, :minExamEntrance, :minExamGrade, :targetFinalGrade, :notes, :prerequisites)');
        for (const bp of blueprints.values()) {
            blueprintStmt.run({
                ':id': bp.id,
                ':moduleCode': bp.moduleCode,
                ':moduleName': bp.moduleName,
                ':credits': bp.credits,
                ':moduleType': bp.moduleType,
                ':minFinalGrade': bp.minFinalGrade,
                ':minExamEntrance': bp.minExamEntrance,
                ':minExamGrade': bp.minExamGrade,
                ':targetFinalGrade': bp.targetFinalGrade,
                ':notes': bp.notes,
                ':prerequisites': bp.prerequisites
            });
        }
        blueprintStmt.free();

        const offeringStmt = db.prepare('INSERT INTO ModuleOffering (id, moduleId, anchorTermId, startDate, endDate, status) VALUES (:id, :moduleId, :anchorTermId, :startDate, :endDate, :status)');
        for (const off of offerings) {
            offeringStmt.run(off);
        }
        offeringStmt.free();

        db.exec('DROP TABLE Module_old');
        db.exec(`CREATE TABLE IF NOT EXISTS user_dashboard_settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          default_filter_mode TEXT DEFAULT 'smart'
        );`);
        db.exec(`PRAGMA user_version = ${DB_VERSION}`);
        await rebuildTermClosureTable();
        saveDatabase();

    } catch (e) {
        console.error("Migration failed:", e);
        // Here you might want to restore from a backup if you had one.
        // For localStorage, we might just have to clear it and start over.
        localStorage.removeItem(DB_NAME);
        db = null; // Force re-initialization
        await initDatabase(); // This will create a fresh v2 DB
    }
}


async function createTablesV2() {
  if (!db) throw new Error('Database not initialized');
  db.run(`
    CREATE TABLE IF NOT EXISTS AcademicInfo ( name TEXT, surname TEXT, studentNumber TEXT, profilePictureUrl TEXT );
    CREATE TABLE IF NOT EXISTS Degree ( id TEXT PRIMARY KEY, degreeName TEXT, institutionName TEXT, specialization TEXT, nqfLevel INTEGER, duration INTEGER, totalCreditsToGraduate INTEGER, status TEXT, startDate TEXT, expectedEndDate TEXT );
    CREATE TABLE IF NOT EXISTS AcademicTerm ( id TEXT PRIMARY KEY, academicYear INTEGER, termName TEXT NOT NULL, startDate TEXT, endDate TEXT, gradePointAverageGoal REAL, durationInWeeks INTEGER, notionalHoursPerCredit INTEGER, degreeId TEXT, parentTermId TEXT, FOREIGN KEY(degreeId) REFERENCES Degree(id), FOREIGN KEY(parentTermId) REFERENCES AcademicTerm(id) );
    CREATE TABLE IF NOT EXISTS Assessment ( id TEXT PRIMARY KEY, moduleCode TEXT, assessmentName TEXT, assessmentType TEXT, weight REAL, dueDate TEXT, status TEXT, result REAL, effort TEXT );
    CREATE TABLE IF NOT EXISTS SystemSettings ( id INTEGER PRIMARY KEY CHECK (id = 1), theme TEXT, language TEXT, dueDateReminders INTEGER, defaultEffort TEXT, dailyEffortCutline INTEGER );

    -- New V2 tables
    CREATE TABLE IF NOT EXISTS Module (
        id TEXT PRIMARY KEY,
        moduleCode TEXT UNIQUE,
        moduleName TEXT,
        credits INTEGER,
        moduleType TEXT,
        minFinalGrade REAL,
        minExamEntrance REAL,
        minExamGrade REAL,
        targetFinalGrade REAL,
        notes TEXT,
        prerequisites TEXT
    );
    CREATE TABLE IF NOT EXISTS ModuleOffering (
        id TEXT PRIMARY KEY,
        moduleId TEXT,
        anchorTermId TEXT,
        startDate TEXT,
        endDate TEXT,
        status TEXT,
        FOREIGN KEY(moduleId) REFERENCES Module(id),
        FOREIGN KEY(anchorTermId) REFERENCES AcademicTerm(id)
    );
    CREATE TABLE IF NOT EXISTS TermClosure (
        ancestorId TEXT,
        descendantId TEXT,
        depth INTEGER,
        PRIMARY KEY (ancestorId, descendantId)
    );
    CREATE TABLE IF NOT EXISTS user_dashboard_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      default_filter_mode TEXT DEFAULT 'smart'
    );
  `);
}

export async function rebuildTermClosureTable() {
    if (!db) await initDatabase();
    if (!db) return;
    console.log('[Database] Rebuilding term closure table...');

    db.run('DELETE FROM TermClosure');
    const terms = await getAllTerms();
    
    const adj: Record<string, string[]> = {};
    for (const term of terms) {
        if (term.parentTermId) {
            if (!adj[term.parentTermId]) adj[term.parentTermId] = [];
            adj[term.parentTermId].push(term.id);
        }
    }
    
    const stmt = db.prepare('INSERT INTO TermClosure (ancestorId, descendantId, depth) VALUES (?, ?, ?)');

    function traverse(ancestorId: string, currentId: string, depth: number) {
        stmt.run([ancestorId, currentId, depth]);
        if (adj[currentId]) {
            for (const childId of adj[currentId]) {
                traverse(ancestorId, childId, depth + 1);
            }
        }
    }

    for (const term of terms) {
        traverse(term.id, term.id, 0);
    }
    
    stmt.free();
    console.log('[Database] Term closure table rebuilt.');
    saveDatabase();
}


// AcademicInfo CRUD
export async function getAcademicInfo(): Promise<AcademicInfo | null> {
  await initDatabase();
  if (!db) return null;
  const stmt = db.prepare('SELECT * FROM AcademicInfo LIMIT 1');
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const row = stmt.getAsObject();
  stmt.free();
  // FIX: Cast SqlValue to specific types.
  return {
    name: (row.name as string) || '',
    surname: (row.surname as string) || '',
    studentNumber: (row.studentNumber as string) || '',
    profilePicture: null,
    profilePictureUrl: (row.profilePictureUrl as string) || '',
  };
}

export async function saveAcademicInfo(info: AcademicInfo): Promise<void> {
  await initDatabase();
  if (!db) return;
  console.log('[Database] Saving AcademicInfo:', info);
  try {
    db.run('DELETE FROM AcademicInfo');
    const stmt = db.prepare(`
      INSERT INTO AcademicInfo (name, surname, studentNumber, profilePictureUrl)
      VALUES (:name, :surname, :studentNumber, :profilePictureUrl)
    `);
    stmt.run({
      ':name': info.name,
      ':surname': info.surname,
      ':studentNumber': info.studentNumber,
      ':profilePictureUrl': info.profilePictureUrl,
    });
    stmt.free();
    console.log('[Database] AcademicInfo saved successfully');
    saveDatabase();
  } catch (error) {
    console.error('[Database] Error saving AcademicInfo:', error);
    throw error;
  }
}

// Degree and AcademicTerm CRUD
export async function getDegreeAndChildren(): Promise<Degree | null> {
  await initDatabase();
  if (!db) return null;

  const degreeStmt = db.prepare('SELECT * FROM Degree LIMIT 1');
  if (!degreeStmt.step()) {
    degreeStmt.free();
    return null;
  }
  const degreeRow = degreeStmt.getAsObject();
  degreeStmt.free();

  const termsStmt = db.prepare('SELECT * FROM AcademicTerm WHERE degreeId = :degreeId');
  termsStmt.bind({ ':degreeId': degreeRow.id });
  // FIX: Use correct type for terms array and cast row values.
  const terms: AcademicTerm[] = [];
  while (termsStmt.step()) {
    const termRow = termsStmt.getAsObject();
    terms.push({
      id: termRow.id as string,
      academicYear: termRow.academicYear as number,
      termName: termRow.termName as string,
      startDate: termRow.startDate as string,
      endDate: termRow.endDate as string,
      gradePointAverageGoal: termRow.gradePointAverageGoal as number | undefined,
      notionalHoursPerCredit: termRow.notionalHoursPerCredit as number,
      durationInWeeks: termRow.durationInWeeks as number,
      parentTermId: termRow.parentTermId as string | null,
    });
  }
  termsStmt.free();

  // FIX: Cast SqlValue to specific types.
  return {
    id: degreeRow.id as string,
    degreeName: degreeRow.degreeName as string,
    institutionName: degreeRow.institutionName as string,
    specialization: (degreeRow.specialization as string) || undefined,
    nqfLevel: degreeRow.nqfLevel as number,
    duration: degreeRow.duration as number,
    totalCreditsToGraduate: degreeRow.totalCreditsToGraduate as number,
    status: degreeRow.status as DegreeStatus,
    startDate: degreeRow.startDate as string,
    expectedEndDate: (degreeRow.expectedEndDate as string) || undefined,
    terms,
  };
}

export async function saveDegree(degree: Degree): Promise<void> {
  await initDatabase();
  if (!db) return;
  console.log('[Database] Saving Degree:', degree);
  try {
    // Upsert Degree
    db.run(`
      INSERT OR REPLACE INTO Degree (
        id, degreeName, institutionName, specialization, nqfLevel, duration,
        totalCreditsToGraduate, status, startDate, expectedEndDate
      ) VALUES (
        :id, :degreeName, :institutionName, :specialization, :nqfLevel, :duration,
        :totalCreditsToGraduate, :status, :startDate, :expectedEndDate
      )
    `, {
      ':id': degree.id,
      ':degreeName': degree.degreeName,
      ':institutionName': degree.institutionName,
      ':specialization': degree.specialization || null,
      ':nqfLevel': degree.nqfLevel,
      ':duration': degree.duration,
      ':totalCreditsToGraduate': degree.totalCreditsToGraduate,
      ':status': degree.status,
      ':startDate': degree.startDate,
      ':expectedEndDate': degree.expectedEndDate || null,
    });

    // Upsert AcademicTerms
    db.run('DELETE FROM AcademicTerm WHERE degreeId = ?', [degree.id]);
    const termStmt = db.prepare(`
      INSERT INTO AcademicTerm (
        id, academicYear, termName, startDate, endDate, gradePointAverageGoal,
        durationInWeeks, notionalHoursPerCredit, degreeId, parentTermId
      ) VALUES (
        :id, :academicYear, :termName, :startDate, :endDate, :gradePointAverageGoal,
        :durationInWeeks, :notionalHoursPerCredit, :degreeId, :parentTermId
      )
    `);
    for (const term of degree.terms) {
      termStmt.run({
        ':id': term.id,
        ':academicYear': term.academicYear,
        ':termName': term.termName,
        ':startDate': term.startDate,
        ':endDate': term.endDate,
        ':gradePointAverageGoal': term.gradePointAverageGoal || null,
        ':durationInWeeks': term.durationInWeeks,
        ':notionalHoursPerCredit': term.notionalHoursPerCredit,
        ':degreeId': degree.id,
        ':parentTermId': term.parentTermId || null,
      });
    }
    termStmt.free();
    console.log('[Database] Degree saved successfully');
    await rebuildTermClosureTable(); // Rebuild hierarchy after term changes
    saveDatabase();
  } catch (error) {
    console.error('[Database] Error saving Degree:', error);
    throw error;
  }
}

export async function getAllTerms(): Promise<AcademicTerm[]> {
  await initDatabase();
  if (!db) return [];
  const stmt = db.prepare('SELECT * FROM AcademicTerm');
  const terms: AcademicTerm[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    terms.push({
      id: row.id as string,
      academicYear: row.academicYear as number,
      termName: row.termName as string,
      startDate: row.startDate as string,
      endDate: row.endDate as string,
      gradePointAverageGoal: row.gradePointAverageGoal as number | undefined,
      notionalHoursPerCredit: row.notionalHoursPerCredit as number,
      durationInWeeks: row.durationInWeeks as number,
      parentTermId: (row.parentTermId as string) || null,
    });
  }
  stmt.free();
  return terms;
}


async function saveTerm(term: AcademicTerm): Promise<void> {
    await initDatabase();
    if (!db) return;
    
    const degreeStmt = db.prepare('SELECT id FROM Degree LIMIT 1');
    if (!degreeStmt.step()) {
        degreeStmt.free();
        throw new Error("No degree found in database to associate term with.");
    }
    const degreeRow = degreeStmt.getAsObject();
    degreeStmt.free();
    const degreeId = degreeRow.id as string;

    db.run(`
        INSERT OR REPLACE INTO AcademicTerm (
            id, academicYear, termName, startDate, endDate, gradePointAverageGoal,
            durationInWeeks, notionalHoursPerCredit, degreeId, parentTermId
        ) VALUES (
            :id, :academicYear, :termName, :startDate, :endDate, :gradePointAverageGoal,
            :durationInWeeks, :notionalHoursPerCredit, :degreeId, :parentTermId
        )
    `, {
        ':id': term.id,
        ':academicYear': term.academicYear,
        ':termName': term.termName,
        ':startDate': term.startDate,
        ':endDate': term.endDate,
        ':gradePointAverageGoal': term.gradePointAverageGoal || null,
        ':durationInWeeks': term.durationInWeeks,
        ':notionalHoursPerCredit': term.notionalHoursPerCredit,
        ':degreeId': degreeId,
        ':parentTermId': term.parentTermId || null,
    });
}

async function deleteTerm(termId: string): Promise<void> {
    await initDatabase();
    if (!db) return;
    db.run('DELETE FROM AcademicTerm WHERE id = ?', [termId]);
}

export async function saveTermsBatch(termsToSave: AcademicTerm[], termIdsToDelete: string[]): Promise<void> {
    await initDatabase();
    if (!db) return;
    try {
        // Important: Delete must happen first to handle cases where a term is deleted and re-added with the same ID.
        for (const id of termIdsToDelete) {
            await deleteTerm(id);
        }
        for (const term of termsToSave) {
            await saveTerm(term);
        }
        await rebuildTermClosureTable();
        saveDatabase();
        console.log(`[Database] Batch save complete. Saved/Updated: ${termsToSave.length}, Deleted: ${termIdsToDelete.length}`);
    } catch (error) {
        console.error("[Database] Batch term save failed:", error);
        throw error;
    }
}

export async function deleteAcademicYear(year: number): Promise<void> {
    await initDatabase();
    if (!db) return;
    try {
        db.run('DELETE FROM AcademicTerm WHERE academicYear = ?', [year]);
        await rebuildTermClosureTable();
        saveDatabase();
        console.log(`[Database] Deleted all terms for academic year ${year}`);
    } catch (error) {
        console.error(`[Database] Error deleting academic year ${year}:`, error);
        throw error;
    }
}


// Module CRUD
export async function getModules(): Promise<Module[]> {
  await initDatabase();
  if (!db) return [];

  const stmt = db.prepare(`
    SELECT
      o.id as offeringId,
      m.id as moduleId,
      m.moduleCode,
      m.moduleName,
      m.credits,
      m.moduleType,
      o.anchorTermId,
      o.startDate,
      o.endDate,
      m.minFinalGrade,
      m.minExamEntrance,
      m.minExamGrade,
      m.targetFinalGrade,
      o.status,
      m.notes,
      m.prerequisites
    FROM ModuleOffering o
    JOIN Module m ON o.moduleId = m.id
  `);
  const modules: Module[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    modules.push({
      offeringId: row.offeringId as string,
      moduleId: row.moduleId as string,
      moduleCode: row.moduleCode as string,
      moduleName: row.moduleName as string,
      credits: row.credits as number,
      moduleType: row.moduleType as ModuleType,
      anchorTermId: row.anchorTermId as string,
      startDate: (row.startDate as string) || undefined,
      endDate: (row.endDate as string) || undefined,
      minFinalGrade: row.minFinalGrade as number,
      minExamEntrance: (row.minExamEntrance as number) || undefined,
      minExamGrade: (row.minExamGrade as number) || undefined,
      targetFinalGrade: row.targetFinalGrade as number,
      status: row.status as ModuleStatus,
      notes: (row.notes as string) || undefined,
      prerequisites: row.prerequisites ? JSON.parse(row.prerequisites as string) : undefined,
    });
  }
  stmt.free();
  return modules;
}

export async function getModulesForYear(year: number): Promise<Module[]> {
  await initDatabase();
  if (!db) return [];

  const stmt = db.prepare(`
    SELECT
      o.id as offeringId,
      m.id as moduleId,
      m.*,
      o.*
    FROM ModuleOffering o
    JOIN Module m ON o.moduleId = m.id
    WHERE o.anchorTermId IN (SELECT id FROM AcademicTerm WHERE academicYear = :year)
  `);
  stmt.bind({ ':year': year });

  const modules: Module[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    modules.push({
      offeringId: row.offeringId as string,
      moduleId: row.moduleId as string,
      moduleCode: row.moduleCode as string,
      moduleName: row.moduleName as string,
      credits: row.credits as number,
      moduleType: row.moduleType as ModuleType,
      anchorTermId: row.anchorTermId as string,
      startDate: (row.startDate as string) || undefined,
      endDate: (row.endDate as string) || undefined,
      minFinalGrade: row.minFinalGrade as number,
      minExamEntrance: (row.minExamEntrance as number) || undefined,
      minExamGrade: (row.minExamGrade as number) || undefined,
      targetFinalGrade: row.targetFinalGrade as number,
      status: row.status as ModuleStatus,
      notes: (row.notes as string) || undefined,
      prerequisites: row.prerequisites ? JSON.parse(row.prerequisites as string) : undefined,
    });
  }
  stmt.free();
  return modules;
}

export async function saveModule(module: Module): Promise<void> {
  await initDatabase();
  if (!db) return;
  console.log('[Database] Saving Module & Offering:', module);

  // Upsert Module Blueprint
  db.run(`
    INSERT OR REPLACE INTO Module (
      id, moduleCode, moduleName, credits, moduleType, minFinalGrade, minExamEntrance,
      minExamGrade, targetFinalGrade, notes, prerequisites
    ) VALUES (
      :id, :moduleCode, :moduleName, :credits, :moduleType, :minFinalGrade, :minExamEntrance,
      :minExamGrade, :targetFinalGrade, :notes, :prerequisites
    )
  `, {
      ':id': module.moduleId,
      ':moduleCode': module.moduleCode,
      ':moduleName': module.moduleName,
      ':credits': module.credits,
      ':moduleType': module.moduleType,
      ':minFinalGrade': module.minFinalGrade,
      ':minExamEntrance': module.minExamEntrance || null,
      ':minExamGrade': module.minExamGrade || null,
      ':targetFinalGrade': module.targetFinalGrade,
      ':notes': module.notes || null,
      ':prerequisites': JSON.stringify(module.prerequisites || []),
  });

  // Upsert Module Offering
  db.run(`
    INSERT OR REPLACE INTO ModuleOffering (
      id, moduleId, anchorTermId, startDate, endDate, status
    ) VALUES (
      :id, :moduleId, :anchorTermId, :startDate, :endDate, :status
    )
  `, {
      ':id': module.offeringId,
      ':moduleId': module.moduleId,
      ':anchorTermId': module.anchorTermId,
      ':startDate': module.startDate || null,
      ':endDate': module.endDate || null,
      ':status': module.status,
  });

  console.log('[Database] Module & Offering saved successfully');
  saveDatabase();
}

export async function deleteModuleAndChildren(moduleCode: string): Promise<void> {
  await initDatabase();
  if (!db) return;
  console.log(`[Database] Deleting module blueprint ${moduleCode} and all its offerings and children.`);
  try {
    const moduleStmt = db.prepare('SELECT id FROM Module WHERE moduleCode = ?');
    moduleStmt.bind([moduleCode]);
    if (moduleStmt.step()) {
        const { id: moduleId } = moduleStmt.getAsObject();
        moduleStmt.free();

        db.run('DELETE FROM Assessment WHERE moduleCode = ?', [moduleCode]);
        console.log(`[Database] Deleted assessments for ${moduleCode}`);
        
        db.run('DELETE FROM ModuleOffering WHERE moduleId = ?', [moduleId as string]);
        console.log(`[Database] Deleted offerings for module ID ${moduleId}`);

        db.run('DELETE FROM Module WHERE id = ?', [moduleId as string]);
        console.log(`[Database] Deleted module blueprint for ${moduleCode}`);
        
        saveDatabase();
        console.log(`[Database] Deletion for ${moduleCode} committed.`);
    } else {
        moduleStmt.free();
        console.warn(`[Database] No module with code ${moduleCode} found to delete.`);
    }
  } catch (error) {
    console.error(`[Database] Error during cascading delete for ${moduleCode}:`, error);
    throw error;
  }
}

// Assessment CRUD
export async function getAssessments(): Promise<Assessment[]> {
  await initDatabase();
  if (!db) return [];

  const stmt = db.prepare('SELECT * FROM Assessment');
  const assessments: Assessment[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    // FIX: Cast SqlValue to specific types.
    assessments.push({
      id: row.id as string,
      moduleCode: row.moduleCode as string,
      assessmentName: row.assessmentName as string,
      assessmentType: row.assessmentType as AssessmentType,
      weight: row.weight as number,
      dueDate: row.dueDate as string,
      status: row.status as AssessmentStatus,
      result: row.result === null ? undefined : (row.result as number),
      effort: row.effort as EffortCategory,
    });
  }
  stmt.free();
  return assessments;
}

export async function saveAssessment(assessment: Assessment): Promise<void> {
  await initDatabase();
  if (!db) return;

  if (currentBatchSize > 0) {
    currentBatchIndex++;
    if (currentBatchIndex === 1) {
      console.log('[Database] Saving first Assessment:', assessment);
    }
  }

  db.run(`
    INSERT OR REPLACE INTO Assessment (
      id, moduleCode, assessmentName, assessmentType, weight, dueDate, status, result, effort
    ) VALUES (
      :id, :moduleCode, :assessmentName, :assessmentType, :weight, :dueDate, :status, :result, :effort
    )
  `, {
    ':id': assessment.id,
    ':moduleCode': assessment.moduleCode,
    ':assessmentName': assessment.assessmentName,
    ':assessmentType': assessment.assessmentType,
    ':weight': assessment.weight,
    ':dueDate': assessment.dueDate,
    ':status': assessment.status,
    ':result': assessment.result === undefined ? null : assessment.result,
    ':effort': assessment.effort,
  });

  if (currentBatchSize > 0) {
    if (currentBatchIndex === 1) {
      console.log('[Database] First Assessment saved successfully');
    } else if (currentBatchIndex === currentBatchSize) {
      console.log('[Database] Last Assessment saved successfully');
      currentBatchSize = 0;
      currentBatchIndex = 0;
    }
  }

  saveDatabase();
}

export async function deleteAssessment(assessmentId: string): Promise<void> {
  await initDatabase();
  if (!db) return;
  db.run('DELETE FROM Assessment WHERE id = ?', [assessmentId]);
  saveDatabase();
}

// SystemSettings CRUD
export async function getSystemSettings(): Promise<SystemSettings | null> {
  await initDatabase();
  if (!db) return null;

  const stmt = db.prepare('SELECT * FROM SystemSettings WHERE id = 1');
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const row = stmt.getAsObject();
  stmt.free();

  // FIX: Cast SqlValue to specific types.
  return {
    theme: row.theme as 'light' | 'dark' | 'system',
    language: row.language as Language,
    dueDateReminders: row.dueDateReminders === 1,
    defaultEffort: row.defaultEffort as EffortCategory,
    dailyEffortCutline: (row.dailyEffortCutline as number) || undefined,
  };
}

export async function saveSystemSettings(settings: SystemSettings): Promise<void> {
  await initDatabase();
  if (!db) return;
  console.log('[Database] Saving SystemSettings:', settings);

  db.run(`
    INSERT OR REPLACE INTO SystemSettings (
      id, theme, language, dueDateReminders, defaultEffort, dailyEffortCutline
    ) VALUES (
      1, :theme, :language, :dueDateReminders, :defaultEffort, :dailyEffortCutline
    )
  `, {
    ':theme': settings.theme,
    ':language': settings.language,
    ':dueDateReminders': settings.dueDateReminders ? 1 : 0,
    ':defaultEffort': settings.defaultEffort,
    ':dailyEffortCutline': settings.dailyEffortCutline || null,
  });
  console.log('[Database] SystemSettings saved successfully');
  saveDatabase();
}

// UserDashboardSettings CRUD
export interface UserDashboardSettings {
  default_filter_mode: FilterMode;
}

export async function getDashboardSettings(): Promise<UserDashboardSettings> {
    await initDatabase();
    if (!db) return { default_filter_mode: 'smart' };

    const stmt = db.prepare('SELECT default_filter_mode FROM user_dashboard_settings WHERE id = 1');
    if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return { default_filter_mode: row.default_filter_mode as FilterMode };
    }
    stmt.free();
    // If no settings, return default and insert it for next time
    db.run('INSERT OR IGNORE INTO user_dashboard_settings (id, default_filter_mode) VALUES (1, "smart")');
    saveDatabase();
    return { default_filter_mode: 'smart' };
}

export async function saveDashboardSettings(settings: UserDashboardSettings): Promise<void> {
    await initDatabase();
    if (!db) return;
    
    db.run('INSERT OR REPLACE INTO user_dashboard_settings (id, default_filter_mode) VALUES (1, :default_filter_mode)', {
        ':default_filter_mode': settings.default_filter_mode,
    });
    saveDatabase();
}


// Composite function to get all core data
export async function getAllCoreData(): Promise<FormData> {
  const academicInfo = await getAcademicInfo() || {
    name: '',
    surname: '',
    studentNumber: '',
    profilePicture: null,
    profilePictureUrl: '',
  };
  const degree = await getDegreeAndChildren() || {
    id: '',
    degreeName: '',
    institutionName: '',
    specialization: '',
    nqfLevel: 0,
    duration: 0,
    totalCreditsToGraduate: 0,
    status: 'Planned',
    startDate: '',
    terms: [],
  };
  const modules = await getModules();
  const importedAssessments = await getAssessments();
  const systemSettings = await getSystemSettings() || {
    theme: 'system',
    language: 'en',
    dueDateReminders: true,
    defaultEffort: 'Standard',
    dailyEffortCutline: undefined,
  };

  return {
    academicInfo,
    degree,
    csvImported: importedAssessments.length > 0,
    importedAssessments,
    systemSettings,
    modules,
  };
}

export async function generateFullBackupData(): Promise<AcademicOSBackup> {
    await initDatabase();

    const backup: AcademicOSBackup = {
        schemaVersion: "1.0",
        exportedAt: new Date().toISOString(),
        appVersion: "1.0.0",
        data: {
            degreeProfile: {} as DegreeProfileData,
            applicationSettings: {} as ApplicationSettingsData,
            academicTerms: [],
            holidays: [],
            modules: [],
            assessments: [],
            tasks: [],
            pomodoroSessions: [],
        },
    };

    // 1. Get Degree Profile & Academic Terms
    const degree = await getDegreeAndChildren();
    if (degree) {
        backup.data.degreeProfile = {
            degreeName: degree.degreeName,
            specialization: degree.specialization || '',
            institutionName: degree.institutionName,
            totalCreditsToGraduate: degree.totalCreditsToGraduate,
        };
        backup.data.academicTerms = degree.terms.map(term => ({
            TermID: term.id,
            ParentTermID: term.parentTermId || null,
            TermName: term.termName,
            AcademicYear: term.academicYear,
            StartDate: term.startDate,
            EndDate: term.endDate,
            DurationInWeeks: term.durationInWeeks,
            NotionalHoursPerCredit: term.notionalHoursPerCredit,
        }));
    }

    // 2. Get Application Settings
    const settings = await getSystemSettings();
    if (settings) {
        backup.data.applicationSettings = {
            theme: settings.theme,
            language: settings.language,
            pomodoroFocusDuration: 25, // Default from schema
            pomodoroBreakDuration: 5,   // Default from schema
        };
    }

    // 3. Get Modules
    const modules = await getModules();
    const moduleCodeToModuleIdMap = new Map<string, string>();
    modules.forEach(m => {
        if (!moduleCodeToModuleIdMap.has(m.moduleCode)) {
            moduleCodeToModuleIdMap.set(m.moduleCode, m.moduleId);
        }
    });

    backup.data.modules = modules.map(m => ({
        ModuleID: m.offeringId,
        TermID: m.anchorTermId,
        ModuleName: m.moduleName,
        ModuleCode: m.moduleCode,
        Credits: m.credits,
        Status: m.status,
        Prerequisites: (m.prerequisites || []).map(code => moduleCodeToModuleIdMap.get(code) || code),
        minFinalGrade: m.minFinalGrade,
        targetFinalGrade: m.targetFinalGrade,
        minExamEntrance: m.minExamEntrance,
        minExamGrade: m.minExamGrade,
        notes: m.notes,
        calculated_current_grade: m.calculated_current_grade ?? null,
        calculated_patfg: m.calculated_patfg,
        calculated_final_grade: m.calculated_final_grade,
        calculated_completion_progress: m.calculated_completion_progress,
        calculated_projected_final_grade: m.calculated_projected_final_grade,
        calculated_max_achievable_grade: m.calculated_max_achievable_grade,
        calculated_category_performance: m.calculated_category_performance,
        calculated_late_count: m.calculated_late_count,
        calculated_upcoming_count: m.calculated_upcoming_count,
        calculated_weekly_time_spent: m.calculated_weekly_time_spent,
    }));

    // 4. Get Assessments and map them to module offerings
    const assessments = await getAssessments();
    backup.data.assessments = assessments.map(a => {
        let offeringId = '';
        if (a.dueDate && a.dueDate !== 'TBC') {
            try {
                const dueDate = parseISO(a.dueDate);
                const matchingOffering = modules.find(o =>
                    o.moduleCode === a.moduleCode &&
                    o.startDate && o.endDate &&
                    isWithinInterval(dueDate, { start: parseISO(o.startDate), end: parseISO(o.endDate) })
                );
                if (matchingOffering) {
                    offeringId = matchingOffering.offeringId;
                }
            } catch {}
        }
        
        if (!offeringId) {
            const offeringsForCode = modules
                .filter(o => o.moduleCode === a.moduleCode)
                .sort((o1, o2) => (o2.startDate || '').localeCompare(o1.startDate || ''));
            if (offeringsForCode.length > 0) {
                offeringId = offeringsForCode[0].offeringId;
            }
        }

        return {
            AssessmentID: a.id,
            ModuleID: offeringId,
            AssessmentName: a.assessmentName,
            AssessmentType: a.assessmentType,
            DueDate: a.dueDate,
            Weight: a.weight,
            Result: a.result ?? null,
            effort: a.effort,
            status: a.status,
            calculated_priority_score: a.calculated_priority_score,
        };
    });

    return backup;
}

export async function getDataSummaryCounts(): Promise<{ yearCount: number; moduleCount: number; assessmentCount: number; }> {
    await initDatabase();
    if (!db) return { yearCount: 0, moduleCount: 0, assessmentCount: 0 };

    const yearStmt = db.prepare('SELECT COUNT(DISTINCT academicYear) as count FROM AcademicTerm');
    const moduleStmt = db.prepare('SELECT COUNT(*) as count FROM ModuleOffering');
    const assessmentStmt = db.prepare('SELECT COUNT(*) as count FROM Assessment');

    let yearCount = 0, moduleCount = 0, assessmentCount = 0;

    if (yearStmt.step()) {
        yearCount = yearStmt.get()[0] as number;
    }
    if (moduleStmt.step()) {
        moduleCount = moduleStmt.get()[0] as number;
    }
    if (assessmentStmt.step()) {
        assessmentCount = assessmentStmt.get()[0] as number;
    }

    yearStmt.free();
    moduleStmt.free();
    assessmentStmt.free();

    return { yearCount, moduleCount, assessmentCount };
}

export function eraseAllUserData(): void {
    // This is the most destructive action.
    // It clears the entire localStorage, which includes the database file and all user settings.
    localStorage.clear();

    // Nullify the in-memory database object.
    // The next call to initDatabase() will create a fresh one.
    if (db) {
        db.close();
        db = null;
    }
    console.log('[Database] All user data has been erased.');
}