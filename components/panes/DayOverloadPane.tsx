import React, { useMemo, useState, useEffect } from 'react';
import { Assessment, EffortCategory, SystemSettings } from '../../types';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';

interface Props {
    assessments: Assessment[];
    settings: SystemSettings;
    today: Date;
    onFilter: (date: string | null) => void;
    activeFilter: string | null;
    isLoading: boolean;
    setAnnouncement: (message: string) => void;
}

const EFFORT_MAP: Record<EffortCategory, number> = {
  'Quick Win': 3,
  'Standard': 8,
  'Deep Dive': 15,
  'Emergency Rescue': 20,
  'Group Project': 12,
};

const DayOverloadPane: React.FC<Props> = ({ assessments, settings, today, onFilter, activeFilter, isLoading, setAnnouncement }) => {
    const [hoveredDay, setHoveredDay] = useState<string | null>(null);

    const dayOverloadData = useMemo(() => {
        const upcomingIn7Days = assessments.filter(a => {
            if (a.dueDate === 'TBC' || a.status !== 'Upcoming') return false;
            try {
                const diff = differenceInDays(parseISO(a.dueDate), today);
                return diff >= 0 && diff < 7;
            } catch { return false; }
        });

        const dailyData: Record<string, { tasks: Assessment[]; totalEffort: number }> = {};
        for(let i = 0; i < 7; i++){
            const date = addDays(today, i);
            const dateStr = format(date, 'yyyy-MM-dd');
            dailyData[dateStr] = { tasks: [], totalEffort: 0 };
        }
        
        upcomingIn7Days.forEach(a => {
            dailyData[a.dueDate].tasks.push(a);
            dailyData[a.dueDate].totalEffort += EFFORT_MAP[a.effort] || 0;
        });
        
        const cutline = settings.dailyEffortCutline || 24;
        
        return Object.entries(dailyData)
            .map(([dateStr, day]) => {
                const date = parseISO(dateStr);
                const ratio = day.totalEffort / cutline;
                let statusColor: 'bg-red-500' | 'bg-yellow-400' | 'bg-green-500' = 'bg-green-500';
                if (ratio > 1) statusColor = 'bg-red-500';
                else if (ratio >= 0.8) statusColor = 'bg-yellow-400';
                
                return {
                    dateStr,
                    dayName: format(date, 'EEE'),
                    dateShort: format(date, 'd MMM'),
                    statusColor,
                    ...day
                };
            });
            
    }, [assessments, today, settings.dailyEffortCutline]);

    useEffect(() => {
        const cutline = settings.dailyEffortCutline || 24;
        const overloadedDay = dayOverloadData.find(d => d.totalEffort > cutline);

        if (overloadedDay) {
            const dayName = format(parseISO(overloadedDay.dateStr), 'EEEE');
            const overload = overloadedDay.totalEffort - cutline;
            setAnnouncement(`${dayName} is over capacity by ${overload} effort points.`);
        }
    }, [dayOverloadData, settings.dailyEffortCutline, setAnnouncement]);

    const cutline = settings.dailyEffortCutline || 0;
    if (cutline <= 0 && !isLoading) {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm text-center">
                 <h2 className="text-lg font-bold mb-2 text-slate-800 dark:text-slate-200">Workload Forecast</h2>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Set your daily capacity to unlock overload detection.</p>
                 <button className="px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-semibold rounded-lg text-sm">Set Daily Cutline</button>
            </div>
        );
    }
    
    if (isLoading) {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm animate-pulse">
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
                <div className="space-y-4">
                    {[...Array(7)].map((_, i) => (
                        <div key={i} className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }
    
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">Day Overload (Next 7 Days)</h2>
        <div className="space-y-1">
            {dayOverloadData.every(d => d.tasks.length === 0) && 
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No deadlines in the next 7 days. Great time to get ahead!</p>
            }
            {dayOverloadData.map(day => {
                const width = Math.min(100, (day.totalEffort / cutline) * 100);
                
                return (
                    <button 
                        key={day.dateStr}
                        className={`relative w-full text-left p-2 rounded-md transition-colors ${activeFilter === day.dateStr ? 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
                        onMouseEnter={() => setHoveredDay(day.dateStr)}
                        onMouseLeave={() => setHoveredDay(null)}
                        onClick={() => onFilter(activeFilter === day.dateStr ? null : day.dateStr)}
                        aria-pressed={activeFilter === day.dateStr}
                    >
                        <div className="flex items-center justify-between text-sm mb-1">
                            <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${day.statusColor}`}></span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300 w-8">{day.dayName}</span>
                                <span className="text-slate-400 text-xs">{day.dateShort}</span>
                            </div>
                            <div className="font-mono text-xs p-1 bg-slate-100 dark:bg-slate-700 rounded w-20 text-right">
                                {day.totalEffort} / {cutline}
                            </div>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 my-1">
                          <div className={`${day.statusColor} h-2 rounded-full`} style={{ width: `${width}%`}}></div>
                        </div>
                        {day.tasks.length > 0 && (
                             <div className="flex items-center gap-1.5 h-1.5">
                                {day.tasks.map((task, i) => (
                                    <div key={i} className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" title={task.assessmentName}></div>
                                ))}
                            </div>
                        )}

                        {hoveredDay === day.dateStr && day.tasks.length > 0 && (
                            <div className="absolute bottom-full left-0 mb-2 w-full bg-slate-900 text-white text-xs rounded-lg p-2 z-20 pointer-events-none shadow-lg animate-fade-in">
                                <p className="font-bold">{day.tasks.length} item(s) due:</p>
                                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                                    {day.tasks.map(t => <li key={t.id} className="truncate">{t.assessmentName}</li>)}
                                </ul>
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                            </div>
                        )}
                    </button>
                )
            })}
        </div>
      </div>
    );
};

export default DayOverloadPane;