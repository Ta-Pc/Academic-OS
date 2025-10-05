import React from 'react';
import { useMemo, useState } from 'react';
import { Assessment, AssessmentStatus, AssessmentType } from '../../types';
import { parseISO, formatDistanceToNowStrict, format, isToday, isAfter, isBefore, addDays, startOfDay } from 'date-fns';
import { Icon } from '../ui/Icon';

// --- Helper Components ---

const ASSESSMENT_TYPE_ICONS: Record<string, React.ReactElement> = {
    'Quiz': <Icon name="HelpCircle" className="w-5 h-5" strokeWidth={1.5} />,
    'Semester Test': <Icon name="ClipboardList" className="w-5 h-5" strokeWidth={1.5} />,
    'Assignment': <Icon name="FilePenLine" className="w-5 h-5" strokeWidth={1.5} />,
    'Homework': <Icon name="BookText" className="w-5 h-5" strokeWidth={1.5} />,
    'Practical': <Icon name="Beaker" className="w-5 h-5" strokeWidth={1.5} />,
    'Exam': <Icon name="Star" className="w-5 h-5 text-violet-500" strokeWidth={1.5} />,
    'Tutorial': <Icon name="Users" className="w-5 h-5" strokeWidth={1.5} />,
    'Class Test': <Icon name="Presentation" className="w-5 h-5" strokeWidth={1.5} />
};


