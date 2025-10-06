import React, { useState, useCallback, ChangeEvent, FormEvent, useEffect } from 'react';
import { AcademicInfo, Degree } from '../types';

interface Props {
  academicInfo: AcademicInfo;
  degree: Degree;
  setAcademicInfo: (data: AcademicInfo) => void;
  setDegree: (data: Degree) => void;
  onNext: () => void;
  onCancel: () => void;
}

interface ValidationErrors {
  [key: string]: string;
}

const AcademicInfoForm: React.FC<Props> = ({ academicInfo, degree, setAcademicInfo, setDegree, onNext, onCancel }) => {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const validate = useCallback(() => {
    const newErrors: ValidationErrors = {};
    if (!academicInfo.name.trim()) newErrors.name = 'Name is required.';
    if (!academicInfo.surname.trim()) newErrors.surname = 'Surname is required.';
    if (!/^\d{8}$/.test(academicInfo.studentNumber)) newErrors.studentNumber = 'Student number must be 8 digits.';
    if (!degree.institutionName.trim()) newErrors.institutionName = 'Institution name is required.';
    if (!degree.degreeName.trim()) newErrors.degreeName = 'Degree name is required.';
    if (degree.duration < 1) newErrors.duration = 'Duration must be a positive number.';
    if (degree.totalCreditsToGraduate <= 0) newErrors.totalCreditsToGraduate = 'Total credits must be a positive number.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [academicInfo, degree]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext();
    }
  };

  const handleInfoChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAcademicInfo({ ...academicInfo, [name]: value });
  };
  
  const handleDegreeChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      setDegree({ ...degree, [name]: type === 'number' ? Number(value) : value });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const profilePictureUrl = URL.createObjectURL(file);
      setAcademicInfo({ ...academicInfo, profilePicture: file, profilePictureUrl });
    }
  };
  
  const renderAvatar = () => {
    if (academicInfo.profilePictureUrl) {
      return <img src={academicInfo.profilePictureUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover" />;
    }
    const initials = `${academicInfo.name.charAt(0)}${academicInfo.surname.charAt(0)}`.toUpperCase();
    return (
      <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-3xl font-bold text-slate-500 dark:text-slate-400">
        {initials || '?'}
      </div>
    );
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center space-x-6">
        {renderAvatar()}
        <div>
          <label htmlFor="profilePicture" className="cursor-pointer bg-white dark:bg-slate-700 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600">
            Upload Picture
          </label>
          <input id="profilePicture" name="profilePicture" type="file" className="sr-only" onChange={handleFileChange} accept="image/*"/>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Optional. PNG, JPG, GIF up to 10MB.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField label="Name" name="name" value={academicInfo.name} onChange={handleInfoChange} error={errors.name} />
        <InputField label="Surname" name="surname" value={academicInfo.surname} onChange={handleInfoChange} error={errors.surname} />
        <InputField label="Student Number" name="studentNumber" value={academicInfo.studentNumber} onChange={handleInfoChange} error={errors.studentNumber} placeholder="e.g., 12345678" />
        <InputField label="Institution Name" name="institutionName" value={degree.institutionName} onChange={handleDegreeChange} error={errors.institutionName} placeholder="e.g., University of Pretoria" />
        <InputField label="Degree Name" name="degreeName" value={degree.degreeName} onChange={handleDegreeChange} error={errors.degreeName} />
        <InputField label="Specialization" name="specialization" value={degree.specialization || ''} onChange={handleDegreeChange} error={errors.specialization} />
        <SelectField label="NQF Level" name="nqfLevel" value={String(degree.nqfLevel)} onChange={handleDegreeChange} options={['5', '6', '7', '8', '9', '10']} />
        <InputField label="Duration (Years)" name="duration" type="number" min="1" max="10" value={String(degree.duration)} onChange={handleDegreeChange} error={errors.duration} />
        <InputField label="Total Credits to Graduate" name="totalCreditsToGraduate" type="number" min="1" value={String(degree.totalCreditsToGraduate)} onChange={handleDegreeChange} error={errors.totalCreditsToGraduate} />
        <InputField label="Start Date" name="startDate" type="date" value={degree.startDate} onChange={handleDegreeChange} error={errors.startDate} />

      </div>

      <div className="flex justify-between items-center pt-4">
        <button type="button" onClick={() => setShowCancelConfirm(true)} className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500">Cancel Setup</button>
        <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75">
          Next
        </button>
      </div>
      
      {showCancelConfirm && <CancelModal onConfirm={onCancel} onDismiss={() => setShowCancelConfirm(false)} />}
    </form>
  );
};

// Helper components defined outside to avoid re-creation on render
interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  readOnly?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ label, name, value, onChange, error, type = 'text', placeholder, min, max, readOnly = false }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
    <input
      type={type}
      name={name}
      id={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      min={min}
      max={max}
      readOnly={readOnly}
      className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${readOnly ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed' : ''}`}
    />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
}

const SelectField: React.FC<SelectFieldProps> = ({ label, name, value, onChange, options }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
    <select
      name={name}
      id={name}
      value={value}
      onChange={onChange}
      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
    >
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const CancelModal: React.FC<{ onConfirm: () => void; onDismiss: () => void; }> = ({ onConfirm, onDismiss }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-xl max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">Are you sure?</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">If you cancel now, all your progress will be lost and the setup will restart from the beginning.</p>
            <div className="flex justify-end space-x-4">
                <button onClick={onDismiss} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">No, continue</button>
                <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">Yes, cancel</button>
            </div>
        </div>
    </div>
);


export default AcademicInfoForm;
