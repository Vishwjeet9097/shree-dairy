
import React, { useState, useRef, useEffect } from 'react';
import { Bell, Trash2, CheckCircle, AlertTriangle, Info, X, Clock, Check } from 'lucide-react';
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
      if (diff < 60) return `${diff}m ago`;
      const hours = Math.floor(diff / 60);
      if (hours < 24) return `${hours}h ago`;
      return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getNotificationStyle = (type: string) => {
      switch (type) {
          case 'error': return 'bg-red-50/80 dark:bg-red-900/20 border-red-100 dark:border-red-900/50';
          case 'success': return 'bg-lime-50/80 dark:bg-lime-900/20 border-lime-100 dark:border-lime-900/50';
          default: return 'bg-white/80 dark:bg-gray-800/80 border-gray-100 dark:border-gray-700';
      }
  };

  const getIcon = (type: string) => {
      switch (type) {
          case 'error': return <AlertTriangle size={18} className="text-red-500" />;
          case 'success': return <CheckCircle size={18} className="text-lime-600 dark:text-lime-400" />;
          default: return <Info size={18} className="text-blue-500" />;
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
        <div className="absolute right-0 top-16 w-[90vw] sm:w-[400px] bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-white/20 dark:border-gray-700 z-50 overflow-hidden animate-fade-in origin-top-right ring-1 ring-black/5 flex flex-col max-h-[80vh]">
            
            {/* Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white/50 dark:bg-gray-800/50 sticky top-0 z-10 backdrop-blur-md">
                <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white font-hindi">Notifications</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {unreadCount > 0 ? `You have ${unreadCount} new alerts` : 'No new notifications'}
                    </p>
                </div>
                {notifications.length > 0 && (
                     <button 
                        onClick={(e) => { e.stopPropagation(); onClearAll(); }}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                        title="Clear All"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
            
            {/* Content List */}
            <div className="overflow-y-auto p-3 space-y-2 flex-1 custom-scrollbar">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 border border-dashed border-gray-200 dark:border-gray-700">
                            <Bell size={32} className="text-gray-300 dark:text-gray-600" />
                        </div>
                        <h4 className="text-gray-900 dark:text-white font-bold">All caught up!</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[200px] mt-1">
                            When you have delivery updates or alerts, they will appear here.
                        </p>
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <div 
                            key={notif.id} 
                            className={`relative group rounded-2xl p-4 border transition-all duration-200 hover:scale-[1.01] hover:shadow-md ${getNotificationStyle(notif.type)}`}
                        >
                            <div className="flex gap-4">
                                {/* Icon Container */}
                                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 shadow-sm border border-gray-50 dark:border-gray-700`}>
                                    {getIcon(notif.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`text-sm font-bold leading-tight ${!notif.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                            {notif.type === 'error' ? 'Action Required' : notif.type === 'success' ? 'Success' : 'Update'}
                                        </h4>
                                        <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap flex items-center gap-1 bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded-md">
                                            <Clock size={10} /> {formatTime(notif.timestamp)}
                                        </span>
                                    </div>
                                    <p className={`text-xs leading-relaxed ${!notif.read ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-500 dark:text-gray-500'}`}>
                                        {notif.message}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Dismiss Button */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDismiss(notif.id); }}
                                className="absolute top-2 right-2 p-1.5 rounded-full text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-white dark:hover:bg-gray-700 hover:text-red-500 hover:shadow-sm transition-all"
                            >
                                <X size={14} />
                            </button>

                            {/* Unread Indicator */}
                            {!notif.read && (
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
                <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 text-center sticky bottom-0 z-10">
                    <button 
                        onClick={onMarkAsRead}
                        className="text-xs font-bold text-gray-500 hover:text-lime-600 dark:text-gray-400 dark:hover:text-lime-400 transition-colors flex items-center justify-center gap-1 w-full"
                    >
                        <Check size={12} /> Mark all as read
                    </button>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
