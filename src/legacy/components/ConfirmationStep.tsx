import React from 'react';
import { AcademicInfo, Degree } from '../types';

interface Props {
  academicInfo: AcademicInfo;
  degree: Degree;
  onNext: () => void;
  onBack: () => void;
}

const ConfirmationStep: React.FC<Props> = ({ academicInfo, degree, onNext, onBack }) => {

  const renderAvatar = () => {
    if (academicInfo.profilePictureUrl) {
      return <img src={academicInfo.profilePictureUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover shadow-md" />;
    }
    const initials = `${academicInfo.name.charAt(0)}${academicInfo.surname.charAt(0)}`.toUpperCase();
    return (
      <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-3xl font-bold text-slate-500 dark:text-slate-400">
        {initials}
      </div>
    );
  };
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Please Confirm Your Details</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Review the information below. If everything is correct, proceed to the next step.</p>
      </div>

      <div className="p-6 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          {renderAvatar()}
          <div className="flex-grow">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{academicInfo.name} {academicInfo.surname}</h3>
            <p className="text-slate-600 dark:text-slate-300">Student No: {academicInfo.studentNumber}</p>
            <p className="text-slate-600 dark:text-slate-300">Institution: {degree.institutionName}</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <InfoItem label="Degree" value={degree.degreeName} />
          <InfoItem label="Specialization" value={degree.specialization || 'N/A'} />
          <InfoItem label="NQF Level" value={String(degree.nqfLevel)} />
          <InfoItem label="Duration" value={`${degree.duration} Years`} />
          <InfoItem label="Total Credits to Graduate" value={String(degree.totalCreditsToGraduate)} />
          <InfoItem label="Start Date" value={degree.startDate} />
        </div>
      </div>
      
      <div className="flex justify-between items-center pt-4">
        <button onClick={onBack} className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">
          Back
        </button>
        <button onClick={onNext} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75">
          Confirm & Next
        </button>
      </div>
    </div>
  );
};

const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="font-semibold text-slate-800 dark:text-slate-200">{label}</p>
    <p className="text-slate-600 dark:text-slate-300">{value}</p>
  </div>
);

export default ConfirmationStep;