const CollapsibleSection: React.FC<{
  title: string;
  count: number;
  children: React.ReactNode;
  defaultCollapsed: boolean;
}> = ({ title, count, children, defaultCollapsed }) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  if (count === 0) return null;

  return (
    <section>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex justify-between items-center p-4 text-left font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
        aria-expanded={!isCollapsed}
      >
        <div className="flex items-center gap-2">
            <span>{title}</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{count}</span>
        </div>
        <Icon name="ChevronDown" className={`w-5 h-5 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} strokeWidth={2} />
      </button>
      {!isCollapsed && (
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {children}
        </div>
      )}
    </section>
  );
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

const AssignmentRow: React.FC<{ assessment: Assessment; isExpanded: boolean; onToggle: () => void; }> = ({ assessment, isExpanded, onToggle }) => {
    const today = startOfDay(new Date());
    
    const dueDate = useMemo(() => assessment.dueDate === 'TBC' ? null : parseISO(assessment.dueDate), [assessment.dueDate]);
    
    const isOverdue = assessment.status === 'Overdue' || assessment.status === 'Missed';
    const isDueToday = dueDate ? isToday(dueDate) : false;
    
    const borderClass = isOverdue ? 'border-red-500' : isDueToday ? 'border-amber-500' : 'border-transparent';

    const relativeDueDate = useMemo(() => {
        if (!dueDate) return 'TBC';
        if (isToday(dueDate)) return 'Today';
        return formatDistanceToNowStrict(dueDate, { addSuffix: true });
    }, [dueDate]);

    const contribution = (assessment.weight * (assessment.result ?? 0)) / 100;
    
    return (
        <div className={`border-l-4 ${borderClass}`}>
            <div onClick={onToggle} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left Stack */}
                    <div className="flex-grow flex items-start gap-3">
                        <div className="text-slate-400 mt-0.5">{ASSESSMENT_TYPE_ICONS[assessment.assessmentType]}</div>
                        <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{assessment.assessmentName}</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mt-1">
                                {assessment.assessmentType === 'Exam' && <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300 font-medium">Exam</span>}
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700">Weight: <strong>{assessment.weight}%</strong></span>
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700">Effort: <strong>{assessment.effort}</strong></span>
                                {assessment.dueDate === 'TBC' ?
                                    <span className="px-2 py-0.5 rounded-full border border-dashed border-slate-400 dark:border-slate-500 text-slate-500 dark:text-slate-400" title="This due date is tentative and subject to change.">TBC</span>
                                    : <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700">Due: <strong>{format(dueDate!, 'd MMM')}</strong></span>
                                }
                            </div>
                        </div>
                    </div>
                    {/* Right Stack */}
                    <div className="text-left md:text-right flex-shrink-0 flex md:flex-col items-center md:items-end justify-between pl-8 md:pl-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-200" title={dueDate ? format(dueDate, 'EEEE, d MMM yyyy') : 'Date to be confirmed'}>
                           {relativeDueDate}
                        </p>
                        <PriorityScorePill score={assessment.calculated_priority_score ?? 0} />
                    </div>
                </div>
                {/* Actions (visible on hover/focus within parent) */}
            </div>
             {isExpanded && assessment.status === 'Graded' && (
                <div className="p-4 bg-slate-100 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex gap-8">
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Result</p>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">{assessment.result?.toFixed(1)}%</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Contribution</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{contribution.toFixed(2)} pts</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- Main Component ---

interface Props {
  assessments: Assessment[];
}

const AssignmentsPanel: React.FC<Props> = ({ assessments }) => {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const groupedAssessments = useMemo(() => {
    const today = startOfDay(new Date());
    const in7Days = addDays(today, 8); // To make it exclusive of the 7th day
    const in14Days = addDays(today, 15);

    const groups: { [key: string]: Assessment[] } = {
      overdue: [],
      dueToday: [],
      thisWeek: [],
      next2Weeks: [],
      later: [],
      completed: [],
    };
    
    const sortedAssessments = [...assessments]
        .map(a => ({...a, calculated_priority_score: 0})) // Stub priority for now
        .sort((a,b) => {
            if (a.dueDate === 'TBC') return 1;
            if (b.dueDate === 'TBC') return -1;
            return parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime();
        });

    for (const assessment of sortedAssessments) {
        if (assessment.status === 'Graded' || assessment.status === 'Submitted') {
            groups.completed.push(assessment);
            continue;
        }

        const dueDate = assessment.dueDate !== 'TBC' ? parseISO(assessment.dueDate) : null;
        
        if (assessment.status === 'Overdue' || assessment.status === 'Missed' || (dueDate && isBefore(dueDate, today))) {
            groups.overdue.push(assessment);
        } else if (dueDate && isToday(dueDate)) {
            groups.dueToday.push(assessment);
        } else if (dueDate && isAfter(dueDate, today) && isBefore(dueDate, in7Days)) {
            groups.thisWeek.push(assessment);
        } else if (dueDate && isAfter(dueDate, addDays(today, 7)) && isBefore(dueDate, in14Days)) {
            groups.next2Weeks.push(assessment);
        } else {
            groups.later.push(assessment);
        }
    }
    // Sort completed items by most recent due date
    groups.completed.sort((a,b) => parseISO(b.dueDate).getTime() - parseISO(a.dueDate).getTime());
    return groups;
  }, [assessments]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 rounded-t-xl">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Action Hub</h3>
        </div>
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-auto sm:flex-grow">
                <input type="text" placeholder="Search assignments..." className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500" />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Icon name="Search" className="w-5 h-5 text-slate-400" strokeWidth={2} />
                </div>
            </div>
            <div className="flex items-center gap-2">
                 <select className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 py-2 pl-3 pr-8">
                     <option>Sort by Priority</option>
                     <option>Sort by Due Date</option>
                     <option>Sort by Weight</option>
                 </select>
                 {/* Filter chips placeholder */}
            </div>
        </div>
      </div>

      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        <CollapsibleSection title="Overdue" count={groupedAssessments.overdue.length} defaultCollapsed={false}>
            {groupedAssessments.overdue.map(a => <AssignmentRow key={a.id} assessment={a} isExpanded={expandedRowId === a.id} onToggle={() => setExpandedRowId(prev => prev === a.id ? null : a.id)} />)}
        </CollapsibleSection>
        <CollapsibleSection title="Due Today" count={groupedAssessments.dueToday.length} defaultCollapsed={false}>
            {groupedAssessments.dueToday.map(a => <AssignmentRow key={a.id} assessment={a} isExpanded={expandedRowId === a.id} onToggle={() => setExpandedRowId(prev => prev === a.id ? null : a.id)} />)}
        </CollapsibleSection>
        <CollapsibleSection title="This Week" count={groupedAssessments.thisWeek.length} defaultCollapsed={false}>
            {groupedAssessments.thisWeek.map(a => <AssignmentRow key={a.id} assessment={a} isExpanded={expandedRowId === a.id} onToggle={() => setExpandedRowId(prev => prev === a.id ? null : a.id)} />)}
        </CollapsibleSection>
         <CollapsibleSection title="Next 2 Weeks" count={groupedAssessments.next2Weeks.length} defaultCollapsed={true}>
            {groupedAssessments.next2Weeks.map(a => <AssignmentRow key={a.id} assessment={a} isExpanded={expandedRowId === a.id} onToggle={() => setExpandedRowId(prev => prev === a.id ? null : a.id)} />)}
        </CollapsibleSection>
         <CollapsibleSection title="Later" count={groupedAssessments.later.length} defaultCollapsed={true}>
            {groupedAssessments.later.map(a => <AssignmentRow key={a.id} assessment={a} isExpanded={expandedRowId === a.id} onToggle={() => setExpandedRowId(prev => prev === a.id ? null : a.id)} />)}
        </CollapsibleSection>
        <CollapsibleSection title="Completed" count={groupedAssessments.completed.length} defaultCollapsed={true}>
            {groupedAssessments.completed.map(a => <AssignmentRow key={a.id} assessment={a} isExpanded={expandedRowId === a.id} onToggle={() => setExpandedRowId(prev => prev === a.id ? null : a.id)} />)}
        </CollapsibleSection>
      </div>
    </div>
  );
};

export default AssignmentsPanel;