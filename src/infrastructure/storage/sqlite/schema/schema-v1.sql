CREATE TABLE IF NOT EXISTS AcademicInfo (
  name TEXT,
  surname TEXT,
  studentNumber TEXT,
  profilePictureUrl TEXT
);

CREATE TABLE IF NOT EXISTS Degree (
  id TEXT PRIMARY KEY,
  degreeName TEXT,
  institutionName TEXT,
  specialization TEXT,
  nqfLevel INTEGER,
  duration INTEGER,
  totalCreditsToGraduate INTEGER,
  status TEXT,
  startDate TEXT,
  expectedEndDate TEXT
);

CREATE TABLE IF NOT EXISTS AcademicTerm (
  id TEXT PRIMARY KEY,
  academicYear INTEGER,
  termName TEXT NOT NULL,
  startDate TEXT,
  endDate TEXT,
  gradePointAverageGoal REAL,
  durationInWeeks INTEGER,
  notionalHoursPerCredit INTEGER,
  degreeId TEXT,
  parentTermId TEXT,
  FOREIGN KEY(degreeId) REFERENCES Degree(id),
  FOREIGN KEY(parentTermId) REFERENCES AcademicTerm(id)
);

CREATE TABLE IF NOT EXISTS Assessment (
  id TEXT PRIMARY KEY,
  moduleCode TEXT,
  assessmentName TEXT,
  assessmentType TEXT,
  weight REAL,
  dueDate TEXT,
  status TEXT,
  result REAL,
  effort TEXT
);

CREATE TABLE IF NOT EXISTS SystemSettings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  theme TEXT,
  language TEXT,
  dueDateReminders INTEGER,
  defaultEffort TEXT,
  dailyEffortCutline INTEGER
);

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
