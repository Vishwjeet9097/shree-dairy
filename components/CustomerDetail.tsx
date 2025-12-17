
import React, { useState, useMemo } from 'react';
import { Customer, MilkEntry, Language, Payment, InvoiceData, BusinessProfile } from '../types';
import { TEXTS } from '../constants';
import { Calendar as CalendarIcon, List, CheckCircle, XCircle, ChevronLeft, ChevronRight, IndianRupee, Trash2, Edit2, History, Banknote, CreditCard, MoreHorizontal, X, Save, Plane, Share2, Power, AlertTriangle, Sun, Moon, CalendarRange, Phone, MapPin, Star } from 'lucide-react';
import InvoicePreviewModal from './InvoicePreviewModal';

interface Props {
  customer: Customer;
  businessProfile: BusinessProfile;
  entries: MilkEntry[];
  payments: Payment[];
  language: Language;
  onAddEntry: (entry: MilkEntry) => void;
  onOpenPaymentModal: () => void;
  onEditCustomer: () => void;
  onDeleteCustomer: () => void;
  onToggleStatus: (customerId: string) => void; 
  onBack: () => void;
  onVacation: () => void;
}

const CustomerDetail: React.FC<Props> = ({ 
  customer, 
  businessProfile,
  entries, 
  payments, 
  language, 
  onAddEntry, 
  onOpenPaymentModal, 
  onEditCustomer, 
  onDeleteCustomer,
  onToggleStatus,
  onBack,
  onVacation
}) => {
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline' | 'payments'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // State for Day Edit Modal
  const [editingDay, setEditingDay] = useState<{date: string, entry: MilkEntry | null, slot: 'morning' | 'evening'} | null>(null);
  const [editQty, setEditQty] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');
  const [editIsDelivered, setEditIsDelivered] = useState<boolean>(true);
  
  // State for Status Toggle Warning Modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  
  // State for Invoice Preview
  const [invoicePreviewData, setInvoicePreviewData] = useState<InvoiceData | null>(null);

  const t = TEXTS[language];

  // Helper to get name based on language preference
  const getName = (c: Customer) => {
      return (language === 'hi' && c.nameHi) ? c.nameHi : c.name;
  };

  const currentMonthStr = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, [currentMonth]);
  
  const monthStats = useMemo(() => {
    const monthEntries = entries.filter(e => e.customerId === customer.id && e.date.startsWith(currentMonthStr));
    const totalMilk = monthEntries.reduce((acc, curr) => acc + (curr.isDelivered ? curr.quantity : 0), 0);
    const totalBill = totalMilk * customer.ratePerKg;
    const monthPayments = payments.filter(p => p.customerId === customer.id && p.date.startsWith(currentMonthStr));
    const paidAmount = monthPayments.reduce((acc, curr) => acc + curr.amount, 0);

    return { totalMilk, totalBill, paidAmount, due: totalBill - paidAmount };
  }, [entries, payments, currentMonthStr, customer.ratePerKg, customer.id]);

  const overallDue = useMemo(() => {
    const totalMilkAllTime = entries.filter(e => e.customerId === customer.id).reduce((acc, curr) => acc + (curr.isDelivered ? curr.quantity : 0), 0);
    const totalBillAllTime = totalMilkAllTime * customer.ratePerKg;
    const totalPaidAllTime = payments.filter(p => p.customerId === customer.id).reduce((acc, curr) => acc + curr.amount, 0);
    return totalBillAllTime - totalPaidAllTime;
  }, [entries, payments, customer.ratePerKg, customer.id]);

  const loadEntryData = (date: string, slot: 'morning' | 'evening') => {
      const entry = entries.find(e => e.customerId === customer.id && e.date === date && (e.slot === slot || (!e.slot && slot === 'morning')));
      
      setEditQty(entry ? entry.quantity.toString() : customer.defaultQty.toString());
      setEditNote(entry?.note || '');
      setEditIsDelivered(entry ? entry.isDelivered : true);
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${currentMonthStr}-${String(day).padStart(2, '0')}`;
    const initialSlot = customer.preferredTime === 'evening' ? 'evening' : 'morning';
    setEditingDay({ date: dateStr, entry: null, slot: initialSlot }); 
    loadEntryData(dateStr, initialSlot);
  };

  const handleSlotSwitch = (newSlot: 'morning' | 'evening') => {
      if (!editingDay) return;
      setEditingDay({ ...editingDay, slot: newSlot });
      loadEntryData(editingDay.date, newSlot);
  };

  const handleSaveDayEntry = () => {
    if (!editingDay) return;
    
    const existingEntry = entries.find(e => e.customerId === customer.id && e.date === editingDay.date && (e.slot === editingDay.slot || (!e.slot && editingDay.slot === 'morning')));

    const newEntry: MilkEntry = {
        id: existingEntry ? existingEntry.id : `${customer.id}-${editingDay.date}-${editingDay.slot}`,
        customerId: customer.id,
        date: editingDay.date,
        isDelivered: editIsDelivered,
        quantity: editIsDelivered ? parseFloat(editQty) : 0,
        note: editNote,
        slot: editingDay.slot,
        timestamp: Date.now()
    };
    onAddEntry(newEntry);
    setEditingDay(null);
  }

  const handleConfirmToggle = () => {
    onToggleStatus(customer.id);
    setShowStatusModal(false);
  };

  const prepareInvoiceData = () => {
    const now = new Date();
    const invoiceDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0); 
    const invoiceDateStr = invoiceDate.toISOString().split('T')[0];
    const startDateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-01`;

    const pastEntries = entries.filter(e => e.customerId === customer.id && e.date < startDateStr);
    const pastBill = pastEntries.reduce((acc, e) => acc + (e.isDelivered ? e.quantity * customer.ratePerKg : 0), 0);
    const pastPayments = payments.filter(p => p.customerId === customer.id && p.date < startDateStr);
    const pastPaid = pastPayments.reduce((acc, p) => acc + p.amount, 0);
    const previousDue = pastBill - pastPaid;

    const monthEntries = entries.filter(e => e.customerId === customer.id && e.date.startsWith(currentMonthStr));
    const currentMilkQty = monthEntries.reduce((acc, e) => acc + (e.isDelivered ? e.quantity : 0), 0);
    const currentBill = currentMilkQty * customer.ratePerKg;

    const currentPayments = payments.filter(p => p.customerId === customer.id && p.date.startsWith(currentMonthStr));
    const paidThisMonth = currentPayments.reduce((acc, p) => acc + p.amount, 0);

    const grandTotal = previousDue + currentBill - paidThisMonth;

    const data: InvoiceData = {
        customer: customer,
        businessDetails: businessProfile, 
        invoiceNumber: `INV-${currentMonthStr.replace('-', '')}-${customer.id.slice(-4)}`,
        date: invoiceDateStr,
        dueDate: invoiceDateStr, 
        items: [
            {
                description: `Milk Supply (${currentMonth.toLocaleDateString(language==='hi'?'hi-IN':'en-US', {month:'long'})})`,
                rate: `₹${customer.ratePerKg}/kg`,
                qty: `${currentMilkQty.toFixed(1)} kg`,
                total: currentBill
            }
        ],
        totals: {
            subtotal: currentBill,
            previousDue: previousDue,
            paid: paidThisMonth,
            grandTotal: grandTotal
        }
    };
    
    setInvoicePreviewData(data);
  };

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentMonth);
    newDate.setDate(1); 
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentMonth(newDate);
  };

  return (
    <div className="pb-36 animate-fade-in pt-0 relative">
       {/* Enhanced Header Banner */}
       <div className="bg-lime-400 dark:bg-lime-600 h-44 rounded-b-[2.5rem] relative mb-20 shadow-lg">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
           
           <div className="flex items-center justify-between p-6 text-gray-900 dark:text-white">
                <button onClick={onBack} className="p-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <div className="flex gap-2">
                    <button onClick={onVacation} className="p-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-colors">
                        <CalendarRange size={20} />
                    </button>
                    <button onClick={onEditCustomer} className="p-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-colors">
                        <Edit2 size={20} />
                    </button>
                </div>
           </div>

           {/* Overlapping Profile Card */}
           <div className="absolute -bottom-16 left-6 right-6">
                <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-5 shadow-xl border border-gray-100 dark:border-gray-700 relative">
                    <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                            <div className="w-20 h-20 -mt-10 rounded-2xl bg-gray-100 dark:bg-gray-700 border-4 border-white dark:border-gray-800 flex items-center justify-center text-3xl font-bold text-gray-400 shadow-md">
                                {getName(customer).charAt(0)}
                            </div>
                            <div className="pt-1">
                                <h2 className={`text-xl font-bold font-hindi ${customer.isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 line-through'}`}>{getName(customer)}</h2>
                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                                    <MapPin size={10} /> {customer.address.substring(0, 20)}...
                                </div>
                            </div>
                        </div>
                        
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${customer.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {customer.isActive ? <CheckCircle size={16} /> : <Power size={16} />}
                        </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                        <a href={`tel:${customer.phone}`} className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-xl py-2 flex items-center justify-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-lime-100 dark:hover:bg-lime-900/30 transition-colors">
                            <Phone size={14} /> Call
                        </a>
                        <button 
                            onClick={prepareInvoiceData}
                            className="flex-1 bg-lime-400 rounded-xl py-2 flex items-center justify-center gap-2 text-xs font-bold text-gray-900 shadow-lg shadow-lime-200 dark:shadow-none hover:bg-lime-500 transition-colors"
                        >
                            <Share2 size={14} /> Bill
                        </button>
                    </div>
                </div>
           </div>
       </div>

      {/* Financial Stats Grid (Overall) */}
      <div className="grid grid-cols-2 gap-4 mb-6 px-6">
          <div className="bg-gray-900 dark:bg-gray-800 p-5 rounded-[2rem] text-white shadow-lg transition-colors relative overflow-hidden group">
             <div className="absolute right-0 top-0 opacity-10 transform translate-x-2 -translate-y-2">
                 <IndianRupee size={60} />
             </div>
             <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-bold">{t.totalDue}</p>
             <p className={`text-3xl font-bold ${overallDue > 0 ? 'text-red-400' : 'text-lime-400'}`}>
                ₹{Math.abs(overallDue)}
             </p>
             <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold">{overallDue < 0 ? 'Advance' : 'Pending'}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-[2rem] shadow-sm transition-colors border border-gray-100 dark:border-gray-700">
             <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-bold">{t.rate}</p>
             <p className="text-3xl font-bold text-gray-900 dark:text-white">₹{customer.ratePerKg}</p>
             <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">per Kg</p>
          </div>
      </div>

      {/* Monthly Summary Card */}
      <div className="px-4 mb-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 rounded-[2rem] shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg font-hindi capitalize">
                    {currentMonth.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-1 rounded-lg font-bold uppercase tracking-wide">Summary</span>
            </div>
            <div className="grid grid-cols-3 gap-2 divide-x divide-gray-100 dark:divide-gray-700">
                <div className="text-center px-2">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">{t.totalBill}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">₹{monthStats.totalBill}</p>
                </div>
                <div className="text-center px-2">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">{t.paid}</p>
                    <p className="text-lg font-bold text-green-500">₹{monthStats.paidAmount}</p>
                </div>
                <div className="text-center px-2">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">{t.monthlyDue}</p>
                    <p className={`text-lg font-bold ${monthStats.due > 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>₹{monthStats.due}</p>
                </div>
            </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <div className="flex p-1 bg-gray-200 dark:bg-gray-700 rounded-full mb-6 transition-colors">
            <button 
            onClick={() => setViewMode('calendar')}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
            >
            <CalendarIcon size={16} className="inline mr-1"/> {t.calendar}
            </button>
            <button 
            onClick={() => setViewMode('timeline')}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${viewMode === 'timeline' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
            >
            <List size={16} className="inline mr-1"/> {t.timeline}
            </button>
            <button 
            onClick={() => setViewMode('payments')}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${viewMode === 'payments' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
            >
            <History size={16} className="inline mr-1"/> {t.paid}
            </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-4">
        {viewMode === 'calendar' && (
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-5 shadow-sm transition-colors border border-gray-50 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"><ChevronLeft className="text-gray-600 dark:text-gray-300" size={20}/></button>
                <span className="text-gray-900 dark:text-white font-bold text-lg">{currentMonth.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { month: 'long', year: 'numeric' })}</span>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"><ChevronRight className="text-gray-600 dark:text-gray-300" size={20}/></button>
            </div>
            
            <div className="grid grid-cols-7 gap-2 text-center mb-4">
                {['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-xs text-gray-400 font-bold uppercase tracking-wide">{d}</span>)}
            </div>
            
            <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${currentMonthStr}-${String(day).padStart(2, '0')}`;
                const dayEntries = entries.filter(e => e.date === dateStr && e.customerId === customer.id);
                
                const isFuture = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) > new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
                const isToday = new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();

                // Determine status for slots
                const morningEntry = dayEntries.find(e => e.slot === 'morning' || !e.slot);
                const eveningEntry = dayEntries.find(e => e.slot === 'evening');

                // Status Helper
                const getSlotStatus = (entry: MilkEntry | undefined) => {
                    if (!entry) return 'pending';
                    if (entry.isDelivered) return 'delivered';
                    return 'absent';
                };

                const mStatus = getSlotStatus(morningEntry);
                const eStatus = getSlotStatus(eveningEntry);

                // ENHANCED DAY CELL STYLING
                let bgClass = 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600';
                if (isToday) bgClass = 'bg-gray-900 dark:bg-lime-900/40 text-white dark:text-white ring-2 ring-lime-400 dark:ring-lime-500 shadow-lg shadow-lime-500/20';
                if (isFuture) bgClass = 'bg-transparent text-gray-300 dark:text-gray-700 cursor-not-allowed';

                const renderDot = (type: 'sun' | 'moon', status: string) => {
                    if (status === 'pending' && isFuture) return <div className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700"></div>;
                    if (status === 'pending') return <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-500"></div>;
                    
                    let colorClass = '';
                    // Brighter indicators
                    if (status === 'delivered') colorClass = type === 'sun' ? 'text-orange-500' : 'text-indigo-400';
                    if (status === 'absent') colorClass = 'text-red-500';

                    const Icon = type === 'sun' ? Sun : Moon;
                    return <Icon size={10} className={colorClass} fill={status === 'delivered' ? 'currentColor' : 'none'} strokeWidth={2.5} />;
                };

                return (
                    <button 
                    key={day} 
                    onClick={() => !isFuture && handleDayClick(day)}
                    disabled={isFuture}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-200 ${bgClass} ${!isFuture ? 'active:scale-95' : ''}`}
                    >
                    <span className="text-sm font-bold mb-1">{day}</span>
                    
                    {/* Indicators Container */}
                    <div className="flex gap-1 items-center justify-center w-full h-3">
                        {(customer.preferredTime === 'morning' || customer.preferredTime === 'both') && renderDot('sun', mStatus)}
                        {(customer.preferredTime === 'evening' || customer.preferredTime === 'both') && renderDot('moon', eStatus)}
                    </div>
                    </button>
                );
                })}
            </div>
            
            {/* Legend */}
            <div className="flex justify-center gap-4 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase font-bold">
                    <Sun size={12} className="text-orange-500" fill="currentColor"/> Delivered
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase font-bold">
                    <Sun size={12} className="text-red-500" /> Absent
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase font-bold">
                    <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div> Pending
                </div>
            </div>
            </div>
        )}

        {viewMode === 'timeline' && (
            <div className="space-y-3">
            {entries.length === 0 ? <p className="text-gray-400 text-center py-8">No records yet</p> : 
            entries
                .filter(e => e.customerId === customer.id && e.date.startsWith(currentMonthStr))
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(entry => (
                <div key={entry.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm flex flex-col justify-between border border-gray-100 dark:border-gray-700 transition-colors">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${entry.isDelivered ? 'bg-lime-100 dark:bg-lime-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                            {entry.isDelivered ? <CheckCircle className="text-lime-600 dark:text-lime-400" size={20} /> : <XCircle className="text-red-500 dark:text-red-400" size={20} />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-gray-900 dark:text-white font-bold">{entry.date}</p>
                                {/* Slot Badge */}
                                {entry.slot && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${entry.slot === 'morning' ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                        {t[entry.slot]}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{entry.isDelivered ? `${entry.quantity} kg ${t.delivered}` : t.notDelivered}</p>
                        </div>
                    </div>
                    <span className="text-gray-900 dark:text-white font-bold">₹{entry.isDelivered ? entry.quantity * customer.ratePerKg : 0}</span>
                </div>
                {entry.note && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg ml-12 text-xs text-gray-600 dark:text-gray-300 italic">
                        Note: {entry.note}
                    </div>
                )}
                </div>
            ))}
            </div>
        )}

        {viewMode === 'payments' && (
            <div className="space-y-3">
            {payments.filter(p => p.customerId === customer.id).length === 0 ? <p className="text-gray-400 text-center py-8">No payments yet</p> :
            payments
                .filter(p => p.customerId === customer.id)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(payment => (
                <div key={payment.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm flex items-center justify-between border-l-4 border-lime-500 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                            {payment.type === 'cash' ? <Banknote size={20} className="text-gray-600 dark:text-gray-300"/> : <CreditCard size={20} className="text-blue-500"/>}
                        </div>
                        <div>
                            <p className="text-gray-900 dark:text-white font-bold">{payment.date}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{payment.type}</p>
                        </div>
                    </div>
                    <span className="text-green-600 dark:text-green-400 font-bold font-mono">+₹{payment.amount}</span>
                </div>
            ))}
            </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={onOpenPaymentModal} 
        className="fixed bottom-36 right-6 w-14 h-14 bg-gray-900 dark:bg-lime-400 rounded-full flex items-center justify-center shadow-lg text-white dark:text-gray-900 z-50 hover:scale-105 transition-transform"
      >
        <IndianRupee size={24} />
      </button>

      {/* Day Entry Modal */}
      {editingDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative transition-colors">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t.updateEntry}</h3>
                 <button onClick={() => setEditingDay(null)}><X className="text-gray-400 dark:text-gray-300"/></button>
              </div>
              
              <div className="flex justify-between items-center mb-4">
                  <p className="text-gray-500 dark:text-gray-400 font-medium">{editingDay.date}</p>
                  <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                      <button 
                         onClick={() => handleSlotSwitch('morning')}
                         className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${editingDay.slot === 'morning' ? 'bg-white dark:bg-gray-600 shadow-sm text-orange-600' : 'text-gray-400'}`}
                      >
                         <Sun size={12}/> {t.morning}
                      </button>
                      <button 
                         onClick={() => handleSlotSwitch('evening')}
                         className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${editingDay.slot === 'evening' ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600' : 'text-gray-400'}`}
                      >
                         <Moon size={12}/> {t.evening}
                      </button>
                  </div>
              </div>
              
              <div className="flex gap-2 mb-6 bg-gray-50 dark:bg-gray-700 p-1 rounded-xl">
                  <button 
                    onClick={() => setEditIsDelivered(true)}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${editIsDelivered ? 'bg-white dark:bg-gray-600 shadow-sm text-lime-600 dark:text-lime-400' : 'text-gray-400'}`}
                  >
                      {t.delivered}
                  </button>
                  <button 
                    onClick={() => setEditIsDelivered(false)}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${!editIsDelivered ? 'bg-white dark:bg-gray-600 shadow-sm text-red-500 dark:text-red-400' : 'text-gray-400'}`}
                  >
                      {t.notDelivered}
                  </button>
              </div>

              {editIsDelivered ? (
                  <div className="mb-4">
                      <label className="text-xs text-gray-400 mb-1 block uppercase font-bold">{t.qty}</label>
                      <input 
                         type="number" 
                         value={editQty} 
                         onChange={e => setEditQty(e.target.value)}
                         className="w-full text-center text-3xl font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-lime-200 focus:border-lime-500 outline-none py-2"
                      />
                  </div>
              ) : (
                 <div className="mb-4">
                      <label className="text-xs text-gray-400 mb-1 block uppercase font-bold">{t.reason}</label>
                      <input 
                         type="text" 
                         value={editNote} 
                         onChange={e => setEditNote(e.target.value)}
                         placeholder={t.optional}
                         className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-gray-900 dark:text-white outline-none border border-gray-100 dark:border-gray-600"
                      />
                 </div>
              )}

              <button onClick={handleSaveDayEntry} className="w-full py-4 rounded-xl bg-lime-400 text-gray-900 font-bold mt-2 shadow-lg shadow-lime-200 dark:shadow-none">
                  {t.save}
              </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Active/Inactive Toggle */}
      {showStatusModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative transition-colors text-center">
                 <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${customer.isActive ? 'bg-red-100 text-red-500' : 'bg-lime-100 text-lime-600'}`}>
                    {customer.isActive ? <Power size={32} /> : <CheckCircle size={32} />}
                 </div>
                 
                 <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-hindi">
                     {customer.isActive ? t.stopMilkTitle : t.startMilkTitle}
                 </h3>
                 
                 <p className="text-gray-500 dark:text-gray-300 mb-6 font-hindi">
                     {customer.isActive ? t.stopMilkMsg : t.startMilkMsg}
                 </p>

                 <div className="flex gap-3">
                     <button 
                         onClick={() => setShowStatusModal(false)}
                         className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold"
                     >
                         {t.cancel}
                     </button>
                     <button 
                         onClick={handleConfirmToggle}
                         className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg ${customer.isActive ? 'bg-red-500 hover:bg-red-600 shadow-red-200 dark:shadow-none' : 'bg-lime-500 hover:bg-lime-600 shadow-lime-200 dark:shadow-none'}`}
                     >
                         {t.confirm}
                     </button>
                 </div>
             </div>
         </div>
      )}

      {/* Invoice Preview Modal */}
      <InvoicePreviewModal 
          isOpen={!!invoicePreviewData}
          onClose={() => setInvoicePreviewData(null)}
          data={invoicePreviewData}
      />

    </div>
  );
};

export default CustomerDetail;
