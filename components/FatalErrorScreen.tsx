import React from 'react';
import { Icon } from './ui/Icon';

interface Props {
  title: string;
  description: string;
}

const FatalErrorScreen: React.FC<Props> = ({ title, description }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
      <div className="max-w-md w-full text-center bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-red-200 dark:border-red-900">
        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
          <Icon name="AlertTriangle" className="w-10 h-10 text-red-600 dark:text-red-400" strokeWidth={1.5} />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{description}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-8 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export default FatalErrorScreen;
