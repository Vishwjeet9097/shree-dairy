
import React from 'react';
import { Bell, Mic, ShieldCheck, X, FolderLock } from 'lucide-react';
import { Language } from '../types';

interface Props {
  isOpen: boolean;
  type: 'notification' | 'microphone' | 'storage';
  onConfirm: () => void;
  onCancel: () => void;
  language: Language;
}

const PermissionModal: React.FC<Props> = ({ isOpen, type, onConfirm, onCancel, language }) => {
  if (!isOpen) return null;

  const getDetails = () => {
      switch(type) {
          case 'notification': return {
              title: 'Enable Notifications',
              subtitle: 'Never miss a delivery.',
              desc: 'Get timely reminders for morning/evening routes and cattle alerts.',
              icon: <Bell size={40} className="text-white" />,
              gradient: 'from-lime-400 to-lime-600',
              shadow: 'shadow-lime-500/30'
          };
          case 'storage': return {
              title: 'Backup & Storage',
              subtitle: 'Prevent data loss.',
              desc: 'We need access to your Documents folder to save daily backups. This ensures your data is safe even if you uninstall the app.',
              icon: <FolderLock size={40} className="text-white" />,
              gradient: 'from-orange-400 to-orange-600',
              shadow: 'shadow-orange-500/30'
          };
          default: return {
              title: 'Voice Access',
              subtitle: 'Hands-free control.',
              desc: 'Shree AI needs microphone access to listen to your commands.',
              icon: <Mic size={40} className="text-white" />,
              gradient: 'from-blue-400 to-blue-600',
              shadow: 'shadow-blue-500/30'
          };
      }
  };

  const content = getDetails();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
      {/* Dark Backdrop with Blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={onCancel}></div>

      <div className="relative w-full max-w-sm bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden ring-1 ring-white/5">
         
         {/* Background Decoration */}
         <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-b ${content.gradient} rounded-full blur-[80px] opacity-20 pointer-events-none`}></div>

         {/* Close Button */}
         <button 
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"
         >
             <X size={20} />
         </button>

         <div className="relative z-10 flex flex-col items-center text-center">
             
             {/* Icon */}
             <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center bg-gradient-to-br ${content.gradient} shadow-lg ${content.shadow} mb-6 transform transition-transform hover:scale-105 duration-500`}>
                 {content.icon}
             </div>

             {/* Text */}
             <h3 className="text-2xl font-bold text-white mb-2 font-hindi tracking-wide">
                 {content.title}
             </h3>
             <p className="text-sm font-medium text-lime-400 uppercase tracking-widest mb-4">
                 {content.subtitle}
             </p>

             <p className="text-sm text-gray-400 mb-8 leading-relaxed px-2">
                 {content.desc}
             </p>

             {/* Actions */}
             <div className="flex flex-col w-full gap-3">
                 <button 
                    onClick={onConfirm}
                    className={`w-full py-4 rounded-2xl font-bold text-gray-900 bg-gradient-to-r ${content.gradient} shadow-lg ${content.shadow} hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2`}
                 >
                     <ShieldCheck size={20} />
                     Allow Access
                 </button>
                 <button 
                    onClick={onCancel}
                    className="w-full py-4 rounded-2xl font-bold text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                 >
                     Maybe Later
                 </button>
             </div>

             <div className="mt-6 flex items-center gap-2 text-[10px] text-gray-600">
                 <ShieldCheck size={12} />
                 <span>Secure & Private</span>
             </div>
         </div>
      </div>
    </div>
  );
};

export default PermissionModal;
