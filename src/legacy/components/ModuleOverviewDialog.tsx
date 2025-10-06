import React, { useMemo, useEffect } from 'react';
import { Module, Assessment } from '../types';
import { format, parseISO, differenceInDays, formatDistanceToNowStrict } from 'date-fns';
import { calculatePriorityScore } from '../services/analytics';
import { Icon, IconName } from './ui/Icon';

// --- Helper Functions & Components ---

const getModuleStatus = (module: Module): { text: string; color: string; icon: React.ReactElement } => {
    const { calculated_current_grade, targetFinalGrade, minFinalGrade } = module;
    const iconOk = <Icon name="CheckCircle2" />;
    const iconWarn = <Icon name="AlertTriangle" />;
    const iconFail = <Icon name="XCircle" />;

    if (calculated_current_grade === undefined || calculated_current_grade === null) return { text: 'No Grade Data', color: 'slate', icon: iconWarn };
    if (calculated_current_grade >= targetFinalGrade) return { text: 'On Track', color: 'green', icon: iconOk };
    if (calculated_current_grade >= (minFinalGrade ?? 50)) return { text: 'Needs Attention', color: 'yellow', icon: iconWarn };
    return { text: 'At Risk', color: 'red', icon: iconFail };
};

const ActionButton: React.FC<{ icon: React.ReactElement, text: string }> = ({ icon, text }) => (
    <button className="flex-1 flex items-center justify-center gap-2 px-2 py-1.5 bg-slate-100 dark:bg-slate-700/80 rounded-md text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
        {icon}
        <span>{text}</span>
    </button>
);


// --- Main Dialog Component ---

interface ModuleOverviewDialogProps {
    module: Module;
    assessments: Assessment[];
    onClose: () => void;
    onViewDetails: (offeringId: string) => void;
    today: Date;
}

const ModuleOverviewDialog: React.FC<ModuleOverviewDialogProps> = ({ module, assessments, onClose, onViewDetails, today }) => {
  
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const status = getModuleStatus(module);
  const completion = module.calculated_completion_progress ?? 0;
  const categoryPerformance = module.calculated_category_performance ?? {};

  const upcomingAssessments = useMemo(() => {
    return assessments
      .filter(a => a.status === 'Upcoming' && a.dueDate !== 'TBC' && parseISO(a.dueDate) >= today)
      .map(a => ({ ...a, priority: calculatePriorityScore(a, today) }))
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }, [assessments, today]);

  const nextAssessment = upcomingAssessments[0] || null;
  const topTwoItems = upcomingAssessments.slice(0, 2);

  const weeklyStudyGoalHours = 5; // Placeholder for a future setting
  const actualStudyHours = (module.calculated_weekly_time_spent ?? 0) / 60;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div 
        className="bg-slate-50 dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col transform animate-slide-up" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <header className="p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-slate-50 dark:bg-slate-800 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 id="dialog-title" className="text-2xl font-bold text-slate-900 dark:text-slate-100">{module.moduleCode}: {module.moduleName}</h2>
              <div className={`flex items-center gap-1.5 text-xs font-medium text-${status.color}-600 dark:text-${status.color}-400 px-2 py-1 bg-${status.color}-100 dark:bg-${status.color}-900/50 rounded-full mt-1`}>
                <div className="w-4 h-4">{status.icon}</div>
                {status.text}
              </div>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100" aria-label="Close dialog">
              <Icon name="X" className="w-6 h-6" strokeWidth={1.5} />
            </button>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Current Mark</p>
              <div className="flex items-center gap-2">
                <p className="text-4xl font-bold text-slate-900 dark:text-slate-100">{module.calculated_current_grade?.toFixed(1) ?? 'N/A'}<span className="text-2xl">%</span></p>
                <Icon name="TrendingUp" className="w-5 h-5 text-green-500" />
              </div>
            </div>
            <div className="flex-grow w-full sm:w-auto">
              <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                <span>Grade Locked In</span>
                <span>{completion.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${completion}%` }}></div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 space-y-8 flex-grow">
          {/* What is next */}
          <section>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">What's Next</h3>
            {nextAssessment && <p className="text-sm text-slate-600 dark:text-slate-400">Your next item is the <strong>{nextAssessment.assessmentName}</strong>, due {formatDistanceToNowStrict(parseISO(nextAssessment.dueDate), { addSuffix: true })}.</p>}
            
            <div className="mt-4 space-y-3">
              {topTwoItems.length > 0 ? topTwoItems.map(item => (
                <div key={item.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900/50">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{item.assessmentName}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{item.assessmentType} &middot; {item.weight}% Weight</p>
                        </div>
                        <div className="text-right text-sm">
                            <p className="font-semibold text-blue-600 dark:text-blue-400">{formatDistanceToNowStrict(parseISO(item.dueDate))}</p>
                            <p className="text-xs text-slate-400">{format(parseISO(item.dueDate), 'EEE, d MMM')}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs mt-3">
                        <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700">Effort: <strong>{item.effort}</strong></span>
                        <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700">Due Date: <strong>Final</strong></span>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <ActionButton icon={<Icon name="Timer" className="w-4 h-4" strokeWidth={1.5} />} text="Start Pomodoro" />
                        <ActionButton icon={<Icon name="History" className="w-4 h-4" strokeWidth={1.5} />} text="Snooze/Plan" />
                        <ActionButton icon={<Icon name="Upload" className="w-4 h-4" strokeWidth={1.5} />} text="Quick Submit" />
                    </div>
                </div>
              )) : <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No upcoming items to prioritize. You're all clear!</p>}
            </div>
          </section>

          {/* Context for focus */}
          <section>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Context for Focus</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2 text-slate-700 dark:text-slate-300">Category Performance</h4>
                <div className="space-y-2">
                  {Object.keys(categoryPerformance).length > 0 ? Object.entries(categoryPerformance).map(([cat, avg]) => (
                    <div key={cat}>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium text-slate-600 dark:text-slate-300">{cat}</span>
                            <span className="font-mono text-slate-500 dark:text-slate-400">{(avg as number).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5">
                           <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${avg}%`}}></div>
                        </div>
                    </div>
                  )) : <p className="text-xs text-slate-500 dark:text-slate-400">No graded items yet.</p>}
                </div>
              </div>
              <div className="space-y-4">
                  <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg flex justify-around text-center">
                    <div>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-500">{module.calculated_late_count ?? 0}</p>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Overdue</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{module.calculated_upcoming_count ?? 0}</p>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Next 7 Days</p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2 text-slate-700 dark:text-slate-300">Weekly Study Goal</h4>
                    <div className="flex items-center justify-between">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{actualStudyHours.toFixed(1)}</p>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Hours Logged</p>
                        </div>
                         <div className="text-center">
                            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{weeklyStudyGoalHours}</p>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Hour Goal</p>
                        </div>
                    </div>
                  </div>
              </div>
            </div>
          </section>
        </main>
        
        {/* Footer */}
        <footer className="p-6 border-t border-slate-200 dark:border-slate-700 sticky bottom-0 bg-slate-50 dark:bg-slate-800 z-10">
          <button onClick={() => onViewDetails(module.offeringId)} className="w-full text-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors">
            View Full Module Details
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ModuleOverviewDialog;