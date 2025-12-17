
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (date: string) => void;
  initialDate?: string;
  title?: string;
}

const DatePicker: React.FC<Props> = ({ isOpen, onClose, onSelect, initialDate, title = "Select Date" }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isOpen && initialDate) {
      setCurrentDate(new Date(initialDate));
      setSelectedDate(initialDate);
    }
  }, [isOpen, initialDate]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 = Sun

  const handleDayClick = (day: number) => {
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${currentDate.getFullYear()}-${month}-${dayStr}`;
    setSelectedDate(dateStr);
    onSelect(dateStr);
    onClose();
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  if (!isOpen) return null;

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-[320px] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700">
            <h3 className="text-white font-bold text-lg font-hindi flex items-center gap-2">
                <CalendarIcon size={18} className="text-lime-400" />
                {title}
            </h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between p-4 bg-gray-900">
            <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                <ChevronLeft size={20} />
            </button>
            <span className="text-white font-bold text-lg">
                {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                <ChevronRight size={20} />
            </button>
        </div>

        {/* Grid */}
        <div className="p-4 pt-0">
            <div className="grid grid-cols-7 mb-2 text-center">
                {weekDays.map(d => (
                    <span key={d} className="text-xs font-bold text-gray-500 py-2">{d}</span>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                    const dayStr = String(day).padStart(2, '0');
                    const dateStr = `${currentDate.getFullYear()}-${month}-${dayStr}`;
                    const isSelected = selectedDate === dateStr;
                    const isToday = new Date().toISOString().split('T')[0] === dateStr;

                    return (
                        <button
                            key={day}
                            onClick={() => handleDayClick(day)}
                            className={`aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 
                                ${isSelected 
                                    ? 'bg-lime-500 text-gray-900 font-bold shadow-[0_0_15px_rgba(132,204,22,0.4)] scale-110' 
                                    : isToday 
                                        ? 'bg-gray-800 text-lime-400 border border-lime-500/50' 
                                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                }`}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex justify-between items-center bg-gray-900">
            <button 
                onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setSelectedDate(today);
                    onSelect(today);
                    onClose();
                }}
                className="text-xs font-bold text-lime-400 hover:text-lime-300 uppercase tracking-wider"
            >
                Today
            </button>
            <button 
                onClick={onClose} 
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-full text-xs font-bold text-white transition-colors"
            >
                Close
            </button>
        </div>

      </div>
    </div>
  );
};

export default DatePicker;
