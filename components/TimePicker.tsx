
import React, { useState, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (time: string) => void;
  initialTime: string; // "HH:MM" 24h format
  title?: string;
}

const TimePicker: React.FC<Props> = ({ isOpen, onClose, onSave, initialTime, title = "Select Time" }) => {
  const [selectedHour, setSelectedHour] = useState(8);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');

  // Convert initial "HH:MM" (24h) to internal state
  useEffect(() => {
    if (isOpen) {
        const [h, m] = initialTime.split(':').map(Number);
        let hour12 = h % 12;
        if (hour12 === 0) hour12 = 12;
        
        setSelectedHour(hour12);
        setSelectedMinute(m);
        setPeriod(h >= 12 ? 'PM' : 'AM');
    }
  }, [isOpen, initialTime]);

  const handleSave = () => {
      // Convert back to 24h string
      let h = selectedHour;
      if (period === 'PM' && h < 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      
      const timeStr = `${String(h).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
      onSave(timeStr);
      onClose();
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
        <div className="w-full max-w-xs bg-gray-900 border border-gray-700 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700">
                <h3 className="text-white font-bold text-lg font-hindi">{title}</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Display / Toggles */}
            <div className="flex justify-center gap-2 p-6 bg-gray-900">
                <div className="flex-1 bg-blue-500/20 border border-blue-500 rounded-xl flex items-center justify-center h-14">
                    <span className="text-2xl font-bold text-white">{String(selectedHour).padStart(2, '0')}</span>
                </div>
                <span className="text-2xl font-bold text-gray-500 self-center">:</span>
                <div className="flex-1 bg-blue-500/20 border border-blue-500 rounded-xl flex items-center justify-center h-14">
                    <span className="text-2xl font-bold text-white">{String(selectedMinute).padStart(2, '0')}</span>
                </div>
                <div className="flex-1 bg-blue-500/20 border border-blue-500 rounded-xl flex items-center justify-center h-14">
                    <span className="text-xl font-bold text-white">{period}</span>
                </div>
            </div>

            {/* Scrollable Lists */}
            <div className="flex h-48 bg-gray-900 border-t border-gray-800">
                
                {/* Hours */}
                <div className="flex-1 overflow-y-auto no-scrollbar py-16 scroll-snap-y">
                    {hours.map(h => (
                        <div 
                            key={h} 
                            onClick={() => setSelectedHour(h)}
                            className={`h-10 flex items-center justify-center cursor-pointer transition-colors snap-center ${selectedHour === h ? 'text-blue-400 font-bold text-xl scale-110' : 'text-gray-500 text-sm hover:text-gray-300'}`}
                        >
                            {String(h).padStart(2, '0')}
                        </div>
                    ))}
                </div>

                {/* Minutes */}
                <div className="flex-1 overflow-y-auto no-scrollbar py-16 border-x border-gray-800 scroll-snap-y">
                    {minutes.map(m => (
                        <div 
                            key={m} 
                            onClick={() => setSelectedMinute(m)}
                            className={`h-10 flex items-center justify-center cursor-pointer transition-colors snap-center ${selectedMinute === m ? 'text-blue-400 font-bold text-xl scale-110' : 'text-gray-500 text-sm hover:text-gray-300'}`}
                        >
                            {String(m).padStart(2, '0')}
                        </div>
                    ))}
                </div>

                {/* AM/PM */}
                <div className="flex-1 flex flex-col justify-center gap-2 p-2">
                    <button 
                        onClick={() => setPeriod('AM')}
                        className={`flex-1 rounded-lg font-bold text-sm transition-colors flex items-center justify-center ${period === 'AM' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:bg-gray-800'}`}
                    >
                        AM
                    </button>
                    <button 
                        onClick={() => setPeriod('PM')}
                        className={`flex-1 rounded-lg font-bold text-sm transition-colors flex items-center justify-center ${period === 'PM' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:bg-gray-800'}`}
                    >
                        PM
                    </button>
                </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-gray-800 border-t border-gray-700">
                <button 
                    onClick={handleSave}
                    className="w-full py-3.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                    <Check size={20} /> Set Time
                </button>
            </div>

        </div>
    </div>
  );
};

export default TimePicker;
