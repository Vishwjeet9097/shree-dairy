
import React, { useState, useMemo, useEffect } from 'react';
import { Customer, MilkEntry, Language, Payment, AppNotification, InseminationRecord } from '../types';
import { TEXTS } from '../constants';
import { Droplet, Users, TrendingUp, Search, Activity, CheckCircle, Circle, MapPin, Check, ChevronRight, CheckSquare, IndianRupee, ArrowUpRight, Sun, Moon, Calendar, Clock, X, ArrowRight, Info } from 'lucide-react';
import NotificationBell from './NotificationBell';

interface Props {
  customers: Customer[];
  entries: MilkEntry[];
  payments: Payment[]; 
  notifications: AppNotification[]; 
  inseminations: InseminationRecord[]; 
  language: Language;
  isDarkMode: boolean;
  onAddEntry: (entry: MilkEntry) => void;
  onViewAll: () => void;
  onMarkAll: () => void;
  onSelectCustomer: (customer: Customer) => void;
  onClearNotifications: () => void; 
  onMarkNotificationsRead: () => void; 
  onDismissNotification: (id: string) => void; 
  onProfileClick: () => void; 
}

type Period = 'thisMonth' | 'lastMonth' | 'yearly';

const Dashboard: React.FC<Props> = ({ customers, entries, payments, notifications, inseminations, language, isDarkMode, onAddEntry, onViewAll, onMarkAll, onSelectCustomer, onClearNotifications, onMarkNotificationsRead, onDismissNotification, onProfileClick }) => {
  const t = TEXTS[language];
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Real-time clock to ensure slot updates automatically
  const [now, setNow] = useState(new Date());
  useEffect(() => {
      const interval = setInterval(() => setNow(new Date()), 60000); // Update every minute
      return () => clearInterval(interval);
  }, []);

  const currentHour = now.getHours();
  // Determine current slot based on time (After 2PM = Evening)
  const isEvening = currentHour >= 14; 
  const currentSlot = isEvening ? 'evening' : 'morning';

  // Local State
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState<Period>('thisMonth');
  const [selectedCow, setSelectedCow] = useState<(InseminationRecord & { daysLeft: number, dueDate: Date }) | null>(null);

  // Helper to get name based on language preference
  const getName = (customer: Customer) => {
      return (language === 'hi' && customer.nameHi) ? customer.nameHi : customer.name;
  };

  // --- NEAREST COW CALCULATION ---
  const nearestCow = useMemo(() => {
    if (inseminations.length === 0) return null;
    const now = new Date();
    const records = inseminations.map(cow => {
        const insemDate = new Date(cow.inseminationDate);
        const dueDate = new Date(insemDate);
        dueDate.setDate(insemDate.getDate() + 283); // ~283 gestation days
        const diffTime = dueDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { ...cow, dueDate, daysLeft };
    });
    
    // Filter for future or very recent past (e.g. overdue by max 30 days)
    const upcoming = records
        .filter(r => r.daysLeft >= -30) 
        .sort((a, b) => a.daysLeft - b.daysLeft);
        
    return upcoming[0] || null;
  }, [inseminations]);

  // --- DATA AGGREGATION & STATS ---
  const dashboardData = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Aggregation Maps
    const dailyStats = new Map<string, { milk: number, billed: number, collected: number }>();
    const monthlyStats = new Map<string, { milk: number, billed: number, collected: number }>();

    // 1. Process Entries (Revenue & Milk)
    entries.forEach(e => {
        if (!e.isDelivered) return;
        const cust = customers.find(c => c.id === e.customerId);
        if (!cust) return;
        
        const amount = e.quantity * cust.ratePerKg;
        const dateKey = e.date; // YYYY-MM-DD
        const monthKey = e.date.substring(0, 7); // YYYY-MM

        // Daily Update
        const d = dailyStats.get(dateKey) || { milk: 0, billed: 0, collected: 0 };
        d.milk += e.quantity;
        d.billed += amount;
        dailyStats.set(dateKey, d);

        // Monthly Update
        const m = monthlyStats.get(monthKey) || { milk: 0, billed: 0, collected: 0 };
        m.milk += e.quantity;
        m.billed += amount;
        monthlyStats.set(monthKey, m);
    });

    // 2. Process Payments (Collected)
    let cashTotal = 0;
    let onlineTotal = 0;

    payments.forEach(p => {
        const dateKey = p.date;
        const monthKey = p.date.substring(0, 7);

        // Daily Update
        const d = dailyStats.get(dateKey) || { milk: 0, billed: 0, collected: 0 };
        d.collected += p.amount;
        dailyStats.set(dateKey, d);

        // Monthly Update
        const m = monthlyStats.get(monthKey) || { milk: 0, billed: 0, collected: 0 };
        m.collected += p.amount;
        monthlyStats.set(monthKey, m);
    });

    // 3. Generate Chart Data based on Period
    let chartData = [];
    let totalBilled = 0;
    let totalCollected = 0;
    let totalMilk = 0;

    if (period === 'yearly') {
        // Last 12 months
        for (let i = 0; i < 12; i++) {
            const date = new Date(currentYear, currentMonth - (11 - i), 1);
            // Properly format to YYYY-MM
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const key = `${y}-${m}`;
            const monthName = date.toLocaleString('default', { month: 'short' });

            const stats = monthlyStats.get(key) || { milk: 0, billed: 0, collected: 0 };
            
            chartData.push({
                name: monthName,
                billed: stats.billed,
                collected: stats.collected,
                milk: stats.milk
            });

            totalBilled += stats.billed;
            totalCollected += stats.collected;
            totalMilk += stats.milk;
        }
        
        // Calculate Payment Splits for the whole year
        payments.forEach(p => {
             // Check if payment falls in last 12 months roughly
             const pDate = new Date(p.date);
             const oneYearAgo = new Date(today);
             oneYearAgo.setFullYear(today.getFullYear() - 1);
             if (pDate >= oneYearAgo) {
                 if (p.type === 'cash') cashTotal += p.amount;
                 else onlineTotal += p.amount;
             }
        });

    } else {
        // Daily Data (This Month or Last Month)
        const targetMonth = period === 'thisMonth' ? currentMonth : currentMonth - 1;
        const targetYear = period === 'thisMonth' ? currentYear : (targetMonth === -1 ? currentYear - 1 : currentYear);
        const actualMonth = targetMonth === -1 ? 11 : targetMonth;
        const daysInMonth = new Date(targetYear, actualMonth + 1, 0).getDate();
        
        // Form "YYYY-MM" prefix for filtering payments for split
        const targetPrefix = `${targetYear}-${String(actualMonth + 1).padStart(2,'0')}`;

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${targetYear}-${String(actualMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            const stats = dailyStats.get(dateStr) || { milk: 0, billed: 0, collected: 0 };

            chartData.push({
                name: day.toString(),
                billed: stats.billed,
                collected: stats.collected,
                milk: stats.milk
            });

            totalBilled += stats.billed;
            totalCollected += stats.collected;
            totalMilk += stats.milk;
        }

        // Calculate Payment Splits for this specific month
        payments.forEach(p => {
            if (p.date.startsWith(targetPrefix)) {
                if (p.type === 'cash') cashTotal += p.amount;
                else onlineTotal += p.amount;
            }
        });
    }

    return {
        chartData,
        paymentData: [
            { name: t.cash, value: cashTotal, color: '#bef264' }, 
            { name: t.online, value: onlineTotal, color: '#60a5fa' }, 
            { name: t.pending, value: Math.max(0, totalBilled - totalCollected), color: '#f87171' } 
        ],
        stats: {
            revenue: totalBilled,
            collected: totalCollected,
            milk: totalMilk,
            due: totalBilled - totalCollected
        }
    };
  }, [period, customers, entries, payments, t]);


  // Filter Active Customers
  const activeCustomers = customers.filter(c => c.isActive);

  // Calculate Target Customers for this slot (Separated to detect empty routes)
  const targetCustomers = useMemo(() => {
     return activeCustomers.filter(c => c.preferredTime === currentSlot || c.preferredTime === 'both');
  }, [activeCustomers, currentSlot]);

  // Pending Count Calculation (Slot Aware)
  const pendingCount = useMemo(() => {
      const deliveredCount = targetCustomers.filter(c => {
          return entries.some(e => e.customerId === c.id && e.date === todayStr && (e.slot === currentSlot || (!e.slot && currentSlot === 'morning')));
      }).length;
      return targetCustomers.length - deliveredCount;
  }, [targetCustomers, entries, currentSlot, todayStr]);

  // Newest Customers Logic (Sort by creation or relevance)
  const newestCustomers = useMemo(() => {
      // Sort: Pending first, then name
      const sorted = [...activeCustomers].sort((a, b) => {
          // Check status for current slot
          const aEntry = entries.find(e => e.customerId === a.id && e.date === todayStr && (e.slot === currentSlot || (!e.slot && currentSlot === 'morning')));
          const bEntry = entries.find(e => e.customerId === b.id && e.date === todayStr && (e.slot === currentSlot || (!e.slot && currentSlot === 'morning')));
          
          if (!aEntry && bEntry) return -1;
          if (aEntry && !bEntry) return 1;
          return 0;
      });

      const searched = sorted.filter(c => {
         const nameEn = c.name.toLowerCase();
         const nameHi = c.nameHi ? c.nameHi.toLowerCase() : '';
         const q = searchQuery.toLowerCase();
         return !searchQuery || nameEn.includes(q) || nameHi.includes(q) || c.address.toLowerCase().includes(q);
      });
      
      // Filter for relevant slot
      return searched.filter(c => c.preferredTime === currentSlot || c.preferredTime === 'both').slice(0, 5);
  }, [activeCustomers, searchQuery, entries, currentSlot, todayStr]);


  // Handler for Quick Mark
  const handleQuickMark = (customer: Customer) => {
      // Find entry for today AND current slot
      const existingEntry = entries.find(e => 
          e.customerId === customer.id && 
          e.date === todayStr && 
          (e.slot === currentSlot || (!e.slot && currentSlot === 'morning'))
      );
      
      const newEntry: MilkEntry = {
          id: existingEntry ? existingEntry.id : `${customer.id}-${todayStr}-${currentSlot}`,
          customerId: customer.id,
          date: todayStr,
          quantity: existingEntry && existingEntry.isDelivered ? 0 : customer.defaultQty,
          isDelivered: existingEntry ? !existingEntry.isDelivered : true,
          slot: currentSlot as 'morning' | 'evening',
          timestamp: Date.now()
      };
      onAddEntry(newEntry);
  };

  const confirmAndMarkAll = () => {
      if (window.confirm(`${t.markAllConfirm} (${isEvening ? t.evening : t.morning})`)) {
          onMarkAll();
      }
  };

  const collectionPercentage = Math.min(100, Math.max(0, Math.round((dashboardData.stats.collected / (dashboardData.stats.revenue || 1)) * 100)));

  return (
    <div className="space-y-6 pb-28 animate-fade-in pt-2">
      
      {/* Top Header & Search */}
      <div className="flex items-center gap-4 mb-2">
         {/* Logo acts as button to open profile */}
         <button onClick={onProfileClick} className="w-10 h-10 rounded-full bg-lime-300 flex items-center justify-center shadow-[0_0_12px_rgba(190,242,100,0.6)] shrink-0 border border-white dark:border-gray-800 hover:scale-105 transition-transform">
            <span className="text-red-600 font-hindi font-bold text-2xl pt-1">श्री</span>
         </button>
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-white dark:bg-gray-800 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-lime-300"
            />
         </div>
         <NotificationBell 
            notifications={notifications}
            onClearAll={onClearNotifications}
            onMarkAsRead={onMarkNotificationsRead}
            onDismiss={onDismissNotification}
         />
      </div>

      {/* Time Period Selector */}
      <div className="bg-gray-200 dark:bg-gray-700 p-1 rounded-xl flex gap-1 overflow-hidden">
          {(['thisMonth', 'lastMonth', 'yearly'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${
                    period === p 
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm scale-[1.02]' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300/50 dark:hover:bg-gray-600/50'
                }`}
              >
                  {t[p]}
              </button>
          ))}
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-lime-400 dark:to-lime-600 p-6 rounded-[2rem] shadow-xl text-white dark:text-gray-900 relative overflow-hidden">
             <div className="absolute right-0 top-0 p-6 opacity-10 dark:opacity-20">
                 <IndianRupee size={100} />
             </div>
             <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-2 opacity-80">
                     <TrendingUp size={16} />
                     <span className="text-sm font-medium uppercase tracking-wider">{t.collected}</span>
                 </div>
                 <h2 className="text-4xl font-bold mb-1">₹{dashboardData.stats.collected.toLocaleString()}</h2>
                 <div className="flex items-center gap-3 text-xs mt-2">
                     <span className="bg-white/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                         <ArrowUpRight size={12} /> {collectionPercentage}% Rate
                     </span>
                     <span className="opacity-70">of ₹{dashboardData.stats.revenue.toLocaleString()} billed</span>
                 </div>
             </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-[2rem] shadow-sm flex flex-col justify-between h-32 border border-gray-50 dark:border-gray-700">
             <div className="flex justify-between items-start">
                 <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-500 dark:text-blue-300">
                     <Droplet size={20} />
                 </div>
                 <span className="text-xs text-gray-400 font-bold">{t.totalMilk}</span>
             </div>
             <div>
                 <span className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.stats.milk.toFixed(1)}</span>
                 <span className="text-xs text-gray-400 ml-1">kg</span>
             </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-[2rem] shadow-sm flex flex-col justify-between h-32 border border-gray-50 dark:border-gray-700">
             <div className="flex justify-between items-start">
                 <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-full text-red-500 dark:text-red-300">
                     <Activity size={20} />
                 </div>
                 <span className="text-xs text-gray-400 font-bold">{t.pending}</span>
             </div>
             <div>
                 <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{dashboardData.stats.due.toLocaleString()}</span>
                 <span className="text-xs text-gray-400 ml-1">due</span>
             </div>
          </div>
      </div>

      {/* NEAREST COW STATUS CARD (Enhanced & Compact) */}
      {nearestCow && (
          <div 
            onClick={() => setSelectedCow(nearestCow)}
            className={`p-5 rounded-[1.8rem] shadow-lg relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all group ${
              nearestCow.daysLeft < 7 
              ? 'bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-red-200 dark:shadow-none' 
              : 'bg-gradient-to-r from-lime-400 to-green-500 text-gray-900 shadow-lime-200 dark:shadow-none'
            }`}
          >
              <div className="relative z-10 flex items-center justify-between">
                  {/* Left Side: Info */}
                  <div className="flex flex-col items-start gap-1">
                      <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1.5 w-fit mb-1">
                          <Calendar size={11} className="opacity-90" />
                          <span className="text-[10px] font-bold uppercase tracking-wide">{t.upcomingEvent}</span>
                      </div>
                      <h3 className="text-2xl font-bold font-hindi leading-none">{nearestCow.cowName}</h3>
                      <div className="flex items-center gap-1 opacity-80 text-xs font-medium pl-0.5">
                          <Info size={11} /> {nearestCow.cowColor}
                      </div>
                  </div>

                  {/* Right Side: Count */}
                  <div className="text-right flex flex-col items-end">
                      <ArrowRight size={20} className="opacity-60 mb-1 group-hover:translate-x-1 transition-transform" />
                      <span className="text-4xl font-extrabold block leading-none tracking-tight">
                          {nearestCow.daysLeft < 0 ? '!' : nearestCow.daysLeft}
                      </span>
                      <span className="text-[10px] font-bold uppercase opacity-80">{nearestCow.daysLeft < 0 ? t.overdue : t.daysLeft}</span>
                  </div>
              </div>
          </div>
      )}

      {/* CATTLE DETAILS MODAL */}
      {selectedCow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-[2.5rem] relative shadow-2xl overflow-hidden">
                  
                  {/* Modal Header with Image/Icon */}
                  <div className={`h-32 flex items-center justify-center relative ${
                      selectedCow.daysLeft < 7 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-lime-100 dark:bg-lime-900/30'
                  }`}>
                      <div className="absolute top-4 right-4">
                          <button onClick={() => setSelectedCow(null)} className="p-2 bg-white/50 dark:bg-black/20 rounded-full hover:bg-white dark:hover:bg-black/40 transition-colors">
                              <X size={20} className="text-gray-700 dark:text-white" />
                          </button>
                      </div>
                      <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-4xl shadow-lg border-4 border-white/50 dark:border-gray-700/50">
                          🐮
                      </div>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 pt-2 text-center">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-hindi mb-1">{selectedCow.cowName}</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{selectedCow.cowColor}</p>

                      <div className="grid grid-cols-2 gap-4 text-left">
                          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-2xl">
                              <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">{t.insemDate}</p>
                              <p className="font-bold text-gray-900 dark:text-white text-sm">{selectedCow.inseminationDate}</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-2xl">
                              <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">{t.expectedDate}</p>
                              <p className="font-bold text-gray-900 dark:text-white text-sm">
                                  {selectedCow.dueDate.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                          </div>
                      </div>

                      <div className={`mt-4 p-4 rounded-2xl flex items-center justify-between ${
                          selectedCow.daysLeft < 7 
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' 
                          : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      }`}>
                          <div className="flex items-center gap-3">
                              {selectedCow.daysLeft < 7 ? <Clock size={24} /> : <CheckCircle size={24} />}
                              <div className="text-left">
                                  <p className="text-xs font-bold uppercase opacity-70">{t.daysLeft}</p>
                                  <p className="text-lg font-bold">{selectedCow.daysLeft < 0 ? t.overdue : `${selectedCow.daysLeft} Days`}</p>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Route Status Banner */}
      {targetCustomers.length === 0 ? (
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-[1.5rem] flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-gray-700">
             <Users size={20} />
             <span className="font-medium text-sm">{t.noCustomersRoute} ({isEvening ? t.evening : t.morning})</span>
          </div>
      ) : pendingCount > 0 ? (
         <div 
            onClick={confirmAndMarkAll}
            className="bg-lime-300 p-4 rounded-[1.5rem] flex items-center justify-between shadow-lg shadow-lime-200/50 dark:shadow-none cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden group"
         >
            <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-white/20 to-transparent"></div>
            <div className="flex items-center gap-3 z-10">
                <div className="p-2 bg-gray-900 rounded-full text-white">
                    <CheckSquare size={18} />
                </div>
                <div>
                    <h4 className="font-bold text-gray-900 leading-tight">
                        {t.markAll} ({isEvening ? t.evening : t.morning})
                    </h4>
                    <p className="text-xs text-gray-800 opacity-80">{pendingCount} customers pending</p>
                </div>
            </div>
            <div className="bg-white/30 p-2 rounded-full z-10">
                <ChevronRight size={20} className="text-gray-900" />
            </div>
         </div>
      ) : (
        <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-[1.5rem] flex items-center justify-center gap-2 text-green-700 dark:text-green-300">
            <CheckCircle size={20} />
            <span className="font-bold text-sm">{t.noPending} ({isEvening ? t.evening : t.morning})</span>
        </div>
      )}

      {/* Today's Route List */}
      <div className="space-y-4">
         <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white font-hindi flex items-center gap-2">
                {t.todaysRoute}
                <span className={`text-xs px-2 py-0.5 rounded-full ${isEvening ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                    {isEvening ? <Moon size={12} className="inline mr-1"/> : <Sun size={12} className="inline mr-1"/>}
                    {isEvening ? t.evening : t.morning}
                </span>
            </h3>
            <button 
                onClick={onViewAll}
                className="text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-full flex items-center gap-1 active:scale-95 transition-transform"
            >
                {t.viewAll} <ChevronRight size={12}/>
            </button>
         </div>
         
         {newestCustomers.length === 0 ? (
             <div className="py-8 text-center bg-white dark:bg-gray-800 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-700 shadow-sm">
                 <p className="text-gray-400 dark:text-gray-500">
                    {targetCustomers.length === 0 
                      ? `${t.noCustomersRoute} (${isEvening ? t.evening : t.morning})` 
                      : `No pending customers for ${isEvening ? t.evening : t.morning}.`}
                 </p>
             </div>
         ) : (
            newestCustomers.map(customer => {
                const entry = entries.find(e => 
                    e.customerId === customer.id && 
                    e.date === todayStr && 
                    (e.slot === currentSlot || (!e.slot && currentSlot === 'morning'))
                );
                const isDelivered = entry?.isDelivered;
                
                return (
                    <div 
                        key={customer.id} 
                        onClick={() => onSelectCustomer(customer)}
                        className="bg-white dark:bg-gray-800 p-4 rounded-[1.5rem] flex items-center justify-between shadow-sm border border-gray-50 dark:border-gray-700 transition-transform active:scale-[0.99] cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300">
                                {getName(customer).charAt(0)}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white font-hindi">{getName(customer)}</h4>
                                <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                    <MapPin size={10} /> {customer.address}
                                </div>
                            </div>
                        </div>

                        {/* Quick Toggle Button - Stop propagation to prevent navigation when clicking action */}
                        <button 
                           onClick={(e) => { e.stopPropagation(); handleQuickMark(customer); }}
                           className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                               isDelivered 
                               ? 'bg-lime-400 text-gray-900 shadow-md shadow-lime-200/50 dark:shadow-none' 
                               : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                           }`}
                        >
                           {isDelivered ? (
                               <>
                                 <Check size={16} />
                                 {entry?.quantity} kg
                               </>
                           ) : (
                               <>
                                 <Circle size={16} />
                                 Mark
                               </>
                           )}
                        </button>
                    </div>
                );
            })
         )}
      </div>

    </div>
  );
};

export default Dashboard;
