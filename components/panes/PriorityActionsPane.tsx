import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Assessment, AssessmentStatus, EffortCategory, AcademicTerm } from '../../types';
import { format, parseISO, differenceInDays, isWithinInterval, addDays } from 'date-fns';
import { calculatePriorityScore } from '../../services/analytics';
import { ASSESSMENT_TYPE_ICONS } from '../icons';

interface Props {
    assessments: Assessment[];
    today: Date;
    term: AcademicTerm | null;
    activeDayFilter: string | null;
    activeWeekFilter: number | null;
    isLoading: boolean;
}

const EFFORT_MAP: Record<EffortCategory, number> = {
  'Quick Win': 3,
  'Standard': 8,
  'Deep Dive': 15,
  'Emergency Rescue': 20,
  'Group Project': 12,
};

const getUpdatedStatus = (assessment: Assessment, today: Date): AssessmentStatus => {
  if (assessment.result !== undefined && assessment.result !== null) return 'Graded';
  if (assessment.dueDate && assessment.dueDate !== 'TBC') {
    if (parseISO(assessment.dueDate) < today) return 'Missed';
  }
  return 'Upcoming';
};

const PriorityScorePill: React.FC<{ score: number }> = ({ score }) => {
  const { label, colorClasses } = useMemo(() => {
    if (score > 130) return { label: 'Critical', colorClasses: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' };
    if (score > 90) return { label: 'High', colorClasses: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' };
    if (score > 50) return { label: 'Medium', colorClasses: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' };
    return { label: 'Low', colorClasses: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' };
  }, [score]);
  return <span className={`text-xs font-medium px-2 py-1 rounded-full ${colorClasses}`}>{label}</span>;
};


const PriorityActionsPane: React.FC<Props> = ({ assessments, today, term, activeDayFilter, activeWeekFilter, isLoading }) => {
    const [pomodoroMenu, setPomodoroMenu] = useState<string | null>(null);
    const [pulsingItemId, setPulsingItemId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const prevTopItemId = useRef<string | null>(null);
    
    const priorityList = useMemo(() => {
        const upcoming = assessments
            .map(a => ({
                ...a,
                status: getUpdatedStatus(a, today),
                calculated_priority_score: calculatePriorityScore(a, today),
            }))
            .filter(a => a.status === 'Upcoming' && a.dueDate && a.dueDate !== 'TBC');
        
        const sorted = upcoming.sort((a,b) => (b.calculated_priority_score ?? 0) - (a.calculated_priority_score ?? 0));
        
        if (activeWeekFilter && term) {
            const termStartDate = parseISO(term.startDate);
            const weekStartDate = addDays(termStartDate, (activeWeekFilter - 1) * 7);
            const weekEndDate = addDays(weekStartDate, 6);

            return sorted.filter(a => {
                if (!a.dueDate || a.dueDate === 'TBC') return false;
                const dueDate = parseISO(a.dueDate);
                return isWithinInterval(dueDate, { start: weekStartDate, end: weekEndDate });
            });
        }

        if (activeDayFilter) {
            return sorted.filter(a => a.dueDate === activeDayFilter);
        }

        return sorted.slice(0, 3);
    }, [assessments, today, activeDayFilter, activeWeekFilter, term]);

    useEffect(() => {
        const topItem = priorityList[0];
        if (topItem && topItem.id !== prevTopItemId.current) {
            setPulsingItemId(topItem.id);
            const timer = setTimeout(() => setPulsingItemId(null), 800); // Animation duration
            return () => clearTimeout(timer);
        }
        prevTopItemId.current = topItem?.id || null;
    }, [priorityList]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setPomodoroMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const heading = activeWeekFilter ? `Actions for Week ${activeWeekFilter}` : activeDayFilter ? `Actions for ${format(parseISO(activeDayFilter), 'MMM d')}` : 'Priority Actions';

    if (isLoading) {
        return (
             <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm animate-pulse">
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="border-b border-slate-200 dark:border-slate-700 pb-4 last:border-b-0">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3"></div>
                            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">{heading}</h2>
            {priorityList.length > 0 ? (
                <ul className="space-y-4">
                    {priorityList.map((assessment, index) => (
                        <li key={assessment.id} className={`border-b border-slate-200 dark:border-slate-700 pb-4 last:border-b-0 ${pulsingItemId === assessment.id && !activeDayFilter && index === 0 ? 'animate-pulse-once' : ''}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-blue-700 dark:text-blue-400 text-sm flex items-center gap-1.5">
                                        <span className="text-slate-500 dark:text-slate-400">{ASSESSMENT_TYPE_ICONS[assessment.assessmentType]}</span>
                                        {assessment.moduleCode}
                                    </p>
                                    <p className="font-bold text-slate-800 dark:text-slate-200">{assessment.assessmentName}</p>
                                </div>
                                <PriorityScorePill score={assessment.calculated_priority_score ?? 0} />
                            </div>
                            <div className="flex justify-between items-center mt-2 text-xs">
                                <p className="font-medium text-amber-600 dark:text-amber-400">
                                    Due in {differenceInDays(parseISO(assessment.dueDate), today)} days
                                </p>
                                <div className="flex gap-2">
                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700">Wt: <strong>{assessment.weight}%</strong></span>
                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700">Effort: <strong>{EFFORT_MAP[assessment.effort]}pts</strong></span>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <div className="relative flex-1">
                                    <button onClick={() => setPomodoroMenu(pomodoroMenu === assessment.id ? null : assessment.id)} className="w-full px-3 py-1.5 bg-blue-600 text-white font-semibold rounded-lg text-xs hover:bg-blue-700">Start Pomodoro</button>
                                    {pomodoroMenu === assessment.id && (
                                        <div ref={menuRef} className="absolute bottom-full mb-1 w-full bg-white dark:bg-slate-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                                            <a href="#" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600">25 Minutes</a>
                                            <a href="#" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600">50 Minutes</a>
                                        </div>
                                    )}
                                </div>
                                <button className="flex-1 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-300 dark:hover:bg-slate-600">Quick Submit</button>
                            </div>
                        </li>
                    ))}
                     <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                        <button className="w-full text-center px-4 py-2 bg-slate-100 dark:bg-slate-700/80 text-sm font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">See all actions</button>
                        <button className="w-full text-center px-4 py-2 bg-slate-100 dark:bg-slate-700/80 text-sm font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">Plan my week</button>
                    </div>
                </ul>
            ) : (
                <div className="text-center py-4">
                    <p className="text-2xl">🎉</p>
                    <p className="font-semibold mt-2 text-slate-800 dark:text-slate-200">All caught up!</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {activeDayFilter || activeWeekFilter ? 'No actions for this period.' : 'No urgent tasks due soon.'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default PriorityActionsPane;