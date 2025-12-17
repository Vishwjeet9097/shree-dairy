
import React, { useState, useEffect } from 'react';
import { X, Building, User, Phone, MapPin, Check } from 'lucide-react';
import { BusinessProfile } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: BusinessProfile) => void;
  currentProfile: BusinessProfile;
}

const BusinessProfileModal: React.FC<Props> = ({ isOpen, onClose, onSave, currentProfile }) => {
  const [formData, setFormData] = useState<BusinessProfile>(currentProfile);

  useEffect(() => {
    if (isOpen) {
        setFormData(currentProfile);
    }
  }, [isOpen, currentProfile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  const inputClass = "w-full bg-gray-50 dark:bg-gray-700 rounded-xl p-3 pl-10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-300 transition-all border border-gray-100 dark:border-gray-600";
  const iconClass = "absolute left-3 top-3.5 text-gray-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-[2rem] p-6 relative shadow-2xl transition-colors">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white font-hindi">Business Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="text-gray-400 dark:text-gray-300" size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="relative group">
            <Building size={18} className={iconClass} />
            <input 
              type="text" 
              placeholder="Business Name (English)"
              value={formData.businessName} 
              onChange={e => setFormData({...formData, businessName: e.target.value})}
              className={inputClass}
              required
            />
          </div>

          <div className="relative group">
            <Building size={18} className={iconClass} />
            <input 
              type="text" 
              placeholder="Business Name (Hindi)"
              value={formData.businessNameHi} 
              onChange={e => setFormData({...formData, businessNameHi: e.target.value})}
              className={inputClass}
            />
          </div>

          <div className="relative group">
            <User size={18} className={iconClass} />
            <input 
              type="text" 
              placeholder="Owner Name"
              value={formData.ownerName} 
              onChange={e => setFormData({...formData, ownerName: e.target.value})}
              className={inputClass}
              required
            />
          </div>

          <div className="relative group">
            <Phone size={18} className={iconClass} />
            <input 
              type="tel" 
              placeholder="Phone Number"
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className={inputClass}
              required
            />
          </div>

          <div className="relative group">
            <MapPin size={18} className={iconClass} />
            <input 
              type="text" 
              placeholder="Address"
              value={formData.address} 
              onChange={e => setFormData({...formData, address: e.target.value})}
              className={inputClass}
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full py-4 rounded-xl bg-lime-400 text-gray-900 font-bold shadow-lg shadow-lime-200 dark:shadow-none hover:bg-lime-500 transition-all flex items-center justify-center gap-2 mt-4"
          >
            <Check size={20} />
            Update Profile
          </button>

        </form>
      </div>
    </div>
  );
};

export default BusinessProfileModal;
