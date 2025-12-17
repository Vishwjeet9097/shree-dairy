
import React, { useState } from 'react';
import { X, Calendar, AlertCircle, Check, Droplet, Plane, CalendarRange } from 'lucide-react';
import { Language } from '../types';
import { TEXTS } from '../constants';

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-[2rem] p-6 relative shadow-2xl transition-colors duration-300">
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                  <CalendarRange size={20} className="text-gray-700 dark:text-gray-300"/>
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white font-hindi">Range Action</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="text-gray-400 dark:text-gray-300" size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Action Type Toggle */}
          <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-xl flex">
              <button
                type="button"
                onClick={() => setActionType('delivery')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    actionType === 'delivery' 
                    ? 'bg-white dark:bg-gray-600 text-lime-700 dark:text-lime-300 shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                  <Droplet size={16} /> Delivery
              </button>
              <button
                type="button"
                onClick={() => setActionType('absence')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    actionType === 'absence' 
                    ? 'bg-white dark:bg-gray-600 text-red-600 dark:text-red-300 shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                  <Plane size={16} /> Absence
              </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-xs text-gray-400 mb-1 ml-1 font-hindi">From</label>
                <input 
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl p-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-300 transition-all"
                    required
                />
              </div>
              <div className="relative">
                <label className="block text-xs text-gray-400 mb-1 ml-1 font-hindi">To</label>
                <input 
                    type="date" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl p-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-300 transition-all"
                    required
                />
              </div>
          </div>

          {actionType === 'delivery' ? (
              <div>
                 <label className="block text-xs text-gray-400 mb-1 ml-1 font-hindi">Quantity (Optional Override)</label>
                 <div className="relative">
                    <Droplet size={18} className="absolute left-3 top-3.5 text-gray-400" />
                    <input 
                      type="number" 
                      value={quantity} 
                      onChange={e => setQuantity(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl p-3 pl-10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-300 transition-all"
                      placeholder="Default Qty"
                    />
                 </div>
                 <p className="text-[10px] text-gray-400 mt-1 ml-1">Leave empty to use customer's default quantity.</p>
              </div>
          ) : (
             <div className="relative">
                 <label className="block text-xs text-gray-400 mb-1 ml-1 font-hindi">{t.reason}</label>
                 <div className="relative">
                    <AlertCircle size={18} className="absolute left-3 top-3.5 text-gray-400" />
                    <input 
                      type="text" 
                      value={reason} 
                      onChange={e => setReason(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl p-3 pl-10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-300 transition-all"
                      placeholder="e.g. Out of Station"
                    />
                 </div>
             </div>
          )}

          <div className={`p-3 rounded-xl flex gap-3 items-start ${actionType === 'delivery' ? 'bg-lime-100 dark:bg-lime-900/30' : 'bg-yellow-50 dark:bg-yellow-900/30'}`}>
             {actionType === 'delivery' ? <Check size={18} className="text-lime-700 dark:text-lime-400 mt-0.5" /> : <AlertCircle size={18} className="text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />}
             <p className={`text-xs leading-tight ${actionType === 'delivery' ? 'text-lime-800 dark:text-lime-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
                 {actionType === 'delivery' 
                    ? "Deliveries will be marked for every day in this range." 
                    : "Delivery will be skipped (0 kg) for the selected range."}
             </p>
          </div>

          <button 
            type="submit"
            className="w-full py-4 rounded-xl bg-lime-400 text-gray-900 font-bold shadow-lg shadow-lime-200 dark:shadow-none hover:bg-lime-500 transition-all flex items-center justify-center gap-2 mt-4"
          >
            <Check size={20} />
            Confirm
          </button>

        </form>
      </div>
    </div>
  );
};

export default VacationModal;
