import React from 'react';

interface Props {
  title: string;
  children: React.ReactNode;
  onDismiss: () => void;
  onArchive: () => void;
}

const DeletionBlockedModal: React.FC<Props> = ({ title, children, onDismiss, onArchive }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-xl max-w-lg w-full animate-slide-up">
        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">{title}</h2>
        <div className="text-slate-600 dark:text-slate-300 mb-6">
            {children}
        </div>
        <div className="flex justify-end space-x-4">
          <button onClick={onDismiss} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">
            Dismiss
          </button>
          <button onClick={onArchive} className="px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700">
            Archive Instead
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeletionBlockedModal;
