import React from 'react';
import { Module } from '../../types';
import { calculateRequiredAverage, calculateGapToTarget, calculateExamEntranceGap } from '../../utils/moduleCalculations';
import { NotAvailable } from '../../utils/uiHelpers';
import { Icon } from '../ui/Icon';

interface Props {
  module: Module;
  highlightedFields: Set<string>;
}

const VitalSignsPanel: React.FC<Props> = ({ module, highlightedFields }) => {
  return (
    <aside className="space-y-6">
      <HeroMetricsCard module={module} />
      <GoalsAndGatesCard module={module} highlightedFields={highlightedFields} />
      <WeeklyPlanCard module={module} />
    </aside>
  );
};

// --- Sub-Components ---

const HeroMetricsCard: React.FC<{ module: Module }> = ({ module }) => {
    const completion = module.calculated_completion_progress ?? 0;

    const projectedGrade = module.calculated_projected_final_grade;
    const isCapped = projectedGrade && projectedGrade > 100;
    const displayProjected = isCapped ? 100 : projectedGrade;
    const tooltipText = isCapped ? `100% (capped from ${projectedGrade?.toFixed(1)}%)` : '';
    
    const hasFinalGrade = module.calculated_final_grade !== undefined && module.calculated_final_grade !== null;

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Current Semester Grade</p>
                    <div className="flex items-baseline gap-2 mt-1">
                        <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                            {module.calculated_current_grade !== undefined ? (
                                <>{module.calculated_current_grade.toFixed(1)}<span className="text-2xl">%</span></>
                            ) : (
                                <NotAvailable tooltipText="No graded work submitted yet." />
                            )}
                        </p>
                        {/* Placeholder trend arrow */}
                        <div title="Module Trend">
                            <Icon name="TrendingUp" className="w-5 h-5 text-green-500" />
                        </div>
                    </div>
                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Points Accumulated: <strong>{module.calculated_patfg?.toFixed(1) ?? '0.0'}%</strong>
                    </p>
                </div>
                <div className="text-right">
                    {hasFinalGrade ? (
                        <>
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Final Grade</p>
                            <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-2">
                                {module.calculated_final_grade?.toFixed(1)}%
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Projected Final Grade</p>
                             <div className="text-base font-bold text-slate-800 dark:text-slate-200 mt-2" title={tooltipText}>
                                {displayProjected !== undefined ? `${displayProjected.toFixed(1)}%` : <NotAvailable />}
                            </div>
                        </>
                    )}
                </div>
            </div>
            <div className="mt-4">
                <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    <span>Completion Progress</span>
                    <span>{completion.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${completion}%` }}></div>
                </div>
            </div>
        </div>
    );
};

const AttainabilityTag: React.FC<{ requiredAvg: number | null }> = ({ requiredAvg }) => {
  let text = '';
  let colorClasses = '';
  let valueText: React.ReactNode = '';

  if (requiredAvg === null || requiredAvg > 100) {
    text = 'Currently Unattainable';
    colorClasses = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    valueText = requiredAvg && requiredAvg > 100 ? `>100%` : <NotAvailable tooltipText="Goal is no longer mathematically possible." />;
  } else if (requiredAvg > 90) {
    text = 'Very Hard';
    colorClasses = 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
    valueText = `${requiredAvg.toFixed(1)}%`;
  } else if (requiredAvg > 75) {
    text = 'Stretch';
    colorClasses = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    valueText = `${requiredAvg.toFixed(1)}%`;
  } else {
    text = 'Attainable';
    colorClasses = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    valueText = `${Math.max(0, requiredAvg).toFixed(1)}%`;
  }
  
  return (
    <div className="text-right">
      <p className="font-bold text-slate-900 dark:text-slate-100">{valueText}</p>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorClasses}`}>{text}</span>
    </div>
  );
};


const GateRow: React.FC<{ label: string, requirement: number | undefined, isMet: boolean, hint?: string, highlight: boolean }> = ({ label, requirement, isMet, hint, highlight }) => {
    if (requirement === undefined || requirement === null) return null;

    return (
        <div className={`p-1 -m-1 rounded-md ${highlight ? 'animate-flash' : ''}`}>
            <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                    {isMet ? <Icon name="Check" className="w-4 h-4 text-green-500" strokeWidth={3} /> : <Icon name="X" className="w-4 h-4 text-red-500" strokeWidth={3} />}
                    <p className="text-slate-600 dark:text-slate-400">{label}</p>
                </div>
                <p className="font-bold text-slate-900 dark:text-slate-100">{requirement}%</p>
            </div>
            {!isMet && hint && (
                 <p className="text-xs text-amber-600 dark:text-amber-400 text-right mt-0.5">{hint}</p>
            )}
        </div>
    );
}

