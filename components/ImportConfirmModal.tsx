
import React from 'react';
import { X, AlertTriangle, FileJson, Check, Database } from 'lucide-react';
import { TEXTS } from '../constants';
import { Language } from '../types';

interface Props {
  isOpen: boolean;
  file: File | null;
  onClose: () => void;
  onConfirm: () => void;
  language: Language;
}

const ImportConfirmModal: React.FC<Props> = ({ isOpen, file, onClose, onConfirm, language }) => {
  const t = TEXTS[language];
  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm p-6 animate-fade-in">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-[2rem] p-6 relative shadow-2xl border border-red-100 dark:border-red-900/30">
        
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
             <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/50 border-4 border-white dark:border-gray-800 flex items-center justify-center text-red-500">
                 <AlertTriangle size={36} />
             </div>
        </div>

        <div className="mt-8 text-center mb-6">
             <h2 className="text-xl font-bold text-gray-900 dark:text-white font-hindi">Restore Backup?</h2>
             <p className="text-sm text-red-500 font-medium mt-1">This will overwrite ALL current app data.</p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
                <FileJson size={20} className="text-gray-400" />
                <span className="font-bold text-gray-700 dark:text-gray-200 truncate text-sm">{file.name}</span>
            </div>
            <div className="flex items-center gap-3">
                <Database size={20} className="text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    Size: {(file.size / 1024).toFixed(2)} KB
                </span>
            </div>
        </div>

        <div className="flex gap-3">
            <button 
                onClick={onClose}
                className="flex-1 py-3.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
                {t.cancel}
            </button>
            <button 
                onClick={onConfirm}
                className="flex-1 py-3.5 rounded-xl bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-200 dark:shadow-none hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
            >
                <Check size={18} />
                Yes, Restore
            </button>
        </div>
      </div>
    </div>
  );
};

export default ImportConfirmModal;
