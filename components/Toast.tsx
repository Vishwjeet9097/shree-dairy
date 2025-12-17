
import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

interface Props {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Toast: React.FC<Props> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Auto close after 4 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  const getStyles = () => {
    switch(type) {
      case 'success': return 'bg-white dark:bg-gray-800 border-l-4 border-lime-500 text-gray-800 dark:text-white';
      case 'error': return 'bg-white dark:bg-gray-800 border-l-4 border-red-500 text-gray-800 dark:text-white';
      default: return 'bg-white dark:bg-gray-800 border-l-4 border-blue-500 text-gray-800 dark:text-white';
    }
  };

  const getIcon = () => {
      switch(type) {
          case 'success': return <CheckCircle className="text-lime-500" size={24} />;
          case 'error': return <AlertCircle className="text-red-500" size={24} />;
          default: return <Info className="text-blue-500" size={24} />;
      }
  };

  return (
    <div className={`fixed top-4 left-4 right-4 z-[100] max-w-md mx-auto shadow-2xl rounded-xl p-4 flex items-center gap-3 animate-fade-in transition-all transform translate-y-0 ${getStyles()}`}>
        <div className="shrink-0">
            {getIcon()}
        </div>
        <div className="flex-1">
            <h4 className="font-bold text-sm uppercase tracking-wider opacity-70 mb-0.5">{type}</h4>
            <p className="font-medium text-sm leading-tight">{message}</p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X size={16} className="text-gray-400" />
        </button>
    </div>
  );
};

export default Toast;
