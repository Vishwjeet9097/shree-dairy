
import React, { useState, useRef, useEffect } from 'react';
import { Bell, Trash2, CheckCircle, AlertTriangle, Info, X, Clock, Check, BellRing } from 'lucide-react';
import { AppNotification } from '../types';

interface Props {
  notifications: AppNotification[];
  onClearAll: () => void;
  onMarkAsRead: () => void;
  onDismiss: (id: string) => void;
}

const NotificationBell: React.FC<Props> = ({ notifications, onClearAll, onMarkAsRead, onDismiss }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Show only the last 5 notifications as requested
  const recentNotifications = notifications.slice(0, 5);
  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleDropdown = () => {
    if (!isOpen && unreadCount > 0) {
        onMarkAsRead();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (timestamp: number) => {
      const now = Date.now();
      const diff = Math.floor((now - timestamp) / 60000); // minutes
      if (diff < 1) return 'Just now';
      if (diff < 60) return `${diff}m`;
      const hours = Math.floor(diff / 60);
      if (hours < 24) return `${hours}h`;
      return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getIcon = (type: string) => {
      switch (type) {
          case 'error': return <AlertTriangle size={16} className="text-white" />;
          case 'success': return <CheckCircle size={16} className="text-white" />;
          default: return <Info size={16} className="text-white" />;
      }
  };

  const getIconBg = (type: string) => {
      switch (type) {
          case 'error': return 'bg-red-500 shadow-red-200 dark:shadow-none';
          case 'success': return 'bg-lime-500 shadow-lime-200 dark:shadow-none';
          default: return 'bg-blue-500 shadow-blue-200 dark:shadow-none';
      }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={toggleDropdown}
        className={`p-3 rounded-full relative transition-all duration-300 border ${isOpen ? 'bg-lime-100 border-lime-300 dark:bg-gray-700 dark:border-gray-600' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
      >
        <Bell size={20} className={`transition-colors ${isOpen ? 'text-lime-700 dark:text-lime-400' : 'text-gray-700 dark:text-gray-300'}`} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white dark:border-gray-800"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-16 w-[90vw] sm:w-[360px] bg-white dark:bg-gray-900 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-fade-in origin-top-right ring-1 ring-black/5 flex flex-col">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
                <div className="flex items-center gap-2">
                    <BellRing size={16} className="text-lime-600 dark:text-lime-400" />
                    <h3 className="font-bold text-gray-900 dark:text-white font-hindi">Recent Alerts</h3>
                </div>
                {notifications.length > 0 && (
                     <button 
                        onClick={(e) => { e.stopPropagation(); onClearAll(); }}
                        className="text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                        Clear All
                    </button>
                )}
            </div>
            
            {/* Content List */}
            <div className="flex-1 overflow-y-auto max-h-[60vh] custom-scrollbar p-2">
                {recentNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3 border border-dashed border-gray-200 dark:border-gray-700">
                            <CheckCircle size={24} className="text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            No recent notifications
                        </p>
                    </div>
                ) : (
                    recentNotifications.map((notif) => (
                        <div 
                            key={notif.id} 
                            className="relative group rounded-2xl p-3 mb-1 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex gap-3 items-start"
                        >
                            {/* Icon */}
                            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${getIconBg(notif.type)} mt-1`}>
                                {getIcon(notif.type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 pr-6">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h4 className={`text-sm font-bold truncate ${!notif.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                        {notif.type === 'error' ? 'Alert' : notif.type === 'success' ? 'Success' : 'Info'}
                                    </h4>
                                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                                        {formatTime(notif.timestamp)}
                                    </span>
                                </div>
                                <p className={`text-xs leading-relaxed line-clamp-2 ${!notif.read ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-500 dark:text-gray-500'}`}>
                                    {notif.message}
                                </p>
                            </div>
                            
                            {/* Dismiss Button */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDismiss(notif.id); }}
                                className="absolute top-2 right-2 p-1.5 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <X size={14} />
                            </button>

                            {/* Unread Dot */}
                            {!notif.read && (
                                <div className="absolute left-10 top-3 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
                            )}
                        </div>
                    ))
                )}
                
                {notifications.length > 5 && (
                    <div className="text-center py-2 border-t border-gray-50 dark:border-gray-800 mt-2">
                        <span className="text-[10px] text-gray-400">
                            + {notifications.length - 5} older notifications
                        </span>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
