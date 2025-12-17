
import React from 'react';
import { Bell, Mic, Check, X } from 'lucide-react';
import { Language } from '../types';

interface Props {
  isOpen: boolean;
  type: 'notification' | 'microphone';
  onConfirm: () => void;
  onCancel: () => void;
  language: Language;
}

const PermissionModal: React.FC<Props> = ({ isOpen, type, onConfirm, onCancel, language }) => {
  if (!isOpen) return null;

  const isNotif = type === 'notification';

  const content = {
    title: isNotif ? 'Stay Updated' : 'Enable Voice Assistant',
    description: isNotif 
        ? 'We use notifications to remind you about daily milk routes (Morning/Evening) and alert you about critical cattle events (Calving dates). This ensures you never miss a business task.'
        : 'To use the Voice Assistant, we need access to your microphone. This allows you to add entries, payments, and customers using voice commands. Audio is processed securely.',
    icon: isNotif ? <Bell size={32} className="text-lime-600" /> : <Mic size={32} className="text-blue-600" />,
    colorClass: isNotif ? 'bg-lime-100 text-lime-600' : 'bg-blue-100 text-blue-600',
    btnClass: isNotif ? 'bg-lime-500 hover:bg-lime-600 shadow-lime-200' : 'bg-blue-500 hover:bg-blue-600 shadow-blue-200'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative text-center">
         
         <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${content.colorClass} shadow-inner`}>
             {content.icon}
         </div>

         <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 font-hindi">
             {content.title}
         </h3>

         <p className="text-sm text-gray-500 dark:text-gray-300 mb-8 leading-relaxed">
             {content.description}
         </p>

         <div className="flex gap-3">
             <button 
                onClick={onCancel}
                className="flex-1 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
             >
                 Not Now
             </button>
             <button 
                onClick={onConfirm}
                className={`flex-1 py-3.5 rounded-xl text-white font-bold shadow-lg ${content.btnClass} transition-transform active:scale-95`}
             >
                 Allow
             </button>
         </div>

         <div className="mt-4">
             <p className="text-[10px] text-gray-400">
                 You can change this anytime in device settings.
             </p>
         </div>
      </div>
    </div>
  );
};

export default PermissionModal;
