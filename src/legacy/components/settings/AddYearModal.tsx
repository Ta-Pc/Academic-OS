import React, { useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddYear: (year: number) => void;
  existingYears: number[];
}

const AddYearModal: React.FC<Props> = ({ isOpen, onClose, onAddYear, existingYears }) => {
  const [year, setYear] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Suggest the next year that doesn't exist yet
      const latestYear = Math.max(...existingYears, new Date().getFullYear());
      setYear(String(latestYear + 1));
      setError('');
    }
  }, [isOpen, existingYears]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum) || year.length !== 4) {
      setError('Please enter a valid 4-digit year.');
      return;
    }
    if (existingYears.includes(yearNum)) {
      setError('This academic year already exists.');
      return;
    }
    setError('');
    onAddYear(yearNum);
  };
  
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-year-title"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-xl max-w-sm w-full animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="add-year-title" className="text-xl font-bold text-slate-900 dark:text-slate-100">Add New Academic Year</h2>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="academic-year" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Academic Year
            </label>
            <input 
              id="academic-year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g., 2026"
              className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              autoFocus
            />
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          </div>
          <div className="flex justify-end space-x-4 pt-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
            >
              Add Year
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddYearModal;