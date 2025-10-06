import React, { useMemo, useState } from 'react';
import { AcademicTerm, Assessment, Module, AssessmentStatus } from '../../types';
import { parseISO, differenceInDays, formatDistanceToNowStrict, differenceInCalendarWeeks, format } from 'date-fns';
import { NotAvailable } from '../../utils/uiHelpers';


interface Props {
    term: AcademicTerm;
    modules: Module[];
    assessments: Assessment[];
    today: Date;
    isLoading: boolean;
}

const getUpdatedStatus = (assessment: Assessment, today: Date): AssessmentStatus => {
  if (assessment.result !== undefined && assessment.result !== null) return 'Graded';
  if (assessment.dueDate && assessment.dueDate !== 'TBC') {
    if (parseISO(assessment.dueDate) < today) return 'Missed';
  }
  return 'Upcoming';
};


const TermTimelinePane: React.FC<Props> = ({ term, modules, assessments, today, isLoading }) => {
    const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);

    const termProgress = useMemo(() => {
        try {
            const termStart = parseISO(term.startDate);
            const termEnd = parseISO(term.endDate);
            
            const totalDays = differenceInDays(termEnd, termStart);
            const elapsedDays = differenceInDays(today, termStart);
            const currentWeek = Math.floor(elapsedDays / 7) + 1;
            const remainingDays = Math.max(0, differenceInDays(termEnd, today));
            const remainingWeeks = term.durationInWeeks - currentWeek;
            
            return {
                currentWeek: Math.max(1, Math.min(currentWeek, term.durationInWeeks)),
                totalWeeks: term.durationInWeeks,
                remainingDays,
                remainingWeeks: Math.max(0, remainingWeeks),
                progressPercent: totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0
            };
        } catch {
            return null;
        }
    }, [term, today]);
    
    const { firstExam, remainingWeightBeforeExams } = useMemo(() => {
        const moduleCodesInTerm = new Set(modules.map(m => m.moduleCode));
        const termAssessments = assessments.filter(a => moduleCodesInTerm.has(a.moduleCode));

        const upcomingAssessments = termAssessments.filter(a => {
             const status = getUpdatedStatus(a, today);
             return status === 'Upcoming' && a.dueDate !== 'TBC' && parseISO(a.dueDate) >= today;
        });
        
        const firstExamInTerm = upcomingAssessments
            .filter(a => a.assessmentType === 'Exam')
            .sort((a,b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime())[0] || null;

        let weight = 0;
        if (!firstExamInTerm) {
            weight = upcomingAssessments.reduce((sum, a) => sum + a.weight, 0);
        } else {
            const examDate = parseISO(firstExamInTerm.dueDate);
            weight = upcomingAssessments
                .filter(a => parseISO(a.dueDate) < examDate)
                .reduce((sum, a) => sum + a.weight, 0);
        }

        return { 
            firstExam: firstExamInTerm,
            remainingWeightBeforeExams: weight,
        };
    }, [assessments, modules, today]);

    const assessmentsByWeek = useMemo(() => {
        const weeklyMap: Record<number, { name: string; weight: number }[]> = {};
        const termStartDate = parseISO(term.startDate);
        const moduleCodesInTerm = new Set(modules.map(m => m.moduleCode));
        const termAssessments = assessments.filter(a => moduleCodesInTerm.has(a.moduleCode));

        for (const assessment of termAssessments) {
            if (assessment.dueDate && assessment.dueDate !== 'TBC') {
                try {
                    const dueDate = parseISO(assessment.dueDate);
                    if (dueDate >= termStartDate && dueDate <= parseISO(term.endDate)) {
                        const weekNumber = differenceInCalendarWeeks(dueDate, termStartDate) + 1;
                        if (weekNumber > 0) {
                            if (!weeklyMap[weekNumber]) weeklyMap[weekNumber] = [];
                            weeklyMap[weekNumber].push({ name: assessment.assessmentName, weight: assessment.weight });
                        }
                    }
                } catch (e) {
                    console.error("Could not parse assessment date:", assessment.dueDate);
                }
            }
        }
        return weeklyMap;
    }, [assessments, modules, term.startDate, term.endDate]);


    const timelineData = term.calculated_cumulative_weight_timeline ?? {};
    const weeks = Object.keys(timelineData).map(Number).sort((a, b) => a - b);
    const maxWeight = Math.max(...Object.values(timelineData), 100);
    const clampedWeight = Math.min(100, remainingWeightBeforeExams);

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm animate-pulse">
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-6"></div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                    <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                </div>
                <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4"></div>
                <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm h-full flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Term Timeline & Progress</h2>
            {termProgress ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    {term.termName} — Week {termProgress.currentWeek} of {termProgress.totalWeeks} ({termProgress.remainingWeeks} weeks remaining)
                </p>
            ) : (
                 <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{term.termName} ({term.academicYear})</p>
            )}

            <div className="grid grid-cols-2 gap-4 text-center mb-4">
                <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 dark:text-slate-400">First Exam In</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-slate-200" title={firstExam ? format(parseISO(firstExam.dueDate), 'd MMMM yyyy') : 'No upcoming exam'}>
                        {firstExam ? formatDistanceToNowStrict(parseISO(firstExam.dueDate)) : <NotAvailable tooltipText="No exams scheduled in this term." />}
                    </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Teaching Days Left</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-slate-200">
                        {termProgress ? termProgress.remainingDays : <NotAvailable />}
                    </p>
                </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg text-center mb-4">
                 {remainingWeightBeforeExams > 100 && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 font-medium text-center mb-1" role="alert">
                        Review assessment weights
                    </div>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400">Remaining Weight Before Exams</p>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-200">
                    {clampedWeight.toFixed(0)}%
                </p>
            </div>


            <div className="flex-grow flex flex-col">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Cumulative Weight Timeline</p>
                <div className="flex gap-1 items-end flex-grow bg-slate-100 dark:bg-slate-700/50 p-2 rounded-md h-24">
                    {weeks.length > 0 ? weeks.map(week => {
                        const weight = timelineData[week];
                        const height = maxWeight > 0 ? (weight / maxWeight) * 100 : 0;
                        const isPast = termProgress && week <= termProgress.currentWeek;

                        return (
                            <div 
                                key={week} 
                                className="relative flex-1 flex flex-col items-center h-full" 
                                onMouseEnter={() => setHoveredWeek(week)}
                                onMouseLeave={() => setHoveredWeek(null)}
                            >
                                <div className="w-full h-full flex items-end">
                                    <div
                                        className={`w-full rounded-t-sm transition-all duration-300 ${isPast ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-500'}`}
                                        style={{ height: `${height}%` }}
                                    ></div>
                                </div>
                                <span className="text-[10px] mt-1 text-slate-500 dark:text-slate-400">{week}</span>
                                {termProgress && week === termProgress.currentWeek && (
                                    <div className="absolute -bottom-1 w-1.5 h-1.5 bg-blue-600 rounded-full ring-2 ring-white dark:ring-slate-800" title="You are here"></div>
                                )}
                                {hoveredWeek === week && (
                                    <div className="absolute bottom-full mb-2 w-48 bg-slate-900 text-white text-xs rounded-lg p-2 z-20 pointer-events-none shadow-lg animate-fade-in">
                                        <p className="font-bold">Week {week}</p>
                                        <p>Cumulative Weight: <strong>{weight.toFixed(0)}%</strong></p>
                                        {assessmentsByWeek[week] && assessmentsByWeek[week].length > 0 && (
                                            <div className="mt-1 pt-1 border-t border-slate-600">
                                                <ul className="list-disc pl-3 space-y-0.5">
                                                    {assessmentsByWeek[week].map((a, i) => <li key={i} className="truncate">{a.name} ({a.weight}%)</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                                    </div>
                                )}
                            </div>
                        );
                    }) : (
                        <div className="w-full flex items-center justify-center h-full">
                           <p className="text-xs text-slate-500 dark:text-slate-400">No assessment data to display.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TermTimelinePane;