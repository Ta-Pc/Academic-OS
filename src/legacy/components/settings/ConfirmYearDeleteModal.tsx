import React from 'react';

interface Props {
  year: number;
  onConfirm: () => void;
  onDismiss: () => void;
}

const ConfirmYearDeleteModal: React.FC<Props> = ({ year, onConfirm, onDismiss }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in" onClick={onDismiss}>
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-xl max-w-sm w-full animate-slide-up" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-red-600 dark:text-red-500">Delete {year} Year?</h2>
        <div className="text-slate-600 dark:text-slate-300 mb-6 space-y-4">
            <p>
                Permanently delete the <strong>{year}</strong> academic year and all its terms?
            </p>
            <p className="font-bold">This action cannot be undone.</p>
        </div>
        <div className="flex justify-end space-x-4">
          <button onClick={onDismiss} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg">Delete Permanently</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmYearDeleteModal;