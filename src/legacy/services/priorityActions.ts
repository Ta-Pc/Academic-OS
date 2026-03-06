/**
 * Shared utility for the Priority Actions pane in the module dashboard.
 *
 * The dashboard shows the top-N most urgent assessments a student should
 * focus on. Overdue and missed assessments are *not* actionable and must
 * be excluded so that the pane surfaces only work the student can still
 * act on.
 *
 * Import this module from any component that needs to filter assessments
 * for the Priority Actions view — including the dashboard widget and the
 * AI context builder.
 */

import { Assessment } from '../../types';

/**
 * Returns `true` when an assessment is overdue or missed
 * (i.e. no longer actionable by the student).
 */
export function isOverdue(a: Assessment): boolean {
  return a.status === 'Overdue' || a.status === 'Missed';
}

/**
 * Returns only the assessments that are eligible for the "Priority Actions"
 * pane in the dashboard.  Overdue and missed assessments are excluded —
 * only upcoming (actionable) assessments are kept.
 */
export function getPriorityAssessments(assessments: Assessment[]): Assessment[] {
  return assessments.filter(a => !isOverdue(a));
}
