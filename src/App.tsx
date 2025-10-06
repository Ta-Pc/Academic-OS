import React, { useState, useCallback, useEffect, useReducer } from 'react';
import { SetupStep, FormData, AcademicInfo, SystemSettings, Degree, Module, AcademicTerm, FilterMode, InitPhase, InitializationState } from './types';
import { isWithinInterval, parseISO, startOfDay, format, startOfYear, endOfYear } from 'date-fns';
import AcademicInfoForm from './legacy/components/AcademicInfoForm';
import ConfirmationStep from './legacy/components/ConfirmationStep';
import ImportCsvStep from './legacy/components/ImportCsvStep';
import SystemSettingsStep from './legacy/components/SystemSettingsStep';
import BuildingDashboardStep from './legacy/components/BuildingDashboardStep';
import Dashboard from './legacy/components/Dashboard';
import Stepper from './legacy/components/Stepper';
import ModuleDetailsPage from './legacy/components/pages/ModuleDetailsPage';
import TermNavigatorPage from './legacy/components/pages/TermNavigatorPage';
import ManageCalendarPage from './legacy/components/pages/ManageCalendarPage';
import SettingsPage from './legacy/components/pages/SettingsPage';
import { calculateModuleMetrics, calculateTermMetrics, calculateDegreeMetrics } from './legacy/services/analytics';
import { runDailyTasks } from './legacy/services/scheduler';
import * as database from './legacy/services/database';
import * as localStorageUtil from './legacy/utils/localStorage';
import { TermProvider, useTerm } from './legacy/components/contexts/TermContext';
import InitializationScreen from './legacy/components/InitializationScreen';
import FatalErrorScreen from './legacy/components/FatalErrorScreen';

const initialAcademicInfo: AcademicInfo = {
  name: '',
  surname: '',
  studentNumber: '',
  profilePicture: null,
  profilePictureUrl: '',
};

const initialDegree: Degree = {
    id: `degree-${Date.now()}`,
    degreeName: 'BIT Information Systems',
    institutionName: 'University of Pretoria',
    specialization: 'Data Science',
    nqfLevel: 7,
    duration: 3,
    totalCreditsToGraduate: 420,
    status: 'In Progress',
    startDate: new Date().toISOString().split('T')[0],
    terms: [],
};

