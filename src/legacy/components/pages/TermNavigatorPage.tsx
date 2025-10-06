import React, { useMemo, useState, Fragment, useRef, useEffect } from 'react';
import { AcademicTerm, WeeklyMetric, Module, Assessment } from '../../types';
import { differenceInCalendarWeeks, parseISO, startOfDay, differenceInDays, format } from 'date-fns';
import { Icon } from '../ui/Icon';

// --- Sub-Components ---

const InfoChip: React.FC<{ icon: React.ReactNode, value: string | number, label: string }> = ({ icon, value, label }) => (
    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg">
        <div className="text-blue-600 dark:text-blue-400">{icon}</div>
        <div>
            <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        </div>
    </div>
);

const Tooltip: React.FC<{ week: WeeklyMetric, position: { top: number, left: string } }> = ({ week, position }) => (
    <div className="absolute z-20 p-2 text-xs bg-slate-900 text-white rounded-lg shadow-lg pointer-events-none" style={{...position, transform: 'translate(-50%, -100%)'}}>
        <p className="font-bold">Week {week.weekNumber} <span className="font-normal text-slate-300">({format(parseISO(week.dateRange.start), 'd MMM')} - {format(parseISO(week.dateRange.end), 'd MMM')})</span></p>
        <ul className="mt-1 space-y-0.5">
            <li>Locked-in: <strong>{week.lockedInWeight.toFixed(1)}%</strong></li>
            <li>Due: <strong>{week.dueWeight.toFixed(1)}%</strong></li>
            <li>Overdue: <strong>{week.overdueWeight.toFixed(1)}%</strong></li>
            <li>Effort: <strong>{week.weeklyEffort}pts</strong> ({(week.effortVsCapacityRatio * 100).toFixed(0)}% cap)</li>
            <li className="pt-1 border-t border-slate-600 mt-1">Due: {week.dueCount} items, Overdue: {week.overdueCount} items</li>
        </ul>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-2 h-2 bg-slate-900 rotate-45" style={{ transform: 'translateX(-50%) translateY(50%) rotate(45deg)' }}></div>
    </div>
);


