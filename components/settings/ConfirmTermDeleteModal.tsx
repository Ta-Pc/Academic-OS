import React from 'react';
import { AcademicTerm } from '../../types';

interface Props {
  term: AcademicTerm;
  onConfirm: () => void;
  onDismiss: () => void;
  childCount: number;
}

const ConfirmTermDeleteModal: React.FC<Props> = ({ term, onConfirm, onDismiss, childCount }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in" onClick={onDismiss}>
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-xl max-w-sm w-full animate-slide-up" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">Delete Term?</h2>
        <div className="text-slate-600 dark:text-slate-300 mb-6 space-y-4">
            <p>
                Are you sure you want to permanently delete <strong>{term.termName}</strong>?
            </p>
            {childCount > 0 && (
                <div className="p-3 bg-amber-100 dark:bg-amber-900/50 border-l-4 border-amber-500 text-amber-900 dark:text-amber-200">
                    This will also delete its <strong>{childCount} nested quarter{childCount > 1 ? 's' : ''}</strong>.
                </div>
            )}
        </div>
        <div className="flex justify-end space-x-4">
          <button onClick={onDismiss} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg">Delete</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmTermDeleteModal;