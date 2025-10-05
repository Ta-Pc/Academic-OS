import React, { useEffect, useRef } from 'react';
import { Icon } from './ui/Icon';

interface ToastProps {
  message: string;
  onUndo?: () => void;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onUndo, onClose }) => {
  const undoRef = useRef(onUndo);
  undoRef.current = onUndo;
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-close after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className="fixed bottom-5 left-1/2 -translate-x-1/2 w-full max-w-md p-4 bg-slate-800 text-white rounded-lg shadow-2xl flex items-center justify-between z-50 animate-slide-up"
      role="alert"
      aria-live="assertive"
    >
      <p className="text-sm font-medium">{message}</p>
      <div className="flex items-center gap-4">
        {onUndo && (
          <button
            onClick={undoRef.current}
            className="text-sm font-semibold text-blue-400 hover:text-blue-300"
          >
            Undo
          </button>
        )}
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white"
          aria-label="Dismiss"
        >
          <Icon name="X" className="w-5 h-5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};

export default Toast;