import React, { useMemo, useCallback } from 'react';
import { AcademicTerm } from '../../types';
import { parseISO, differenceInDays, startOfYear, endOfYear, format, isValid } from 'date-fns';

interface Props {
  year: number;
  terms: AcademicTerm[];
}

const PERIOD_COLORS: Record<string, { bg: string, border: string, text?: string }> = {
  'Semester': { bg: 'bg-indigo-200 dark:bg-indigo-900/70', border: 'border-indigo-500', text: 'text-indigo-900 dark:text-indigo-200' },
  'Quarter': { bg: 'bg-sky-400/80 dark:bg-sky-700/80', border: 'border-sky-500', text: 'text-sky-900 dark:text-sky-100' },
  'default': { bg: 'bg-slate-200 dark:bg-slate-700', border: 'border-slate-400' },
};

const CalendarTimeline: React.FC<Props> = ({ year, terms }) => {
  const yearStart = useMemo(() => startOfYear(new Date(year, 0, 1)), [year]);
  const yearEnd = useMemo(() => endOfYear(new Date(year, 11, 31)), [year]);
  const totalDays = useMemo(() => differenceInDays(yearEnd, yearStart) + 1, [yearStart, yearEnd]);
  
  const getPeriodStyle = useCallback((term: AcademicTerm) => {
    try {
      const start = parseISO(term.startDate);
      const end = parseISO(term.endDate);
      if(!isValid(start) || !isValid(end)) return { left: '0%', width: '0%'};

      const offset = Math.max(0, differenceInDays(start, yearStart));
      const duration = Math.max(1, differenceInDays(end, start) + 1);

      return {
        left: `${(offset / totalDays) * 100}%`,
        width: `${(duration / totalDays) * 100}%`,
      };
    } catch {
      return { left: '0%', width: '0%' };
    }
  }, [totalDays, yearStart]);
  
  const semesters = useMemo(() => terms.filter(t => !t.parentTermId).sort((a,b) => a.startDate.localeCompare(b.startDate)), [terms]);
  const quarters = useMemo(() => terms.filter(t => t.parentTermId).sort((a,b) => a.startDate.localeCompare(b.startDate)), [terms]);

  return (
    <div>
      <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">Visual Timeline ({year})</h3>
      <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-lg p-2 space-y-1">
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="flex-1 text-center">{format(new Date(year, i, 1), 'MMM')}</span>
          ))}
        </div>
        <div className="relative h-24 bg-slate-200 dark:bg-slate-900/50 rounded-md overflow-hidden">
          {semesters.map(term => {
            const style = getPeriodStyle(term);
            const colors = PERIOD_COLORS['Semester'];
            return (
              <div key={term.id} style={style} className={`absolute top-0 h-full rounded-md ${colors.bg} p-1 flex items-start transition-all duration-300`}>
                <span className={`text-xs font-bold ${colors.text} whitespace-nowrap`}>{term.termName}</span>
              </div>
            );
          })}
          {quarters.map(term => {
            const style = getPeriodStyle(term);
            const colors = PERIOD_COLORS['Quarter'];
            return (
              <div key={term.id} style={style} className={`absolute inset-y-4 rounded-md ${colors.bg} border-l-4 ${colors.border} flex items-center justify-center shadow-sm z-10 transition-all duration-300`}>
                <span className={`text-xs font-medium px-1 ${colors.text} whitespace-nowrap`}>{term.termName}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarTimeline;