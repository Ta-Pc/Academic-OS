import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../ui/Icon';

interface AddMenuProps {
    onAddModule: () => void;
}

const AddMenu: React.FC<AddMenuProps> = ({ onAddModule }) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const menuItems = [
        { label: 'Create Module', onClick: onAddModule, icon: 'FileText' as const },
        { label: 'Create Assignment', onClick: () => console.warn('Not implemented'), icon: 'FilePenLine' as const },
        { label: 'Create Study Session', onClick: () => console.warn('Not implemented'), icon: 'Clock' as const },
    ];

    return (
        <div className="relative">
            <button
                ref={triggerRef}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <Icon name="Plus" className="w-5 h-5" strokeWidth={2} />
                <span className="hidden sm:inline">Add New</span>
            </button>
            {isOpen && (
                <div
                    ref={menuRef}
                    className="absolute right-0 mt-2 w-56 origin-top-right bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-fade-in"
                    role="menu"
                    aria-orientation="vertical"
                >
                    <div className="py-1" role="none">
                        {menuItems.map(item => (
                            <button
                                key={item.label}
                                onClick={() => {
                                    item.onClick();
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                role="menuitem"
                            >
                                <Icon name={item.icon} className="w-5 h-5 text-slate-500 dark:text-slate-400" strokeWidth={1.5} />
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddMenu;