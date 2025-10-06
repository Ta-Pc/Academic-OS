import React from 'react';

const BuildingDashboardStep: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 min-h-[450px]">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <h2 className="text-2xl font-bold mt-8 text-slate-800 dark:text-slate-200">Building Your Dashboard...</h2>
      <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
        We're crunching the numbers and preparing your personalized academic insights. This will just take a moment.
      </p>
    </div>
  );
};

export default BuildingDashboardStep;
