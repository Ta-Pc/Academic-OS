import React, { useMemo } from 'react';
import { AcademicTerm, TermType } from '../../types';
import { isWithinInterval, parseISO, startOfYear, endOfYear, format, isValid } from 'date-fns';

function getTermType(term: AcademicTerm): TermType {
    if (term.id.startsWith('year-')) return 'Year';
    if (!term.parentTermId) return 'Semester';
    return 'Quarter';
}

interface TermSelectorProps {
    value: string | null;
    onChange: (termId: string) => void;
    allTerms: AcademicTerm[];
    visibleTermTypes: TermType[];
    selectableTermTypes: TermType[];
    mustContainRange?: { start?: string; end?: string };
    className?: string;
    isMobile?: boolean;
}

const TermSelector: React.FC<TermSelectorProps> = ({
    value,
    onChange,
    allTerms,
    visibleTermTypes,
    selectableTermTypes,
    mustContainRange,
    className,
    isMobile = false,
}) => {
    const flatTermList = useMemo(() => {
        const list: {term: AcademicTerm, level: number}[] = [];
        const years = [...new Set(allTerms.map(t => t.academicYear))].sort((a,b) => a - b);
    
        years.forEach(year => {
            let yearLevel = 0;
            
            if (visibleTermTypes.includes('Year')) {
                const yearTerm: AcademicTerm = {
                    id: `year-${year}`, academicYear: year, termName: `${year} Academic Year`,
                    startDate: format(startOfYear(new Date(year, 0, 2)), 'yyyy-MM-dd'),
                    endDate: format(endOfYear(new Date(year, 0, 1)), 'yyyy-MM-dd'),
                    parentTermId: null, durationInWeeks: 52, notionalHoursPerCredit: 10,
                };
                list.push({ term: yearTerm, level: yearLevel });
            }
            
            const semesterLevel = visibleTermTypes.includes('Year') ? yearLevel + 1 : yearLevel;
            const semesters = allTerms.filter(t => t.academicYear === year && !t.parentTermId).sort((a,b) => a.startDate.localeCompare(b.startDate));
            
            semesters.forEach(semester => {
                if (visibleTermTypes.includes('Semester')) {
                    list.push({ term: semester, level: semesterLevel });
                }
                
                const quarterLevel = visibleTermTypes.includes('Semester') ? semesterLevel + 1 : semesterLevel;
                const quarters = allTerms.filter(t => t.parentTermId === semester.id).sort((a,b) => a.startDate.localeCompare(b.startDate));
                
                quarters.forEach(quarter => {
                    if (visibleTermTypes.includes('Quarter')) {
                        list.push({ term: quarter, level: quarterLevel });
                    }
                });
            });
        });
        return list;
    }, [allTerms, visibleTermTypes]);
    
    const isTermDisabled = (term: AcademicTerm): boolean => {
        if (!mustContainRange) return false;

        const { start, end } = mustContainRange;
        if (!start && !end) return false;
        
        try {
            const termStart = parseISO(term.startDate);
            const termEnd = parseISO(term.endDate);
            if (!isValid(termStart) || !isValid(termEnd)) return true;

            const rangeStart = start ? parseISO(start) : termStart;
            const rangeEnd = end ? parseISO(end) : termEnd;

            if (!isValid(rangeStart) || !isValid(rangeEnd)) return false;

            return !(isWithinInterval(rangeStart, { start: termStart, end: termEnd }) && isWithinInterval(rangeEnd, { start: termStart, end: termEnd }));
        } catch {
            return true;
        }
    };
    
    const mobileClasses = "w-full max-w-[200px] bg-transparent font-semibold text-lg text-slate-800 dark:text-slate-200 focus:outline-none pr-10";
    const desktopClasses = "bg-slate-100 dark:bg-slate-800 p-2 px-4 rounded-lg font-semibold text-sm text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border-transparent pr-10";

    const defaultClasses = isMobile ? mobileClasses : desktopClasses;

    return (
        <select
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={className ?? defaultClasses}
            aria-label="Select academic term"
        >
            {flatTermList.map(({term, level}) => {
                const type = getTermType(term);
                const indent = level > 0 ? '\u00A0\u00A0'.repeat(level) + '↳ ' : '';
                return (
                    <option
                        key={term.id}
                        value={term.id}
                        disabled={!selectableTermTypes.includes(type) || isTermDisabled(term)}
                        className={isMobile ? "font-normal bg-white dark:bg-slate-800" : ""}
                    >
                        {indent}{term.termName}
                    </option>
                )
            })}
        </select>
    );
};

export default TermSelector;