const TermNavigatorGraph: React.FC<{
    weeklyMetrics: WeeklyMetric[]; currentWeek: number; examWeekStart: number;
    highlightedWeek: number | null; hoveredWeek: number | null;
    onHover: (week: number | null) => void; 
}> = ({ weeklyMetrics, currentWeek, examWeekStart, highlightedWeek, hoveredWeek, onHover }) => {
    
    const CHART_HEIGHT = 300;
    const Y_AXIS_WIDTH = 30;

    const getLineColor = (ratio: number) => {
        if (ratio > 1.0) return 'stroke-red-500 fill-red-500';
        if (ratio > 0.8) return 'stroke-yellow-500 fill-yellow-500';
        return 'stroke-green-500 fill-green-500';
    };

    return (
        <div className="w-full h-full flex items-stretch">
            <div className="flex items-center justify-center [writing-mode:vertical-rl] transform rotate-180 text-xs text-slate-500 dark:text-slate-400 font-medium pb-4">
                Grade Weight %
            </div>
            <div className="flex-grow flex flex-col">
                <div className="flex-grow flex text-xs text-slate-500 dark:text-slate-400">
                    <div style={{width: `${Y_AXIS_WIDTH}px`}} className="flex flex-col justify-between h-full text-right pr-2">
                        <span>100%</span>
                        <span>0%</span>
                    </div>
                    <div className="flex-grow relative" style={{ height: `${CHART_HEIGHT}px`}}>
                        <div className="absolute inset-0 flex">
                            {weeklyMetrics.map(week => (
                                <div key={`bg-${week.weekNumber}`} className={`flex-1 h-full`}>
                                    {week.weekNumber >= examWeekStart && (
                                        <div className={`w-full h-full bg-violet-100 dark:bg-violet-900/30`}></div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="absolute inset-0 flex items-end gap-[2px] px-1">
                            {weeklyMetrics.map(week => {
                                const totalWeight = week.lockedInWeight + week.dueWeight + week.overdueWeight;
                                const isCapped = totalWeight > 100;
                                const scale = isCapped ? 100 / totalWeight : 1;
                                const lockedH = week.lockedInWeight * scale;
                                const dueH = week.dueWeight * scale;
                                const overdueH = week.overdueWeight * scale;

                                return (
                                    <div 
                                        key={week.weekNumber} 
                                        className="relative flex-1 h-full flex flex-col justify-end items-center group cursor-pointer"
                                        onMouseEnter={() => onHover(week.weekNumber)}
                                        onMouseLeave={() => onHover(null)}
                                    >
                                        <div className={`w-full transition-all duration-200 ${highlightedWeek === week.weekNumber ? 'ring-2 ring-offset-2 dark:ring-offset-slate-800 ring-amber-500 rounded-sm' : ''}`}>
                                            <div style={{ height: `${overdueH}%`}} className="w-full hatch-pattern"></div>
                                            <div style={{ height: `${dueH}%`}} className="w-full bg-teal-500"></div>
                                            <div style={{ height: `${lockedH}%`}} className="w-full bg-blue-600 rounded-t-sm"></div>
                                        </div>
                                        {isCapped && <div className="absolute -top-1 w-full h-0.5 bg-red-500"></div>}
                                    </div>
                                );
                            })}
                        </div>
                        <svg className="absolute inset-0 w-full h-full" overflow="visible">
                            <line x1={Y_AXIS_WIDTH} x2="100%" y1={CHART_HEIGHT * (1 - 100/150)} y2={CHART_HEIGHT * (1 - 100/150)} stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" className="text-slate-300 dark:text-slate-600" />
                            {weeklyMetrics.map((week, i) => i === 0 ? null : (
                                <line key={`line-${i}`} x1={`${((i - 0.5) / weeklyMetrics.length) * 100}%`} y1={CHART_HEIGHT - (Math.min(1.5, weeklyMetrics[i-1].effortVsCapacityRatio) / 1.5) * CHART_HEIGHT} x2={`${((i + 0.5) / weeklyMetrics.length) * 100}%`} y2={CHART_HEIGHT - (Math.min(1.5, week.effortVsCapacityRatio) / 1.5) * CHART_HEIGHT} strokeWidth="1.5" className={getLineColor(weeklyMetrics[i-1].effortVsCapacityRatio).split(' ')[0]} />
                            ))}
                            {weeklyMetrics.map((week, i) => (
                                <circle key={`dot-${i}`} cx={`${((i + 0.5) / weeklyMetrics.length) * 100}%`} cy={CHART_HEIGHT - (Math.min(1.5, week.effortVsCapacityRatio) / 1.5) * CHART_HEIGHT} r="2.5" className={getLineColor(week.effortVsCapacityRatio).split(' ')[1]} />
                            ))}
                        </svg>
                    </div>
                </div>
                <div className="flex text-xs text-slate-500 dark:text-slate-400 pl-8">
                     {weeklyMetrics.map(week => (
                        <div key={`label-${week.weekNumber}`} className="relative flex-1 text-center h-4">
                            <span className={`absolute inset-x-0`}>{week.weekNumber}</span>
                             {week.weekNumber === currentWeek && (
                                <div className="absolute inset-x-0 top-3 mx-auto w-1.5 h-1.5 bg-blue-600 rounded-full ring-2 ring-white dark:ring-slate-800" title="You are here"></div>
                            )}
                        </div>
                     ))}
                </div>
            </div>
            <div className="flex items-center justify-center [writing-mode:vertical-rl] transform rotate-180 text-xs text-slate-500 dark:text-slate-400 font-medium pb-4">
                Effort vs Capacity
            </div>
        </div>
    );
};

const PointsWaterfallGraph: React.FC<{ term: AcademicTerm, assessments: Assessment[], modules: Module[] }> = ({ term, assessments, modules }) => {
    const data = useMemo(() => {
        const target = term.gradePointAverageGoal ?? 75;
        const pointsSecuredAllModules = term.calculated_cumulative_points_secured ?? 0;
        const numModules = Math.max(1, modules.length);
        const avgPointsSecured = pointsSecuredAllModules / numModules;
        const remainingSemesterWeightAllModules = term.calculated_term_navigator_data?.remainingWeightBeforeExams ?? 0;
        const examWeightAllModules = assessments.filter(a => a.assessmentType === 'Exam').reduce((sum, a) => sum + a.weight, 0);
        const avgRemainingSemesterWeight = remainingSemesterWeightAllModules / numModules;
        const avgExamWeight = examWeightAllModules / numModules;
        const termGPA = term.calculated_term_gpa ?? target;
        const projectedPointsFromRemaining = avgRemainingSemesterWeight * (termGPA / 100);
        const finalProjected = avgPointsSecured + projectedPointsFromRemaining + (avgExamWeight * (termGPA / 100));
        const gap = target - finalProjected;
        const totalBarValue = avgPointsSecured + avgRemainingSemesterWeight + avgExamWeight;
        return { target, avgPointsSecured, avgRemainingSemesterWeight, avgExamWeight, gap, finalProjected, totalBarValue };
    }, [term, assessments, modules]);

    const segments = [
        { value: data.avgPointsSecured, color: "bg-blue-600", label: "Points Secured" },
        { value: data.avgRemainingSemesterWeight, color: "bg-teal-500", label: "Semester Weight" },
        { value: data.avgExamWeight, color: "bg-violet-500", label: "Exam Weight" },
    ];

    return (
        <div className="w-full px-4 sm:px-8 py-8 flex flex-col justify-center h-full">
            {/* Top Labels */}
            <div className="flex w-full">
                {segments.map((seg, i) => (
                    <div key={i} style={{ width: `${(seg.value / data.totalBarValue) * 100}%` }} className="text-center px-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{seg.label}</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{seg.value.toFixed(1)}</p>
                    </div>
                ))}
            </div>

            {/* Bar and Target Marker */}
            <div className="relative mt-2">
                <div className="w-full h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                    {segments.map((seg, i) => (
                        <div key={i} style={{ width: `${(seg.value / data.totalBarValue) * 100}%` }} className={seg.color}></div>
                    ))}
                </div>
                
                {/* Target Line */}
                <div style={{ left: `${(data.target / data.totalBarValue) * 100}%` }} className="absolute top-0 bottom-0 flex justify-center">
                    <div className="w-0.5 bg-red-500"></div>
                    <div className="absolute -top-5 text-center">
                        <p className="text-xs font-bold text-red-500">Target</p>
                    </div>
                    <div className="absolute -bottom-6 text-center">
                        <p className="text-xs font-bold text-red-500">{data.target.toFixed(1)}</p>
                    </div>
                </div>
            </div>

            {/* Gap to target */}
            <div className="text-center text-sm mt-8">
                Gap to target: <span className={`font-bold ${data.gap > 0 ? 'text-red-500' : 'text-green-500'}`}>{data.gap.toFixed(1)}pts</span>
            </div>
        </div>
    );
};


// --- Main Page Component ---

interface Props {
    term: AcademicTerm | null;
    modules: Module[];
    assessments: Assessment[];
    onBack: () => void;
}

const TermNavigatorPage: React.FC<Props> = ({ term, modules, assessments, onBack }) => {
    
    const [view, setView] = useState<'timeline' | 'waterfall'>('timeline');
    const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);
    const [highlightedWeek, setHighlightedWeek] = useState<number | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navigatorData = term?.calculated_term_navigator_data;
    const today = startOfDay(new Date());

    const currentWeek = useMemo(() => {
        if (!term) return -1;
        try {
            const termStart = parseISO(term.startDate);
            const elapsedDays = differenceInDays(today, termStart);
            return Math.floor(elapsedDays / 7) + 1;
        } catch { return -1; }
    }, [term, today]);

    const examWeekStart = useMemo(() => {
        if (!navigatorData?.firstExamDate || !term) return Infinity;
        try {
            return differenceInCalendarWeeks(parseISO(navigatorData.firstExamDate), parseISO(term.startDate)) + 1;
        } catch { return Infinity; }
    }, [navigatorData, term]);
    
    const nextSpikeWeek = useMemo(() => {
        return navigatorData?.effortSpikes.find(s => s.weekNumber > currentWeek)?.weekNumber;
    }, [navigatorData, currentWeek]);

    if (!term || !navigatorData) {
        return (
            <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-8">
                <button onClick={onBack} className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-2 mb-4">
                  <Icon name="ChevronLeft" className="w-5 h-5" strokeWidth={2} />
                  Back to Dashboard
                </button>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm text-center">
                    <p>No term data available to display.</p>
                </div>
            </div>
        );
    }
    
    const { weeklyMetrics, effortSpikes } = navigatorData;
    const showWeightWarning = navigatorData.remainingWeightBeforeExams > 100;
    const clampedWeight = Math.min(100, navigatorData.remainingWeightBeforeExams);

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
            <header className="bg-white dark:bg-slate-800/50 p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="max-w-7xl mx-auto">
                    <button onClick={onBack} className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-2 mb-4">
                        <Icon name="ChevronLeft" className="w-5 h-5" strokeWidth={2} />
                        Back to Dashboard
                    </button>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Term Navigator</h1>
                            <p className="text-slate-500 dark:text-slate-400">{term.termName} ({term.academicYear})</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex p-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm font-medium">
                                <button onClick={() => setView('timeline')} className={`px-3 py-1 rounded-md transition-colors ${view === 'timeline' ? 'bg-white dark:bg-slate-900 shadow text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>Timeline</button>
                                <button onClick={() => setView('waterfall')} className={`px-3 py-1 rounded-md transition-colors ${view === 'waterfall' ? 'bg-white dark:bg-slate-900 shadow text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>Waterfall</button>
                            </div>
                            <div className="relative" ref={menuRef}>
                                <button onClick={() => setIsMenuOpen(o => !o)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400" aria-label="Options"><Icon name="MoreVertical" className="w-5 h-5" strokeWidth={1.5} /></button>
                                {isMenuOpen && (
                                    <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                                        <a href="#" onClick={e => e.preventDefault()} className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600">Export week list</a>
                                        <a href="#" onClick={e => e.preventDefault()} className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600">Edit term dates</a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-sm">
                    {view === 'timeline' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <InfoChip icon={<Icon name="Calendar" className="w-4 h-4" strokeWidth={1.5} />} value={navigatorData.firstExamInDays ?? 'N/A'} label="First exam in" />
                            <InfoChip icon={<Icon name="Clock" className="w-4 h-4" strokeWidth={1.5} />} value={navigatorData.teachingDaysLeft} label="Teaching days left" />
                            <InfoChip icon={<Icon name="BarChart" className="w-4 h-4" strokeWidth={1.5} />} value={`${clampedWeight.toFixed(0)}%`} label="Weight before exams" />
                            {showWeightWarning && (
                                <div className="md:col-span-3 text-xs text-amber-600 dark:text-amber-400 font-medium text-center p-2 bg-amber-100 dark:bg-amber-900/50 rounded" role="alert">
                                    Total weight of remaining assessments before exams exceeds 100%. Please review assessment weights.
                                </div>
                            )}
                        </div>
                    )}

                    <div className="relative" style={{ minHeight: '300px' }}>
                        {view === 'timeline' ? (
                            <Fragment>
                                {hoveredWeek && weeklyMetrics[hoveredWeek - 1] && (
                                    <Tooltip 
                                        week={weeklyMetrics[hoveredWeek - 1]}
                                        position={{ top: -8, left: `${((hoveredWeek - 0.5) / weeklyMetrics.length) * 100}%` }}
                                    />
                                )}
                                <TermNavigatorGraph weeklyMetrics={weeklyMetrics} currentWeek={currentWeek} examWeekStart={examWeekStart} highlightedWeek={highlightedWeek} hoveredWeek={hoveredWeek} onHover={setHoveredWeek} />
                            </Fragment>
                        ) : (
                            <PointsWaterfallGraph term={term} assessments={assessments} modules={modules} />
                        )}
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                        {view === 'timeline' && effortSpikes.length > 0 && (
                            <div className="text-sm flex items-center gap-2 mb-4">
                                <span className="font-semibold text-slate-600 dark:text-slate-300 flex-shrink-0 flex items-center gap-1.5"><Icon name="AlertTriangle" className="w-4 h-4" strokeWidth={1.5} /> Spikes:</span>
                                <div className="flex flex-wrap gap-2">
                                    {effortSpikes.map(spike => (
                                        <button key={spike.weekNumber} onClick={() => setHighlightedWeek(spike.weekNumber)} className="px-2.5 py-1 text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 rounded-full hover:bg-amber-200 dark:hover:bg-amber-800 font-semibold">
                                            Over capacity in Week {spike.weekNumber}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button onClick={() => console.log('Plan this week clicked')} className="flex-1 text-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-sm">Plan this week</button>
                            <button onClick={() => console.log('Plan next spike clicked')} disabled={!nextSpikeWeek} className="flex-1 text-center px-4 py-2 bg-slate-100 dark:bg-slate-700/80 font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">
                                Plan next spike {nextSpikeWeek ? `(Week ${nextSpikeWeek})` : ''}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TermNavigatorPage;