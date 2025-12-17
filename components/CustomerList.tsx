
import React, { useState } from 'react';
import { Customer, Language, MilkEntry, Payment, AppNotification } from '../types';
import { TEXTS } from '../constants';
import { Phone, MapPin, User, Search, Filter, Ban, CheckCircle } from 'lucide-react';
import NotificationBell from './NotificationBell';

interface Props {
  customers: Customer[];
  entries: MilkEntry[]; // Needed for calculation
  payments: Payment[]; // Needed for calculation
  notifications: AppNotification[]; // New Prop
  language: Language;
  onSelect: (customer: Customer) => void;
  onAddCustomer: () => void;
  onClearNotifications: () => void; // New Prop
  onMarkNotificationsRead: () => void; // New Prop
  onDismissNotification: (id: string) => void; // New Prop
}

const CustomerList: React.FC<Props> = ({ customers, entries, payments, notifications, language, onSelect, onAddCustomer, onClearNotifications, onMarkNotificationsRead, onDismissNotification }) => {
  const t = TEXTS[language];
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'pastDue'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Helper to get name based on language preference
  const getName = (customer: Customer) => {
      return (language === 'hi' && customer.nameHi) ? customer.nameHi : customer.name;
  };

  // Enhanced Financial Calculation
  const getFinancialStatus = (customer: Customer) => {
    // 1. Calculate All-time Totals
    const customerEntries = entries.filter(e => e.customerId === customer.id);
    const customerPayments = payments.filter(p => p.customerId === customer.id);
    
    const totalMilk = customerEntries.reduce((acc, e) => acc + (e.isDelivered ? e.quantity : 0), 0);
    const totalBill = totalMilk * customer.ratePerKg;
    const totalPaid = customerPayments.reduce((acc, p) => acc + p.amount, 0);
    const totalDue = totalBill - totalPaid;

    if (totalDue <= 0) return { status: 'settled', amount: Math.abs(totalDue) };

    // 2. Determine if it is "Past Due" or just "Running Current Bill"
    const today = new Date();
    const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];

    // Filter items BEFORE this month
    const pastEntries = customerEntries.filter(e => e.date < startOfCurrentMonth);
    const pastBill = pastEntries.reduce((acc, e) => acc + (e.isDelivered ? e.quantity * customer.ratePerKg : 0), 0);
    
    // We assume payments cover oldest debt first (FIFO)
    // If Total Paid < Past Bill, then they still owe money from previous months
    const isPastDue = totalPaid < pastBill;

    if (isPastDue) {
        return { status: 'pastDue', amount: totalDue };
    } else {
        return { status: 'currentBill', amount: totalDue };
    }
  };

  const getBehaviorColor = (behavior: string) => {
      switch(behavior) {
          case 'very_good': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
          case 'good': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
          case 'ok': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
          case 'bad': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
          default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
      }
  };

  const filteredCustomers = customers.filter(customer => {
      // Search Filter - search against both English and Hindi names if available
      const searchLower = searchQuery.toLowerCase();
      const nameEn = customer.name.toLowerCase();
      const nameHi = customer.nameHi ? customer.nameHi.toLowerCase() : '';
      
      const matchesSearch = nameEn.includes(searchLower) || 
                            nameHi.includes(searchLower) ||
                            customer.phone.includes(searchQuery) ||
                            customer.address.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Status Filter
      if (filterStatus === 'active') return customer.isActive;
      if (filterStatus === 'inactive') return !customer.isActive;
      if (filterStatus === 'pastDue') {
          return getFinancialStatus(customer).status === 'pastDue';
      }
      
      return true;
  });

  return (
    <div className="pb-36 pt-2 animate-fade-in">
      
      {/* Header matching Dashboard style */}
      <div className="flex items-center justify-between mb-6">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center transition-colors">
               <User size={20} className="text-gray-600 dark:text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-hindi">{t.customers}</h2>
         </div>
         <NotificationBell 
            notifications={notifications}
            onClearAll={onClearNotifications}
            onMarkAsRead={onMarkNotificationsRead}
            onDismiss={onDismissNotification}
         />
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
         <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
         <input 
            type="text" 
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-gray-800 rounded-2xl py-3 pl-12 pr-12 text-gray-700 dark:text-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-300 transition-colors"
         />
         <div className="absolute right-4 top-3.5 text-gray-400">
            <Filter size={20} />
         </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
         <button 
           onClick={() => setFilterStatus('all')} 
           className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${filterStatus === 'all' ? 'bg-lime-300 text-gray-900 shadow-md' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-transparent'}`}
         >
            {t.all}
         </button>
         <button 
           onClick={() => setFilterStatus('pastDue')} 
           className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${filterStatus === 'pastDue' ? 'bg-red-300 dark:bg-red-500/50 text-gray-900 dark:text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-transparent'}`}
         >
            {t.pastDue}
         </button>
         <button 
           onClick={() => setFilterStatus('active')} 
           className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${filterStatus === 'active' ? 'bg-lime-300 text-gray-900 shadow-md' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-transparent'}`}
         >
            {t.active}
         </button>
         <button 
           onClick={() => setFilterStatus('inactive')} 
           className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${filterStatus === 'inactive' ? 'bg-lime-300 text-gray-900 shadow-md' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-transparent'}`}
         >
            {t.inactive}
         </button>
      </div>
      
      {/* List */}
      <div className="space-y-4">
        <div className="flex justify-between items-end px-1">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                {filterStatus === 'all' ? t.all : filterStatus === 'active' ? t.active : filterStatus === 'inactive' ? t.inactive : t.pastDue}
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">({filteredCustomers.length})</span>
            </h3>
        </div>

        {filteredCustomers.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
                <p>No customers found.</p>
            </div>
        ) : (
            filteredCustomers.map(customer => {
            const financial = getFinancialStatus(customer);
            const behaviorClass = getBehaviorColor(customer.behavior || 'good');
            
            // Render Logic
            const isInactive = !customer.isActive;
            const isPastDue = financial.status === 'pastDue';
            const isSettled = financial.status === 'settled';

            return (
                <div 
                    key={customer.id} 
                    className={`bg-white dark:bg-gray-800 p-4 rounded-[1.5rem] flex items-center justify-between shadow-sm border border-gray-50 dark:border-gray-700 relative overflow-hidden group ${isInactive ? 'opacity-70 grayscale-[0.5]' : 'active:scale-[0.98] transition-transform cursor-pointer'}`}
                >
                    {/* Main Click Area */}
                    <div 
                        className="flex-1 flex items-center gap-4 z-10"
                        onClick={() => onSelect(customer)}
                    >
                        <div className="relative">
                            <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-800 dark:text-gray-200 font-bold text-xl transition-colors">
                                {getName(customer).charAt(0)}
                            </div>
                            {/* Status Dot */}
                            {isInactive ? (
                                <div className="absolute -bottom-1 -right-1 bg-gray-500 text-white rounded-full p-0.5 border-2 border-white dark:border-gray-800">
                                    <Ban size={12} />
                                </div>
                            ) : (
                                <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${customer.isActive ? 'bg-lime-400' : 'bg-gray-300'}`}></div>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className={`font-bold font-hindi text-base ${isInactive ? 'text-gray-500 dark:text-gray-400 line-through decoration-2' : 'text-gray-900 dark:text-white'}`}>
                                    {getName(customer)}
                                </h3>
                                {!isInactive && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${behaviorClass}`}>
                                        {t[customer.behavior || 'good']}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                <MapPin size={10} /> {customer.address}
                            </div>
                        </div>
                    </div>
                    
                    {/* Right Side Actions / Info */}
                    <div className="flex flex-col items-end gap-2 z-10 pl-2">
                        {isInactive ? (
                            <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 text-xs font-bold">
                                {t.inactive}
                            </span>
                        ) : (
                            <>
                                {isPastDue && (
                                    <div className="flex flex-col items-end animate-pulse">
                                        <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">{t.pastDue}</span>
                                        <span className="text-red-600 dark:text-red-400 font-bold">₹{financial.amount.toFixed(0)}</span>
                                    </div>
                                )}
                                
                                {financial.status === 'currentBill' && (
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] text-blue-500 dark:text-blue-400 font-bold uppercase tracking-wider">{t.currentBill}</span>
                                        <span className="text-gray-900 dark:text-white font-bold">₹{financial.amount.toFixed(0)}</span>
                                    </div>
                                )}

                                {isSettled && (
                                    <span className="px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300 text-xs font-bold flex items-center gap-1">
                                        <CheckCircle size={12} /> {t.settled}
                                    </span>
                                )}
                            </>
                        )}
                        
                        {/* Quick Call Button (Visible) */}
                        <a 
                            href={`tel:${customer.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-lime-300 hover:text-gray-900 transition-colors"
                        >
                            <Phone size={16} />
                        </a>
                    </div>
                </div>
            );
            })
        )}
      </div>
      
      {/* Add New Button */}
      <button 
        onClick={onAddCustomer}
        className="fixed bottom-36 right-6 w-14 h-14 bg-gray-900 dark:bg-lime-400 rounded-full flex items-center justify-center shadow-lg text-white dark:text-gray-900 z-50 hover:scale-105 transition-transform"
      >
         <User size={24} />
      </button>
    </div>
  );
};

export default CustomerList;