const GoalsAndGatesCard: React.FC<{ module: Module, highlightedFields: Set<string> }> = ({ module, highlightedFields }) => {
    const requiredForTarget = calculateRequiredAverage(module.targetFinalGrade, module.calculated_patfg, module.calculated_completion_progress);
    const requiredToPass = calculateRequiredAverage(module.minFinalGrade, module.calculated_patfg, module.calculated_completion_progress);
    const gapToTarget = calculateGapToTarget(module.targetFinalGrade, module.calculated_patfg);
    const examEntranceGap = calculateExamEntranceGap(module.minExamEntrance, module.calculated_current_grade);

    const isMinFinalGradeMet = (module.calculated_final_grade ?? -1) >= module.minFinalGrade;
    const isExamEntranceMet = (module.calculated_current_grade ?? -1) >= (module.minExamEntrance ?? Infinity);
    const isMinExamGradeMet = isMinFinalGradeMet; 

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
             <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">Goals & Gates</h3>
             <div className="space-y-6">
                 {/* Target Path Group */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Icon name="Target" className="w-6 h-6 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                        <h4 className="font-semibold text-slate-700 dark:text-slate-300">Target Path</h4>
                    </div>
                    <div className="space-y-3 pl-[1.125rem] border-l-2 border-slate-200 dark:border-slate-700 ml-3">
                        <InfoRow label="Target Final Grade" value={`${module.targetFinalGrade}%`} highlight={highlightedFields.has('targetFinalGrade')} />
                        {gapToTarget !== null && <InfoRow label="Gap to Target" value={`${gapToTarget.toFixed(1)} pts`} />}
                        <div className={`flex justify-between items-start text-sm p-1 -m-1 rounded-md ${highlightedFields.has('targetFinalGrade') ? 'animate-flash' : ''}`}>
                             <p className="text-slate-600 dark:text-slate-400 pt-0.5">Required Average on Remaining (Target)</p>
                             <AttainabilityTag requiredAvg={requiredForTarget} />
                        </div>
                         <InfoRow 
                            label="Maximum Achievable" 
                            value={module.calculated_max_achievable_grade !== undefined ? `${module.calculated_max_achievable_grade.toFixed(1)}%` : <NotAvailable />} 
                        />
                    </div>
                </div>

                 {/* Pass Gates Group */}
                <div>
                     <div className="flex items-center gap-2 mb-3">
                        <Icon name="Focus" className="w-6 h-6 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} />
                        <h4 className="font-semibold text-slate-700 dark:text-slate-300">Pass Gates</h4>
                    </div>
                    <div className="space-y-3 pl-[1.125rem] border-l-2 border-slate-200 dark:border-slate-700 ml-3">
                        <GateRow 
                            label="Min Final Grade"
                            requirement={module.minFinalGrade}
                            isMet={isMinFinalGradeMet}
                            hint={!isMinFinalGradeMet ? `Req. avg. to pass: ${requiredToPass === null ? 'N/A' : `${Math.max(0, requiredToPass).toFixed(1)}%`}` : undefined}
                            highlight={highlightedFields.has('minFinalGrade')}
                        />
                         <GateRow 
                            label="Min Exam Entrance"
                            requirement={module.minExamEntrance}
                            isMet={isExamEntranceMet}
                            hint={!isExamEntranceMet ? `Exam Entrance Gap: ${examEntranceGap?.toFixed(1) ?? 'N/A'} pts` : undefined}
                            highlight={highlightedFields.has('minExamEntrance')}
                        />
                         <GateRow 
                            label="Min Exam Grade"
                            requirement={module.minExamGrade}
                            isMet={isMinExamGradeMet}
                            hint={!isMinExamGradeMet ? 'Required on exam' : undefined}
                            highlight={highlightedFields.has('minExamGrade')}
                        />
                    </div>
                </div>
             </div>
        </div>
    );
};

const WeeklyPlanCard: React.FC<{ module: Module }> = ({ module }) => {
    const weeklyStudyGoal = 5; // Placeholder
    const actualHours = (module.calculated_weekly_time_spent ?? 0) / 60;
    const suggestedHours = Math.max(0, weeklyStudyGoal - actualHours);

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
             <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">This Week's Plan</h3>
             <div className="grid grid-cols-3 text-center mb-4">
                 <MetricDisplay label="Goal" value={`${weeklyStudyGoal}h`} />
                 <MetricDisplay label="Logged" value={actualHours.toFixed(1) + 'h'} />
                 <MetricDisplay label="Remaining" value={suggestedHours.toFixed(1) + 'h'} />
             </div>
             <div className="flex gap-2">
                 <button className="flex-1 text-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700 shadow-sm">Start Pomodoro</button>
                 <button className="flex-1 text-center px-4 py-2 bg-slate-200 dark:bg-slate-700 font-medium rounded-lg text-sm hover:bg-slate-300 dark:hover:bg-slate-600">Add Study Session</button>
             </div>
        </div>
    );
}

const InfoRow: React.FC<{label: string, value: React.ReactNode, highlight?: boolean}> = ({ label, value, highlight = false }) => {
    return (
        <div className={`flex justify-between items-center text-sm p-1 -m-1 rounded-md ${highlight ? 'animate-flash' : ''}`}>
            <p className="text-slate-600 dark:text-slate-400">{label}</p>
            <div className='font-bold text-slate-900 dark:text-slate-100'>{value}</div>
        </div>
    );
}

const MetricDisplay: React.FC<{label: string, value: string}> = ({ label, value }) => (
    <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
        <p className="text-xs uppercase text-slate-600 dark:text-slate-400">{label}</p>
    </div>
);


export default VitalSignsPanel;