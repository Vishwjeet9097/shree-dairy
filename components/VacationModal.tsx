
import React, { useState } from 'react';
import { X, Calendar, AlertCircle, Check, Droplet, Plane, CalendarRange, ChevronRight } from 'lucide-react';
import { Language } from '../types';
import { TEXTS } from '../constants';
import DatePicker from './DatePicker';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (startDate: string, endDate: string, reason: string, isDelivered: boolean, quantity?: number) => void;
  language: Language;
}

const VacationModal: React.FC<Props> = ({ isOpen, onClose, onSave, language }) => {
  const t = TEXTS[language];
  const today = new Date().toISOString().split('T')[0];
  
  const [actionType, setActionType] = useState<'delivery' | 'absence'>('delivery');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [reason, setReason] = useState('');
  const [quantity, setQuantity] = useState('');
  
  // Date Picker State
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end'>('start');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;
    
    const isDelivered = actionType === 'delivery';
    const finalReason = isDelivered ? 'Bulk Delivery' : (reason || 'Vacation');
    const finalQty = isDelivered && quantity ? parseFloat(quantity) : undefined;

    onSave(startDate, endDate, finalReason, isDelivered, finalQty);
    
    // Reset
    setQuantity('');
    setReason('');
    onClose();
  };

  const openPicker = (target: 'start' | 'end') => {
      setPickerTarget(target);
      setPickerOpen(true);
  };

  const handleDateSelect = (date: string) => {
      if (pickerTarget === 'start') {
          setStartDate(date);
          if (date > endDate) setEndDate(date); // Auto adjust end
      } else {
          if (date < startDate) {
              setStartDate(date); // Auto adjust start
              setEndDate(date);
          } else {
              setEndDate(date);
          }
      }
  };

  const calculateDays = () => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diff = end.getTime() - start.getTime();
      return Math.ceil(diff / (1000 * 3600 * 24)) + 1;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <DatePicker 
          isOpen={pickerOpen} 
          onClose={() => setPickerOpen(false)} 
          onSelect={handleDateSelect}
          initialDate={pickerTarget === 'start' ? startDate : endDate}
          title={pickerTarget === 'start' ? "Start Date" : "End Date"}
      />

      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 relative shadow-2xl transition-colors duration-300 border border-gray-100 dark:border-gray-700">
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-lime-100 dark:bg-lime-900/30 rounded-full flex items-center justify-center text-lime-600 dark:text-lime-400">
                  <CalendarRange size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white font-hindi">Range Action</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 rounded-full transition-colors text-gray-500 dark:text-gray-300">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Action Type Toggle */}
          <div className="bg-gray-100 dark:bg-gray-700 p-1.5 rounded-2xl flex relative">
              <button
                type="button"
                onClick={() => setActionType('delivery')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all relative z-10 ${
                    actionType === 'delivery' 
                    ? 'bg-white dark:bg-gray-600 text-lime-700 dark:text-lime-400 shadow-md transform scale-100' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-600/50'
                }`}
              >
                  <Droplet size={16} fill={actionType === 'delivery' ? "currentColor" : "none"} /> Delivery
              </button>
              <button
                type="button"
                onClick={() => setActionType('absence')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all relative z-10 ${
                    actionType === 'absence' 
                    ? 'bg-white dark:bg-gray-600 text-red-600 dark:text-red-400 shadow-md transform scale-100' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-600/50'
                }`}
              >
                  <Plane size={16} fill={actionType === 'absence' ? "currentColor" : "none"} /> Absence
              </button>
          </div>

          {/* Date Selection Cards */}
          <div className="flex items-center gap-2">
              <button 
                type="button" 
                onClick={() => openPicker('start')}
                className="flex-1 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-2xl p-3 flex flex-col items-start gap-1 hover:border-lime-400 transition-colors group"
              >
                  <span className="text-[10px] uppercase font-bold text-gray-400 group-hover:text-lime-500">From</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">{startDate}</span>
              </button>
              
              <ChevronRight size={20} className="text-gray-300 dark:text-gray-600" />

              <button 
                type="button" 
                onClick={() => openPicker('end')}
                className="flex-1 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-2xl p-3 flex flex-col items-start gap-1 hover:border-lime-400 transition-colors group"
              >
                  <span className="text-[10px] uppercase font-bold text-gray-400 group-hover:text-lime-500">To</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">{endDate}</span>
              </button>
          </div>

          {/* Duration Summary */}
          <div className="text-center">
              <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-bold">
                  Duration: {calculateDays()} Days
              </span>
          </div>

          {actionType === 'delivery' ? (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-600">
                 <div className="flex justify-between items-center mb-2">
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Quantity Override</label>
                    <span className="text-[10px] text-lime-600 bg-lime-100 dark:bg-lime-900/30 px-2 py-0.5 rounded-md font-bold">Optional</span>
                 </div>
                 <div className="relative">
                    <input 
                      type="number" 
                      value={quantity} 
                      onChange={e => setQuantity(e.target.value)}
                      className="w-full bg-white dark:bg-gray-600 rounded-xl p-3 pl-4 text-gray-900 dark:text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-300 font-bold"
                      placeholder="Default"
                    />
                    <div className="absolute right-4 top-3.5 text-xs text-gray-400 font-bold">Kg/L</div>
                 </div>
              </div>
          ) : (
             <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-600">
                 <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase block mb-2">{t.reason}</label>
                 <div className="relative">
                    <AlertCircle size={18} className="absolute left-3 top-3.5 text-gray-400" />
                    <input 
                      type="text" 
                      value={reason} 
                      onChange={e => setReason(e.target.value)}
                      className="w-full bg-white dark:bg-gray-600 rounded-xl p-3 pl-10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-300 transition-all"
                      placeholder="e.g. Out of Station"
                    />
                 </div>
             </div>
          )}

          <button 
            type="submit"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-lime-400 to-lime-500 text-gray-900 font-bold shadow-xl shadow-lime-200/50 dark:shadow-none hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Check size={20} />
            Confirm {actionType === 'delivery' ? 'Delivery' : 'Absence'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default VacationModal;