const generateDefaultCalendar = (): AcademicTerm[] => {
  const template = [
    { placeholderId: 'sem1', academicYear: 2025, parentPlaceholderId: null, termName: 'Semester 1', startDate: '2025-02-10', endDate: '2025-05-29', durationInWeeks: 15, notionalHoursPerCredit: 10 },
    { placeholderId: 'q1', academicYear: 2025, parentPlaceholderId: 'sem1', termName: 'Quarter 1', startDate: '2025-02-10', endDate: '2025-03-31', durationInWeeks: 7, notionalHoursPerCredit: 10 },
    { placeholderId: 'q2', academicYear: 2025, parentPlaceholderId: 'sem1', termName: 'Quarter 2', startDate: '2025-04-01', endDate: '2025-05-29', durationInWeeks: 8, notionalHoursPerCredit: 10 },
    { placeholderId: 'sem2', academicYear: 2025, parentPlaceholderId: null, termName: 'Semester 2', startDate: '2025-07-21', endDate: '2025-11-06', durationInWeeks: 15, notionalHoursPerCredit: 10 },
    { placeholderId: 'q3', academicYear: 2025, parentPlaceholderId: 'sem2', termName: 'Quarter 3', startDate: '2025-07-21', endDate: '2025-09-05', durationInWeeks: 7, notionalHoursPerCredit: 10 },
    { placeholderId: 'q4', academicYear: 2025, parentPlaceholderId: 'sem2', termName: 'Quarter 4', startDate: '2025-09-08', endDate: '2025-11-06', durationInWeeks: 8, notionalHoursPerCredit: 10 },
  ];

  const idMap = new Map<string, string>();
  
  // First pass: generate new IDs and create a map of placeholder -> new ID
  template.forEach(term => {
    const newId = `term-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    idMap.set(term.placeholderId, newId);
  });

  // Second pass: build final term objects using the new IDs
  const newTerms: AcademicTerm[] = template.map(t => ({
    id: idMap.get(t.placeholderId)!,
    academicYear: t.academicYear,
    parentTermId: t.parentPlaceholderId ? idMap.get(t.parentPlaceholderId) : null,
    termName: t.termName,
    startDate: t.startDate,
    endDate: t.endDate,
    durationInWeeks: t.durationInWeeks,
    notionalHoursPerCredit: t.notionalHoursPerCredit,
  }));

  return newTerms;
};


const initialSystemSettings: SystemSettings = {
  theme: 'system',
  language: 'en',
  dueDateReminders: true,
  defaultEffort: 'Standard',
  dailyEffortCutline: 24,
};

const initialFormData: FormData = {
  academicInfo: initialAcademicInfo,
  degree: initialDegree,
  csvImported: false,
  importedAssessments: [],
  systemSettings: initialSystemSettings,
  modules: [],
};

const PHASE_CONFIG: Record<InitPhase, { message: string; progress: number }> = {
    [InitPhase.IDLE]: { message: 'Getting ready...', progress: 0 },
    [InitPhase.CHECKING_ENVIRONMENT]: { message: 'Verifying browser environment...', progress: 10 },
    [InitPhase.CHECKING_SETUP_STATUS]: { message: 'Checking setup status...', progress: 20 },
    [InitPhase.INITIALIZING_SQL]: { message: 'Initializing database engine...', progress: 30 },
    [InitPhase.LOADING_DATABASE]: { message: 'Loading your data...', progress: 50 },
    [InitPhase.CHECKING_DB_VERSION]: { message: 'Verifying database version...', progress: 60 },
    [InitPhase.HYDRATING_DATA]: { message: 'Populating application state...', progress: 80 },
    [InitPhase.READY]: { message: 'Ready!', progress: 100 },
    [InitPhase.FATAL_ERROR]: { message: 'An unrecoverable error occurred.', progress: 0 },
    [InitPhase.SETUP_REQUIRED]: { message: 'Setup required.', progress: 100 },
};

const initialInitState: InitializationState = {
    phase: InitPhase.IDLE,
    message: PHASE_CONFIG[InitPhase.IDLE].message,
    progress: PHASE_CONFIG[InitPhase.IDLE].progress,
};

type InitAction = 
  | { type: InitPhase.FATAL_ERROR; payload: { title: string; description: string } }
  | { type: Exclude<InitPhase, InitPhase.FATAL_ERROR> };

function initializationReducer(state: InitializationState, action: InitAction): InitializationState {
  const config = PHASE_CONFIG[action.type];
  if (action.type === InitPhase.FATAL_ERROR) {
    return {
      ...state,
      phase: InitPhase.FATAL_ERROR,
      message: config.message,
      progress: config.progress,
      error: action.payload,
    };
  }
  return {
    ...state,
    phase: action.type,
    message: config.message,
    progress: config.progress,
  };
}

/**
 * A pure function that performs the full "roll-up" calculation of all analytics.
 * @param currentFormData The current state of the application data.
 * @returns A new FormData object with all calculated metrics populated.
 */
const performFullCalculation = (currentFormData: FormData): FormData => {
    // Step 1: Calculate updated module metrics for all modules, including archived.
    // This ensures that when a module is unarchived, its data is up-to-date.
    const updatedModules = currentFormData.modules.map(module => {
        const moduleAssessments = currentFormData.importedAssessments.filter(
            a => a.moduleCode === module.moduleCode
        );
        const calculatedMetrics = calculateModuleMetrics(module, moduleAssessments);
        return { ...module, ...calculatedMetrics };
    });

    // Step 2: Calculate updated term metrics using ONLY ACTIVE modules.
    const updatedTerms = currentFormData.degree.terms.map(term => {
        // FIX: Property 'termId' does not exist on type '...'. Use 'anchorTermId' instead.
        const modulesInTerm = updatedModules.filter(m => m.anchorTermId === term.id && m.status !== 'Archived');
        const termMetrics = calculateTermMetrics(term, modulesInTerm, currentFormData.importedAssessments);
        return { ...term, ...termMetrics };
    });

    // Step 3: Calculate updated degree metrics using ONLY ACTIVE modules.
    const activeUpdatedModules = updatedModules.filter(m => m.status !== 'Archived');
    const degreeMetrics = calculateDegreeMetrics(currentFormData.degree, activeUpdatedModules, updatedTerms);
    const updatedDegree = { ...currentFormData.degree, ...degreeMetrics, terms: updatedTerms };
    
    return {
        ...currentFormData,
        modules: updatedModules, // Return all modules to the main state
        degree: updatedDegree,
    };
};

const getAllTermsWithYears = (terms: AcademicTerm[]): AcademicTerm[] => {
    const allTermsWithYears: AcademicTerm[] = [...terms];
    const years = [...new Set(terms.map(t => t.academicYear))].sort((a, b) => a - b);

    years.forEach(year => {
        if (!allTermsWithYears.some(t => t.id === `year-${year}`)) {
            const yearTerm: AcademicTerm = {
                id: `year-${year}`,
                academicYear: year,
                termName: `${year} Academic Year`,
                startDate: format(startOfYear(new Date(year, 0, 1)), 'yyyy-MM-dd'),
                endDate: format(endOfYear(new Date(year, 0, 1)), 'yyyy-MM-dd'),
                parentTermId: null,
                durationInWeeks: 52,
                notionalHoursPerCredit: 10,
            };
            allTermsWithYears.push(yearTerm);
        }
    });

    return allTermsWithYears;
};


const AppViews: React.FC<{
    view: { name: string; params: Record<string, any> };
    formData: FormData;
    handleReturnToDashboard: () => void;
    updateModule: (updatedModule: Module, originalModuleCode?: string) => Promise<void>;
    deleteModule: (moduleCode: string) => Promise<void>;
    onReset: () => void;
    onModuleClick: (moduleId: string) => void;
    onNavigateToTermNavigator: () => void;
    onNavigateToSettings: (initialTab?: string) => void;
    onAddModule: (module: Module) => Promise<void>;
    appToast: string | null;
    onClearToast: () => void;
    updateFormData: <K extends keyof FormData>(section: K, data: FormData[K]) => void;
    updateModules: (modules: Module[]) => void;
    filterMode: FilterMode;
    onFilterModeChange: (mode: FilterMode) => void;
// FIX: Explicitly destructure all props to avoid a TypeScript inference issue with rest parameters that causes type mismatches.
}> = ({ 
    view, 
    formData, 
    handleReturnToDashboard, 
    updateModule, 
    deleteModule, 
    onReset, 
    onModuleClick, 
    onNavigateToTermNavigator, 
    onNavigateToSettings, 
    onAddModule, 
    appToast, 
    onClearToast, 
    updateFormData, 
    updateModules, 
    filterMode, 
    onFilterModeChange 
}) => {
    const { activeTermId } = useTerm();

    if (view.name === 'settings') {
      return <SettingsPage 
        onBack={handleReturnToDashboard} 
        initialTab={view.params.initialTab} 
        onReset={onReset}
        formData={formData}
        updateFormData={updateFormData}
        updateModules={updateModules}
        onUpdateModule={updateModule}
        onDeleteModule={deleteModule}
        filterMode={filterMode}
        onFilterModeChange={onFilterModeChange}
      />;
    }
    
    if (view.name === 'termNavigator') {
        const termForNavigator: AcademicTerm | null = activeTermId
            ? formData.degree.terms.find(term => term.id === activeTermId) || null
            : null;

        // FIX: Property 'termId' does not exist on type 'Module'. Use 'anchorTermId' instead.
        const modulesInTerm = termForNavigator ? formData.modules.filter(m => m.anchorTermId === termForNavigator.id && m.status !== 'Archived') : [];
        const moduleCodesInTerm = new Set(modulesInTerm.map(m => m.moduleCode));
        const assessmentsInTerm = formData.importedAssessments.filter(a => moduleCodesInTerm.has(a.moduleCode));

        return <TermNavigatorPage
            term={termForNavigator}
            modules={modulesInTerm}
            assessments={assessmentsInTerm}
            onBack={handleReturnToDashboard}
        />;
    }

    if (view.name === 'moduleDetails' && view.params.moduleId) {
        // FIX: Property 'id' does not exist on type 'Module'. Use 'offeringId' to find the module.
        const module = formData.modules.find(m => m.offeringId === view.params.moduleId);
        if (!module) {
            handleReturnToDashboard();
            return null;
        }
        const assessments = formData.importedAssessments.filter(a => a.moduleCode === module.moduleCode);
        return <ModuleDetailsPage
            module={module}
            moduleAssessments={assessments}
            allAssessments={formData.importedAssessments}
            allModules={formData.modules}
            allTerms={formData.degree.terms}
            onBack={handleReturnToDashboard}
            onUpdateModule={updateModule}
            onDeleteModule={deleteModule}
        />;
    }

    return (
        <Dashboard
            formData={formData}
            onReset={onReset}
            onModuleClick={onModuleClick}
            onNavigateToTermNavigator={onNavigateToTermNavigator}
            onNavigateToSettings={onNavigateToSettings}
            onAddModule={onAddModule}
            toastMessage={appToast}
            onClearToast={onClearToast}
            filterMode={filterMode}
        />
    );
};


const App: React.FC = () => {
  const [step, setStep] = useState<SetupStep>(SetupStep.AcademicInfo);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [view, setView] = useState<{ name: string; params: Record<string, any> }>({ name: 'dashboard', params: {} });
  const [appToast, setAppToast] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('smart');
  const [initState, dispatchInit] = useReducer(initializationReducer, initialInitState);


  // Load UI preferences from localStorage and core data from SQLite on startup
  useEffect(() => {
    async function startup() {
      // Phase 1: Check Environment
      dispatchInit({ type: InitPhase.CHECKING_ENVIRONMENT });
      await new Promise(resolve => setTimeout(resolve, 250)); // UI delay
      
      try {
        if (typeof localStorage === 'undefined') {
          throw new Error('localStorage is not available.');
        }
        // Test if we can write to localStorage
        localStorage.setItem('__test', '1');
        localStorage.removeItem('__test');
      } catch (e) {
        dispatchInit({
          type: InitPhase.FATAL_ERROR,
          payload: {
            title: 'Environment Error',
            description: 'Your browser does not support essential features (like localStorage) or has them disabled (e.g., in private browsing).\n\nPlease use a modern, non-private browser window to use this application.',
          },
        });
        return; // Halt execution
      }

      // Phase 2: Check Setup Status
      dispatchInit({ type: InitPhase.CHECKING_SETUP_STATUS });
      await new Promise(resolve => setTimeout(resolve, 250));
      
      const setupCompleteFlag = localStorageUtil.getSetupCompleteFlag();

      if (setupCompleteFlag === 'true') {
        // Path for returning user
        dispatchInit({ type: InitPhase.LOADING_DATABASE });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
            const coreData = await database.getAllCoreData();
            const dashboardSettings = await database.getDashboardSettings();
            if (dashboardSettings) {
                setFilterMode(dashboardSettings.default_filter_mode);
            }
            console.debug('Core data loaded:', coreData);

            dispatchInit({ type: InitPhase.HYDRATING_DATA });
            await new Promise(resolve => setTimeout(resolve, 500));

            if (coreData.degree.id) {
                const calculatedData = performFullCalculation(coreData);
                setFormData(calculatedData);
                dispatchInit({ type: InitPhase.READY });
            } else {
                 // Data is corrupt or missing, treat as fresh setup
                 setFormData(prev => ({
                    ...prev,
                    systemSettings: { ...prev.systemSettings, ...localStorageUtil.getSystemSettings() }
                }));
                dispatchInit({ type: InitPhase.SETUP_REQUIRED });
            }
        } catch (error) {
            console.error('Error loading data from database:', error);
            dispatchInit({
                type: InitPhase.FATAL_ERROR,
                payload: {
                    title: 'Database Load Failed',
                    description: `There was a problem loading your data. The database might be corrupted.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
            });
        }
      } else {
        // Path for first-time setup
        setFormData(prev => ({
          ...prev,
          systemSettings: { ...prev.systemSettings, ...localStorageUtil.getSystemSettings() }
        }));
        dispatchInit({ type: InitPhase.SETUP_REQUIRED });
      }
    }
    startup();
  }, []);

  useEffect(() => {
    const applyTheme = () => {
        const theme = formData.systemSettings.theme;
        const root = window.document.documentElement;
        const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        root.classList.toggle('dark', isDark);
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [formData.systemSettings.theme]);

  // Save systemSettings to localStorage whenever it changes
  useEffect(() => {
    localStorageUtil.setSystemSettings(formData.systemSettings);
  }, [formData.systemSettings]);

  // Save core data to SQLite whenever formData changes and setup is complete
  useEffect(() => {
    async function saveData() {
      if (initState.phase !== InitPhase.READY) return;
      try {
        await database.saveAcademicInfo(formData.academicInfo);
        await database.saveDegree(formData.degree);
        for (const module of formData.modules) {
          await database.saveModule(module);
        }
        if (formData.importedAssessments.length > 0) {
          database.setAssessmentBatchSize(formData.importedAssessments.length);
        }
        for (const assessment of formData.importedAssessments) {
          await database.saveAssessment(assessment);
        }
        await database.saveSystemSettings(formData.systemSettings);
      } catch (error) {
        console.error('Error saving data to database:', error);
      }
    }
    saveData();
  }, [formData, initState.phase]);

  const updateFormData = useCallback(<K extends keyof FormData>(section: K, data: FormData[K]) => {
    setFormData(prev => ({ ...prev, [section]: data }));
  }, []);
  
  const updateTerms = useCallback((newTerms: AcademicTerm[]) => {
      setFormData(prev => ({
          ...prev,
          degree: {
              ...prev.degree,
              terms: newTerms,
          }
      }));
  }, []);

  const updateModules = useCallback((newModules: Module[]) => {
    setFormData(prev => {
        // Prevent adding duplicate modules if the import step is run multiple times
        // FIX: Property 'id' does not exist on type 'Module'. Use 'offeringId' for unique identification.
        const existingModuleIds = new Set(prev.modules.map(m => m.offeringId));
        // FIX: Property 'id' does not exist on type 'Module'. Use 'offeringId' for unique identification.
        const uniqueNewModules = newModules.filter(m => !existingModuleIds.has(m.offeringId));
        if (uniqueNewModules.length === 0) return prev;

        return {
            ...prev,
            modules: [...prev.modules, ...uniqueNewModules],
        };
    });
  }, []);

  const addModule = useCallback(async (newModule: Module) => {
    // FIX: Property 'createModule' does not exist on type 'typeof database'. Use 'saveModule' instead.
    await database.saveModule(newModule);
    setFormData(prev => ({
        ...prev,
        modules: [...prev.modules, newModule],
    }));
  }, []);

  const updateModule = useCallback(async (updatedModule: Module, originalModuleCode?: string) => {
    const codeHasChanged = originalModuleCode && originalModuleCode !== updatedModule.moduleCode;

    // Save the module itself
    await database.saveModule(updatedModule);

    // If module code changed, update all related assessments
    if (codeHasChanged) {
        setFormData(prev => {
            const updatedAssessments = prev.importedAssessments.map(asm => {
                if (asm.moduleCode === originalModuleCode) {
                    const newAsm = { ...asm, moduleCode: updatedModule.moduleCode };
                    // The ID is based on module code, so it needs to be updated too.
                    newAsm.id = `${newAsm.moduleCode}-${newAsm.assessmentType}-${newAsm.assessmentName}`.toLowerCase();
                    return newAsm;
                }
                return asm;
            });
            
            // Delete old assessments from DB
            const assessmentsToDelete = prev.importedAssessments.filter(asm => asm.moduleCode === originalModuleCode);
            assessmentsToDelete.forEach(asm => database.deleteAssessment(asm.id));

            // Save new/updated assessments to DB
            const assessmentsToSave = updatedAssessments.filter(asm => asm.moduleCode === updatedModule.moduleCode);
            assessmentsToSave.forEach(asm => database.saveAssessment(asm));

            // FIX: Property 'id' does not exist on type 'Module'. Use 'offeringId' to find the module.
            const newModules = prev.modules.map(m => m.offeringId === updatedModule.offeringId ? updatedModule : m);
            return { ...prev, modules: newModules, importedAssessments: updatedAssessments };
        });
    } else {
        // If no code change, just update the module in state
        setFormData(prev => {
            // FIX: Property 'id' does not exist on type 'Module'. Use 'offeringId' to find the module.
            const newModules = prev.modules.map(m => m.offeringId === updatedModule.offeringId ? updatedModule : m);
            return { ...prev, modules: newModules };
        });
    }
  }, []);
  
  const deleteModule = useCallback(async (moduleCode: string) => {
    try {
        await database.deleteModuleAndChildren(moduleCode);
        setFormData(prev => {
            const newModules = prev.modules.filter(m => m.moduleCode !== moduleCode);
            const newAssessments = prev.importedAssessments.filter(a => a.moduleCode !== moduleCode);
            return {
                ...prev,
                modules: newModules,
                importedAssessments: newAssessments,
            };
        });
        setView({ name: 'dashboard', params: {} });
        setAppToast(`Module '${moduleCode}' and its data have been permanently deleted.`);
    } catch (error) {
        console.error("Failed to delete module:", error);
        setAppToast(`Error: Could not delete module '${moduleCode}'.`);
    }
  }, []);


  const recalculateAllAnalytics = useCallback(() => {
    setFormData(performFullCalculation);
  }, []);

  // This effect serves as the primary REAL-TIME trigger for the analytics engine.
  // It only runs AFTER the initial setup is complete.
  useEffect(() => {
    if (initState.phase === InitPhase.READY && formData.modules.length > 0) {
        recalculateAllAnalytics();
    }
  // The recalculateAllAnalytics function is memoized and contains a deep check
  // to prevent unnecessary state updates and infinite loops.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initState.phase, formData.importedAssessments, formData.modules]);

  // This effect handles the one-time BATCH calculation at the end of setup.
  useEffect(() => {
    if (step === SetupStep.Building) {
        // Use a timeout to ensure the "Building..." screen has a chance to render for good UX.
        const timer = setTimeout(() => {
            setFormData(currentFormData => {
                const finalCalculatedData = performFullCalculation(currentFormData);
                console.log('Final setup data (calculated):', finalCalculatedData);
                return finalCalculatedData;
            });
            
            // Mark setup as complete, which will trigger the transition to the dashboard.
            dispatchInit({ type: InitPhase.READY });
        }, 2000); // 2-second delay for the loading animation

        return () => clearTimeout(timer);
    }
  }, [step]);


  const handleNextStep = useCallback(() => {
    setStep(prev => Math.min(prev + 1, Object.keys(SetupStep).length / 2));
  }, []);

  const handlePrevStep = useCallback(() => {
    setStep(prev => Math.max(prev - 1, 1));
  }, []);
  
  const handleProceedToCalendar = useCallback(() => {
    setFormData(prev => {
        // If the user has not configured any terms yet, provide a default template.
        if (prev.degree.terms.length === 0) {
            console.log("No terms found for setup, applying default calendar template.");
            return {
                ...prev,
                degree: {
                    ...prev.degree,
                    terms: generateDefaultCalendar()
                }
            };
        }
        return prev;
    });
    handleNextStep();
  }, [handleNextStep]);

  const handleFinalSubmit = useCallback(async () => {
      // The new calendar data is already in formData state, so calculations will be performed next.
      console.log('Final setup data (pre-calculation):', formData);
      localStorageUtil.setSetupCompleteFlag('true');
      setStep(SetupStep.Building);
  }, [formData]);

  const resetSetup = useCallback(() => {
    // This is ONLY for cancelling during the setup wizard.
    dispatchInit({ type: InitPhase.SETUP_REQUIRED });
    setStep(SetupStep.AcademicInfo);
    setFormData(initialFormData);
    setView({ name: 'dashboard', params: {} });
  }, []);

  const handleResetApplication = useCallback(() => {
    try {
        database.eraseAllUserData();
        window.location.reload();
    } catch (error) {
        console.error("Failed to reset application:", error);
        alert("Failed to reset application. Please clear your browser's local storage manually and refresh the page.");
    }
  }, []);

  // Daily background tasks check on app startup
  useEffect(() => {
    if (initState.phase !== InitPhase.READY) return;

    const lastRun = localStorage.getItem('lastDailyRun');
    const today = new Date().toDateString();

    if (lastRun !== today) {
      setFormData(formData => {
        const updatedFormData = runDailyTasks(formData);
        localStorage.setItem('lastDailyRun', today);
        return updatedFormData;
      });
    }
  }, [initState.phase]);

  const handleFilterModeChange = useCallback(async (mode: FilterMode) => {
    setFilterMode(mode);
    await database.saveDashboardSettings({ default_filter_mode: mode });
  }, []);

  const handleSelectModule = (offeringId: string) => {
    setView({ name: 'moduleDetails', params: { moduleId: offeringId } });
  };
  const handleReturnToDashboard = () => {
    setView({ name: 'dashboard', params: {} });
  };
  const handleNavigateToTermNavigator = () => {
    setView({ name: 'termNavigator', params: {} });
  };
  const handleNavigateToSettings = (initialTab: string = 'profile') => {
    setView({ name: 'settings', params: { initialTab } });
  };

  if (initState.phase === InitPhase.FATAL_ERROR) {
    return <FatalErrorScreen title={initState.error!.title} description={initState.error!.description} />;
  }

  if (initState.phase !== InitPhase.READY && initState.phase !== InitPhase.SETUP_REQUIRED) {
      return <InitializationScreen state={initState} />;
  }
  
  if (initState.phase === InitPhase.READY) {
      const allDisplayableTerms = getAllTermsWithYears(formData.degree.terms);
      return (
          <TermProvider terms={allDisplayableTerms}>
              <AppViews
                  view={view}
                  formData={formData}
                  handleReturnToDashboard={handleReturnToDashboard}
                  updateModule={updateModule}
                  deleteModule={deleteModule}
                  onReset={handleResetApplication}
                  onModuleClick={handleSelectModule}
                  onNavigateToTermNavigator={handleNavigateToTermNavigator}
                  onNavigateToSettings={handleNavigateToSettings}
                  onAddModule={addModule}
                  appToast={appToast}
                  // FIX: Pass the `onClearToast` handler to the Dashboard correctly.
                  onClearToast={() => setAppToast(null)}
                  updateFormData={updateFormData}
                  updateModules={updateModules}
                  filterMode={filterMode}
                  onFilterModeChange={handleFilterModeChange}
              />
          </TermProvider>
      );
  }


  const steps = [
    'Academic Info',
    'Confirm Details',
    'Calendar Setup',
    'Import Data',
    'System Settings',
    'Finalizing'
  ];

  const renderStep = () => {
    switch (step) {
      case SetupStep.AcademicInfo:
        return <AcademicInfoForm 
                    academicInfo={formData.academicInfo}
                    degree={formData.degree}
                    setAcademicInfo={(data) => updateFormData('academicInfo', data)} 
                    setDegree={(data) => updateFormData('degree', data)}
                    onNext={handleNextStep} 
                    onCancel={resetSetup}
                />;
      case SetupStep.Confirmation:
        return <ConfirmationStep academicInfo={formData.academicInfo} degree={formData.degree} onNext={handleProceedToCalendar} onBack={handlePrevStep} />;
      case SetupStep.ManageCalendar:
        return <ManageCalendarPage 
                    isSetupMode={true}
                    initialTermsData={formData.degree.terms}
                    onBack={handlePrevStep} 
                    onNext={handleNextStep}
                    onSaveSetupData={updateTerms}
                />;
      case SetupStep.ImportCSV:
        return <ImportCsvStep 
                    onNext={handleNextStep} 
                    onSkip={handleNextStep}
                    calendarPeriods={formData.degree.terms}
                    setImportedAssessments={(data) => {
                        updateFormData('importedAssessments', data);
                        updateFormData('csvImported', data.length > 0);
                    }}
                    updateModules={updateModules}
                />;
      case SetupStep.SystemSettings:
        return <SystemSettingsStep settings={formData.systemSettings} setSettings={(data) => updateFormData('systemSettings', data)} onNext={handleFinalSubmit} onBack={handlePrevStep} />;
      case SetupStep.Building:
        return <BuildingDashboardStep />;
      default:
        return <div>Unknown Step</div>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-slate-900">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-200">Academic-OS Setup</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Let's get your academic profile ready.</p>
        </header>
        <div className="mb-8 px-4">
            <Stepper steps={steps} currentStep={step-1} />
        </div>
        <main className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 transition-all duration-300">
          {renderStep()}
        </main>
      </div>
    </div>
  );
};

export default App;
