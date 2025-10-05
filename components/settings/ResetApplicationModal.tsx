import React, { useState, useEffect } from 'react';
import { getDataSummaryCounts, generateFullBackupData } from '../../services/database';

interface Props {
  onClose: () => void;
  onConfirmReset: () => void;
}

const ResetApplicationModal: React.FC<Props> = ({ onClose, onConfirmReset }) => {
  const [step, setStep] = useState<'backup' | 'confirm'>('backup');
  const [summary, setSummary] = useState<{ yearCount: number; moduleCount: number; assessmentCount: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackupDownloaded, setIsBackupDownloaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  useEffect(() => {
    async function fetchSummary() {
      setIsLoading(true);
      const counts = await getDataSummaryCounts();
      setSummary(counts);
      setIsLoading(false);
    }
    fetchSummary();
  }, []);

  const handleDownloadBackup = async () => {
    setIsExporting(true);
    try {
      const backupData = await generateFullBackupData();
      const backupJson = JSON.stringify(backupData, null, 2);
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.download = `Academic-OS_Backup_${date}.json`;
      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsBackupDownloaded(true); // Enable next step only after successful download
    } catch (error) {
      console.error("Failed to generate backup:", error);
      alert("Failed to generate backup. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const renderBackupStep = () => (
    <>
      <p className="text-slate-600 dark:text-slate-300 mt-2">
        This action is irreversible and will permanently delete all your data. To proceed, you must first download a complete backup.
      </p>

      <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">Data to be Erased</h3>
        {isLoading || !summary ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading data summary...</p>
        ) : (
          <ul className="list-disc pl-5 text-sm text-slate-500 dark:text-slate-400 mt-2">
            <li><strong>{summary.yearCount}</strong> Academic Year(s)</li>
            <li><strong>{summary.moduleCount}</strong> Module(s)</li>
            <li><strong>{summary.assessmentCount}</strong> Assessment(s)</li>
            <li>All other associated data and settings.</li>
          </ul>
        )}
      </div>

      <div className="mt-6">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">Step 1: Download Backup</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">You must download a backup before you can proceed to the next step.</p>
        <button
          onClick={handleDownloadBackup}
          disabled={isExporting}
          className="mt-2 w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-slate-400 flex items-center justify-center gap-2"
        >
          {isExporting ? 'Generating...' : isBackupDownloaded ? 'Backup Downloaded ✓' : 'Download Full Backup'}
        </button>
      </div>
    </>
  );

  const renderConfirmStep = () => (
    <>
      <p className="text-slate-600 dark:text-slate-300 mt-2">
        You are about to permanently erase all data. This cannot be undone.
      </p>
      <div className="mt-6">
        <label htmlFor="confirm-reset-text" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          To confirm, please type <strong>RESET</strong> below:
        </label>
        <input
          id="confirm-reset-text"
          type="text"
          value={confirmationText}
          onChange={(e) => setConfirmationText(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 sm:text-sm"
          autoFocus
        />
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-lg w-full animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-500">
            Reset Application and Erase All Data?
          </h2>
        </div>
        
        <div className="p-6">
          {step === 'backup' ? renderBackupStep() : renderConfirmStep()}
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex justify-between items-center rounded-b-lg">
          {step === 'confirm' && (
            <button onClick={() => setStep('backup')} className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:underline">
              Back
            </button>
          )}
          <div className="flex-grow flex justify-end space-x-4">
            <button onClick={onClose} className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600">
              Cancel
            </button>
            {step === 'backup' ? (
              <button
                onClick={() => setStep('confirm')}
                disabled={!isBackupDownloaded || isLoading}
                className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={onConfirmReset}
                disabled={confirmationText !== 'RESET'}
                className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                Erase All Data and Restart
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetApplicationModal;
