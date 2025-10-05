import React from 'react';
import { InitializationState } from '../types';

const InitializationScreen: React.FC<{ state: InitializationState }> = ({ state }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-200">Academic-OS</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Initializing your academic workspace...</p>

        <div className="mt-12">
          <div className="relative w-20 h-20 mx-auto">
            <div className="w-full h-full border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
            <div className="absolute inset-0 w-full h-full border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-700 dark:text-slate-300">
              {Math.round(state.progress)}%
            </div>
          </div>
          
          <p className="mt-6 text-slate-600 dark:text-slate-400 font-medium transition-opacity duration-300">
            {state.message}
          </p>
        </div>
        
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-8">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${state.progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default InitializationScreen;
