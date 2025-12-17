import React, { useState } from 'react';
import { X, IndianRupee, Calendar, CreditCard, Banknote, Check } from 'lucide-react';
import { Language, Payment } from '../types';
import { TEXTS } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: Omit<Payment, 'id'>) => void;
  customerId: string;
  language: Language;
}

const PaymentModal: React.FC<Props> = ({ isOpen, onClose, onSave, customerId, language }) => {
  const t = TEXTS[language];
  // Calculate today in local format YYYY-MM-DD
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${day}`;
  
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today);
  const [type, setType] = useState<'cash' | 'online'>('cash');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    onSave({ customerId, amount: parseFloat(amount), date, type });
    setAmount('');
    setDate(today);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-[2rem] p-6 relative shadow-2xl transition-colors">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white font-hindi">{t.addPayment}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="text-gray-400 dark:text-gray-300" size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="relative">
             <label className="block text-xs text-gray-400 mb-1 ml-1 font-hindi">{t.amount}</label>
             <div className="relative">
                <IndianRupee size={20} className="absolute left-3 top-3.5 text-lime-600 dark:text-lime-400" />
                <input 
                  type="number" 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl p-3 pl-10 text-gray-900 dark:text-white text-xl font-bold placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-300 transition-all"
                  placeholder="0"
                  autoFocus
                  required
                />
             </div>
          </div>

          <div className="relative">
             <label className="block text-xs text-gray-400 mb-1 ml-1 font-hindi">{t.calendar}</label>
             <div className="relative">
                <Calendar size={18} className="absolute left-3 top-3.5 text-gray-400" />
                <input 
                  type="date" 
                  value={date} 
                  max={today}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl p-3 pl-10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-300 transition-all"
                />
             </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2 ml-1 font-hindi">{t.mode}</label>
            <div className="grid grid-cols-2 gap-3">
                <button
                type="button"
                onClick={() => setType('cash')}
                className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${type === 'cash' ? 'bg-lime-100 dark:bg-lime-900/30 border-lime-400 text-lime-800 dark:text-lime-300' : 'bg-gray-50 dark:bg-gray-700 border-transparent text-gray-400 dark:text-gray-400'}`}
                >
                <Banknote size={24} />
                <span className="text-sm font-medium">{t.cash}</span>
                </button>
                <button
                type="button"
                onClick={() => setType('online')}
                className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${type === 'online' ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 text-blue-800 dark:text-blue-300' : 'bg-gray-50 dark:bg-gray-700 border-transparent text-gray-400 dark:text-gray-400'}`}
                >
                <CreditCard size={24} />
                <span className="text-sm font-medium">{t.online}</span>
                </button>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-4 rounded-xl bg-lime-400 text-gray-900 font-bold shadow-lg shadow-lime-200 dark:shadow-none hover:bg-lime-500 transition-all flex items-center justify-center gap-2 mt-4"
          >
            <Check size={20} />
            {t.save}
          </button>

        </form>
      </div>
    </div>
  );
};

export default PaymentModal;