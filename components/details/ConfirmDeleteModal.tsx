import React, { useState, useMemo } from 'react';
import { Module } from '../../types';

interface Props {
  module: Module;
  onConfirm: () => void;
  onDismiss: () => void;
  hasGradedWork: boolean;
  assessmentCount: number;
}

const ConfirmDeleteModal: React.FC<Props> = ({ module, onConfirm, onDismiss, hasGradedWork, assessmentCount }) => {
  const [isChecked, setIsChecked] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const isButtonDisabled = useMemo(() => {
    return !isChecked || confirmText.trim().toUpperCase() !== module.moduleCode.toUpperCase();
  }, [isChecked, confirmText, module.moduleCode]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-lg w-full animate-slide-up">
        <div className="p-6">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-500">
            Delete module {module.moduleCode} permanently?
          </h2>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            You are about to permanently delete <strong>{module.moduleName}</strong>. This action is irreversible.
          </p>

          <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-3">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Consequences</h3>
            {hasGradedWork && (
              <div className="p-3 bg-amber-100 dark:bg-amber-900/50 border-l-4 border-amber-500 text-amber-900 dark:text-amber-200">
                <p className="font-bold">⚠️ Warning: This module contains graded work.</p>
                <p className="text-sm">Deleting it will permanently alter your historical Term Average. The 'Archive' option is recommended instead.</p>
              </div>
            )}
            <ul className="list-disc pl-5 text-sm text-slate-500 dark:text-slate-400">
              <li>All <strong>{assessmentCount} assessments</strong> associated with this module will be deleted.</li>
              <li>Any related study sessions or tasks will be removed.</li>
              <li>This will affect your academic analytics and cannot be undone.</li>
            </ul>
          </div>

          <div className="mt-6 space-y-4">
            <label htmlFor="confirm-checkbox" className="flex items-start gap-3 cursor-pointer">
              <input
                id="confirm-checkbox"
                type="checkbox"
                checked={isChecked}
                onChange={() => setIsChecked(!isChecked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600 dark:text-slate-300">
                I understand that this action is permanent and will alter my academic record.
              </span>
            </label>

            <div>
              <label htmlFor="confirm-text" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                To confirm, please type <strong className="font-mono">{module.moduleCode}</strong> below:
              </label>
              <input
                id="confirm-text"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex justify-end space-x-4 rounded-b-lg">
          <button onClick={onDismiss} className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600">
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            disabled={isButtonDisabled}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;