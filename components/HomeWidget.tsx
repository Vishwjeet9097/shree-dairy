
import React, { useState, useEffect } from 'react';
import { Customer, MilkEntry } from '../types';
import { IndianRupee, Truck, ArrowRight, AlertCircle, Sun, Moon } from 'lucide-react';

interface Props {
  customers: Customer[];
  entries: MilkEntry[]; // To calc dues and pending
  payments: any[]; // To calc dues
  isDarkMode: boolean;
  onNavigate: (view: string) => void;
}

const HomeWidget: React.FC<Props> = ({ customers, entries, payments, isDarkMode, onNavigate }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  // --- Data Calculation ---
  
  // 1. High Dues
  const highDues = customers
    .map(c => {
        const cEntries = entries.filter(e => e.customerId === c.id);
        const cPayments = payments.filter(p => p.customerId === c.id);
        const bill = cEntries.reduce((acc, e) => acc + (e.isDelivered ? e.quantity * c.ratePerKg : 0), 0);
        const paid = cPayments.reduce((acc, p) => acc + p.amount, 0);
        return { ...c, due: bill - paid };
    })
    .filter(c => c.due > 500) // Only show significant dues
    .sort((a, b) => b.due - a.due)
    .slice(0, 3);

  // 2. Next Delivery Status
  const now = new Date();
  const currentHour = now.getHours();
  const isEvening = currentHour >= 14;
  const slot = isEvening ? 'evening' : 'morning';
  const todayStr = now.toISOString().split('T')[0];
  
  const activeCustomers = customers.filter(c => c.isActive);
  const targetCustomers = activeCustomers.filter(c => c.preferredTime === slot || c.preferredTime === 'both');
  
  const pendingCount = targetCustomers.filter(c => {
      return !entries.some(e => 
          e.customerId === c.id && 
          e.date === todayStr && 
          (e.slot === slot || (!e.slot && slot === 'morning'))
      );
  }).length;

  const totalRouteQty = targetCustomers.reduce((acc, c) => acc + c.defaultQty, 0);

  // --- Rotation Logic ---
  const cards = ['dues', 'delivery'];

  useEffect(() => {
    const timer = setInterval(() => {
        setActiveIndex(prev => (prev + 1) % cards.length);
    }, 6000); // 6 seconds per card
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full mb-6">
        <div className="relative h-40 w-full overflow-hidden rounded-[2rem] shadow-lg shadow-lime-500/10 dark:shadow-none border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
            
            {/* CARD 1: HIGH DUES */}
            <div 
                onClick={() => onNavigate('customers')}
                className={`absolute inset-0 p-5 transition-transform duration-500 ease-in-out cursor-pointer ${activeIndex === 0 ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-red-500">
                        <AlertCircle size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">High Dues Alert</span>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
                        <span className="text-xs font-bold text-red-600 dark:text-red-400">{highDues.length} Pending</span>
                    </div>
                </div>
                
                {highDues.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                        No pending dues! 🎉
                    </div>
                ) : (
                    <div className="space-y-2">
                        {highDues.map((c, i) => (
                            <div key={c.id} className="flex justify-between items-center text-sm">
                                <span className="font-hindi font-medium text-gray-700 dark:text-gray-300 truncate w-32">
                                    {i+1}. {c.name}
                                </span>
                                <span className="font-bold text-gray-900 dark:text-white">₹{Math.round(c.due)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* CARD 2: DELIVERY STATUS */}
            <div 
                onClick={() => onNavigate('dashboard')}
                className={`absolute inset-0 p-5 transition-transform duration-500 ease-in-out cursor-pointer ${activeIndex === 1 ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
            >
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-blue-500">
                        <Truck size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">{slot} Route</span>
                    </div>
                    <div className={`px-2 py-1 rounded-full ${slot === 'morning' ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {slot === 'morning' ? <Sun size={12}/> : <Moon size={12}/>}
                    </div>
                </div>

                <div className="flex justify-between items-end mt-4">
                    <div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{pendingCount}</p>
                        <p className="text-xs text-gray-500 uppercase font-bold mt-1">Customers Left</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{totalRouteQty} <span className="text-sm text-gray-400">kg</span></p>
                        <p className="text-xs text-gray-500 uppercase font-bold mt-1">Total Load</p>
                    </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4 w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-lime-500 transition-all duration-1000"
                        style={{ width: `${((targetCustomers.length - pendingCount) / (targetCustomers.length || 1)) * 100}%` }}
                    />
                </div>
            </div>

            {/* Indicators */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {cards.map((_, i) => (
                    <div 
                        key={i} 
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${i === activeIndex ? 'bg-gray-800 dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'}`}
                    />
                ))}
            </div>
        </div>
    </div>
  );
};

export default HomeWidget;
