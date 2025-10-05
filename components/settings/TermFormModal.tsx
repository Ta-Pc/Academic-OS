import React, { useState, useEffect, useMemo } from 'react';
import { AcademicTerm } from '../../types';
import { parseISO, addDays, format, isWithinInterval, areIntervalsOverlapping, isValid } from 'date-fns';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (term: AcademicTerm) => void;
  year: number;
  termToEdit: AcademicTerm | null;
  parentTerm: AcademicTerm | null;
  isSemester: boolean;
  allTermsInYear: AcademicTerm[];
}

const addWeeksToDate = (dateStr: string, weeks: number): string => {
  if (!dateStr || !isValid(parseISO(dateStr))) return '';
  try {
    const date = parseISO(dateStr);
    const newDate = addDays(date, weeks * 7 - 1);
    return format(newDate, 'yyyy-MM-dd');
  } catch {
    return '';
  }
};

const TermFormModal: React.FC<Props> = ({ isOpen, onClose, onSave, year, termToEdit, parentTerm, isSemester, allTermsInYear }) => {
  
  const initialFormState = useMemo(() => {
    if (termToEdit) return termToEdit;
    
    const nextSemesterNum = allTermsInYear.filter(t => !t.parentTermId).length + 1;
    const nextQuarterNum = parentTerm ? allTermsInYear.filter(t => t.parentTermId === parentTerm.id).length + 1 : 1;
    
    return {
      id: `term-${Date.now()}`,
      academicYear: year,
      parentTermId: parentTerm ? parentTerm.id : null,
      termName: isSemester ? `Semester ${nextSemesterNum}` : `Quarter ${nextQuarterNum}`,
      startDate: parentTerm?.startDate || `${year}-01-15`,
      durationInWeeks: isSemester ? 14 : 7,
      endDate: '', // Will be calculated
      notionalHoursPerCredit: 10,
    };
  }, [termToEdit, year, parentTerm, isSemester, allTermsInYear]);
  
  const [formData, setFormData] = useState<Omit<AcademicTerm, 'gradePointAverageGoal'>>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const calculatedEndDate = addWeeksToDate(formData.startDate, formData.durationInWeeks);
    setFormData(prev => ({ ...prev, endDate: calculatedEndDate }));
  }, [formData.startDate, formData.durationInWeeks]);

  useEffect(() => {
    const validate = () => {
      const newErrors: Record<string, string> = {};
      if (!formData.termName) newErrors.termName = 'Term name is required.';
      if (!formData.startDate || !isValid(parseISO(formData.startDate))) newErrors.startDate = 'Start date is required.';
      if (formData.durationInWeeks <= 0) newErrors.durationInWeeks = 'Duration must be positive.';
      
      const siblings = allTermsInYear.filter(t => t.id !== formData.id && t.parentTermId === formData.parentTermId);
      const isNameDuplicate = siblings.some(
        sibling => sibling.termName.trim().toLowerCase() === formData.termName.trim().toLowerCase()
      );
      if (isNameDuplicate) {
          newErrors.termName = `A term named "${formData.termName}" already exists at this level.`;
      }
      
      if (!formData.startDate || !isValid(parseISO(formData.startDate)) || !formData.endDate || !isValid(parseISO(formData.endDate))) {
          setErrors(newErrors);
          return;
      }
      
      const myInterval = { start: parseISO(formData.startDate), end: parseISO(formData.endDate) };

      if (parentTerm) {
        const parentInterval = { start: parseISO(parentTerm.startDate), end: parseISO(parentTerm.endDate) };
        if (!isWithinInterval(myInterval.start, parentInterval) || !isWithinInterval(myInterval.end, parentInterval)) {
          newErrors.dateRange = `Dates must be within parent semester (${parentTerm.startDate} to ${parentTerm.endDate}).`;
        }
      }

      for (const sibling of siblings) {
        const siblingInterval = { start: parseISO(sibling.startDate), end: parseISO(sibling.endDate) };
        if (areIntervalsOverlapping(myInterval, siblingInterval, { inclusive: true })) {
          newErrors.overlap = `Term overlaps with ${sibling.termName}.`;
          break;
        }
      }
      setErrors(newErrors);
    };
    validate();
  }, [formData, allTermsInYear, parentTerm]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) || 0 : value,
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(errors).length === 0) {
      onSave(formData as AcademicTerm);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-xl max-w-lg w-full animate-slide-up" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-6">{termToEdit ? 'Edit' : 'Add'} {isSemester ? 'Semester' : 'Quarter'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField label="Term Name" name="termName" value={formData.termName} onChange={handleChange} error={errors.termName} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InputField label="Start Date" name="startDate" type="date" value={formData.startDate} onChange={handleChange} error={errors.startDate} />
            <InputField label="Duration (weeks)" name="durationInWeeks" type="number" value={String(formData.durationInWeeks)} onChange={handleChange} error={errors.durationInWeeks} />
            <InputField label="End Date" name="endDate" type="date" value={formData.endDate} readOnly />
          </div>
          {errors.dateRange && <p className="mt-2 text-xs text-red-600">{errors.dateRange}</p>}
          {errors.overlap && <p className="mt-2 text-xs text-red-600">{errors.overlap}</p>}
          
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg">Cancel</button>
            <button type="submit" disabled={Object.keys(errors).length > 0} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg disabled:bg-slate-400 disabled:cursor-not-allowed">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InputField: React.FC<{ label: string, name: string, value: string, onChange?: (e: any) => void, error?: string, readOnly?: boolean, type?: string }> = ({ label, name, value, onChange, error, readOnly, type="text" }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
    <input
      type={type} name={name} id={name} value={value} onChange={onChange} readOnly={readOnly}
      className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} rounded-md shadow-sm read-only:bg-slate-100 dark:read-only:bg-slate-700/50`}
    />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

export default TermFormModal;