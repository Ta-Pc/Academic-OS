import React from 'react';

export const NotAvailable: React.FC<{ tooltipText?: string; className?: string }> = ({ tooltipText = 'Data will be calculated once available.', className = '' }) => {
    return (
        <span className={`text-slate-500 dark:text-slate-400 italic ${className}`} title={tooltipText}>
            Not available
        </span>
    );
};
