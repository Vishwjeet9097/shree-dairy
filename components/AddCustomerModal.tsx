
import React, { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, Droplet, IndianRupee, Check, Star, Languages, Loader2, Sun, Moon } from 'lucide-react';
import { Language, Customer } from '../types';
import { TEXTS } from '../constants';
import { transliterateToHindi } from '../services/gemini';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Omit<Customer, 'id' | 'createdAt' | 'isActive'>) => void;
  initialData?: Customer | null;
  language: Language;
  apiKey?: string;
}

const AddCustomerModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialData, language, apiKey }) => {
  const t = TEXTS[language];
  
  const [formData, setFormData] = useState({
    name: '',
    nameHi: '',
    phone: '',
    address: '',
    defaultQty: '',
    ratePerKg: '',
    preferredTime: 'morning' as 'morning' | 'evening' | 'both',
    behavior: 'good' as 'very_good' | 'good' | 'ok' | 'bad'
  });

  const [isTransliterating, setIsTransliterating] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        name: initialData.name,
        nameHi: initialData.nameHi || '',
        phone: initialData.phone,
        address: initialData.address,
        defaultQty: initialData.defaultQty.toString(),
        ratePerKg: initialData.ratePerKg.toString(),
        preferredTime: initialData.preferredTime,
        behavior: initialData.behavior || 'good'
      });
    } else if (isOpen && !initialData) {
      setFormData({
        name: '',
        nameHi: '',
        phone: '',
        address: '',
        defaultQty: '',
        ratePerKg: '',
        preferredTime: 'morning',
        behavior: 'good'
      });
    }
  }, [isOpen, initialData]);

  // Auto-transliteration Effect
  useEffect(() => {
      // Don't run if name is empty
      if (!formData.name) return;

      // Debounce logic
      const timer = setTimeout(async () => {
          // If Hindi name is already manually set to something different, maybe we shouldn't overwrite?
          // For now, we assume if user is typing English name, they want auto-fill.
          if (formData.name) {
              setIsTransliterating(true);
              const hindiName = await transliterateToHindi(formData.name, apiKey);
              if (hindiName) {
                  setFormData(prev => ({ ...prev, nameHi: hindiName }));
              }
              setIsTransliterating(false);
          }
      }, 800);

      return () => clearTimeout(timer);
  }, [formData.name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.ratePerKg || !formData.defaultQty) return;

    onSave({
      name: formData.name,
      nameHi: formData.nameHi,
      phone: formData.phone,
      address: formData.address,
      defaultQty: parseFloat(formData.defaultQty),
      ratePerKg: parseFloat(formData.ratePerKg),
      preferredTime: formData.preferredTime,
      behavior: formData.behavior
    });
  };

  if (!isOpen) return null;

  const inputClass = "w-full bg-gray-50 dark:bg-gray-700 rounded-xl p-3 pl-10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-300 transition-all border border-gray-100 dark:border-gray-600";
  const iconClass = "absolute left-3 top-3.5 text-gray-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-[2rem] p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto transition-colors">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white font-hindi">
            {initialData ? t.editCustomer : t.addCustomer}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="text-gray-400 dark:text-gray-300" size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="relative group">
            <User size={18} className={iconClass} />
            <input 
              type="text" 
              placeholder={t.name}
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              className={inputClass}
              required
            />
          </div>

          <div className="relative group">
            <Languages size={18} className={iconClass} />
            <input 
              type="text" 
              placeholder={t.nameHi}
              value={formData.nameHi} 
              onChange={e => setFormData({...formData, nameHi: e.target.value})}
              className={inputClass}
            />
            {isTransliterating && (
                <div className="absolute right-3 top-3.5">
                    <Loader2 size={16} className="animate-spin text-lime-500" />
                </div>
            )}
          </div>

          <div className="relative group">
            <Phone size={18} className={iconClass} />
            <input 
              type="tel" 
              placeholder={t.phone}
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className={inputClass}
            />
          </div>

          <div className="relative group">
            <MapPin size={18} className={iconClass} />
            <input 
              type="text" 
              placeholder={t.address}
              value={formData.address} 
              onChange={e => setFormData({...formData, address: e.target.value})}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative group">
              <Droplet size={18} className={iconClass} />
              <input 
                type="number" 
                step="0.5"
                placeholder={t.qty}
                value={formData.defaultQty} 
                onChange={e => setFormData({...formData, defaultQty: e.target.value})}
                className={inputClass}
                required
              />
            </div>

            <div className="relative group">
              <IndianRupee size={18} className={iconClass} />
              <input 
                type="number" 
                placeholder={t.rate}
                value={formData.ratePerKg} 
                onChange={e => setFormData({...formData, ratePerKg: e.target.value})}
                className={inputClass}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
             {/* Time Selection - Segmented Control Style */}
             <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-xl flex">
                <button
                    type="button"
                    onClick={() => setFormData({...formData, preferredTime: 'morning'})}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${formData.preferredTime === 'morning' ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    <Sun size={14} /> {t.morning}
                </button>
                <button
                    type="button"
                    onClick={() => setFormData({...formData, preferredTime: 'evening'})}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${formData.preferredTime === 'evening' ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    <Moon size={14} /> {t.evening}
                </button>
                <button
                    type="button"
                    onClick={() => setFormData({...formData, preferredTime: 'both'})}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${formData.preferredTime === 'both' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    Both
                </button>
            </div>

            {/* Behavior Selection */}
            <div className="relative">
                <Star size={18} className={iconClass} />
                <select
                    value={formData.behavior}
                    onChange={(e) => setFormData({...formData, behavior: e.target.value as any})}
                    className={`${inputClass} appearance-none cursor-pointer`}
                >
                    <option value="very_good">{t.very_good}</option>
                    <option value="good">{t.good}</option>
                    <option value="ok">{t.ok}</option>
                    <option value="bad">{t.bad}</option>
                </select>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
            >
              {t.cancel}
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 rounded-xl bg-lime-400 text-gray-900 font-bold shadow-lg shadow-lime-200 dark:shadow-none hover:bg-lime-500 transition-all flex items-center justify-center gap-2"
            >
              <Check size={18} />
              {t.save}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddCustomerModal;
