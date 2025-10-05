import React, { useState, useRef, useEffect } from 'react';
import { Module, ModuleStatus } from '../../types';
import { Icon } from '../ui/Icon';

interface Props {
  module: Module;
  onBack: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  highlightedFields: Set<string>;
}

const statusStyles: Record<ModuleStatus, string> = {
  'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'Completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'Dropped': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  'Planned': 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
  'Archived': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

const ModuleHeader: React.FC<Props> = ({ module, onBack, onEdit, onArchive, onDelete, highlightedFields }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (
            menuRef.current &&
            !menuRef.current.contains(event.target as Node) &&
            triggerRef.current &&
            !triggerRef.current.contains(event.target as Node)
        ) {
            setIsMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <header>
      <div className="mb-4">
        <button onClick={onBack} className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-2">
          <Icon name="ChevronLeft" className="w-5 h-5" strokeWidth={2} />
          Back to Dashboard
        </button>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className={`rounded-md px-2 -ml-2 ${highlightedFields.has('moduleName') ? 'animate-flash' : ''}`}>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{module.moduleName}</h1>
            </div>
            <div className={`${highlightedFields.has('status') ? 'animate-flash rounded-full' : ''}`}>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusStyles[module.status]}`}>
                    {module.status}
                </span>
            </div>
          </div>
          <div className={`mt-1 rounded-md px-2 -ml-2 ${highlightedFields.has('moduleCode') ? 'animate-flash' : ''}`}>
            <p className="text-slate-600 dark:text-slate-400 font-mono">{module.moduleCode}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600">
            Edit
          </button>
           <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 shadow-sm">
            Add Assignment
          </button>
          <div className="relative">
            <button ref={triggerRef} onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600" aria-haspopup="true" aria-expanded={isMenuOpen}>
              <Icon name="MoreVertical" className="w-5 h-5 text-slate-600 dark:text-slate-400" strokeWidth={1.5} />
            </button>
            {isMenuOpen && (
                <div ref={menuRef} className="absolute right-0 mt-2 w-48 origin-top-right bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 animate-fade-in" role="menu" aria-orientation="vertical">
                    <div className="py-1" role="none">
                        <button onClick={() => { onArchive(); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700" role="menuitem">
                            <Icon name="Archive" className="w-5 h-5 text-slate-500 dark:text-slate-400" strokeWidth={1.5} />
                            <span>Archive</span>
                        </button>
                        <button onClick={() => { onDelete(); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50" role="menuitem">
                            <Icon name="Trash2" className="w-5 h-5" strokeWidth={1.5} />
                            <span>Delete</span>
                        </button>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default ModuleHeader;