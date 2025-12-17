
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, PhoneOff, Activity, Loader2, Minimize2, Maximize2, X } from 'lucide-react';
import { GeminiLive } from '../services/gemini';
import { Language, Customer, MilkEntry, Payment, InseminationRecord } from '../types';
import { TEXTS } from '../constants';
import { App as CapacitorApp } from '@capacitor/app';

interface VoiceAssistantProps {
  language: Language;
  customers: Customer[];
  entries: MilkEntry[]; 
  payments: Payment[]; 
  inseminations: InseminationRecord[];
  onAction: (action: any) => Promise<string | void>; 
  isOpen: boolean;
  onClose: () => void;
  apiKey?: string;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ language, customers, entries, payments, inseminations, onAction, isOpen, onClose, apiKey }) => {
  const [status, setStatus] = useState('Initializing...');
  const [volume, setVolume] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Dragging State
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const liveClient = useRef<GeminiLive | null>(null);
  
  // Background/Foreground Handling for Microphone Safety
  useEffect(() => {
    const handleAppStateChange = async (state: { isActive: boolean }) => {
        if (!state.isActive && isOpen) {
            // App went to background -> Force Close or Mute
            // For privacy, we force close the session
            console.log("App backgrounded, stopping voice session for privacy.");
            stopLiveSession();
            onClose();
        }
    };

    const listener = CapacitorApp.addListener('appStateChange', handleAppStateChange);

    return () => {
        listener.then(l => l.remove());
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
        startLiveSession();
    } else {
        stopLiveSession();
        setIsMinimized(false);
    }

    return () => {
        stopLiveSession();
    };
  }, [isOpen]);

  useEffect(() => {
      if (isMinimized) {
          setPosition({ 
              x: window.innerWidth - 80, 
              y: window.innerHeight - 150 
          });
      }
  }, [isMinimized]);

  const findCustomer = (name: string) => {
      const normalized = name.toLowerCase();
      return customers.find(c => c.name.toLowerCase().includes(normalized));
  };

  const startLiveSession = async () => {
      setStatus('Starting...');
      const client = new GeminiLive();
      liveClient.current = client;

      client.onStatusChange = (s) => setStatus(s);
      client.onVisualizerData = (v) => setVolume(prev => prev * 0.7 + v * 0.3); 

      client.onToolCall = async (name, args) => {
          console.log("Tool Called:", name, args);
          const data: any = { ...args };

          // --- READ OPERATIONS (Handled Locally) ---

          if (name === 'check_delivery') {
              const customer = findCustomer(data.customerName);
              if (!customer) return { error: "Customer not found" };
              const date = data.date;
              const dayEntries = entries.filter(e => e.customerId === customer.id && e.date === date);
              
              if (dayEntries.length === 0) return { result: `No delivery record found for ${customer.name} on ${date}.` };
              
              return {
                  customer: customer.name,
                  date: date,
                  details: dayEntries.map(e => ({
                      slot: e.slot || 'Morning',
                      quantity: e.quantity,
                      status: e.isDelivered ? 'Delivered' : 'Absent',
                      note: e.note
                  }))
              };
          }

          if (name === 'get_payment_history') {
              const customer = findCustomer(data.customerName);
              if (!customer) return { error: "Customer not found" };
              const history = payments
                  .filter(p => p.customerId === customer.id)
                  .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, data.limit || 5)
                  .map(p => ({ date: p.date, amount: p.amount, mode: p.type }));
              
              if (history.length === 0) return { message: "No payment history found." };
              return { history };
          }

          if (name === 'get_customer_status') {
              const customerName = data.customerName;
              const customer = findCustomer(customerName);
              if (!customer) return { error: "Customer not found" };

              const cEntries = entries.filter(e => e.customerId === customer.id);
              const cPayments = payments.filter(p => p.customerId === customer.id);
              
              const today = new Date();
              const startOfCurrentMonthStr = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
              
              const pastEntries = cEntries.filter(e => e.date < startOfCurrentMonthStr);
              const currentEntries = cEntries.filter(e => e.date >= startOfCurrentMonthStr);

              const pastBill = pastEntries.reduce((acc, e) => acc + (e.isDelivered ? e.quantity * customer.ratePerKg : 0), 0);
              const currentBill = currentEntries.reduce((acc, e) => acc + (e.isDelivered ? e.quantity * customer.ratePerKg : 0), 0);
              const totalPaid = cPayments.reduce((acc, p) => acc + p.amount, 0);

              let pastDue = pastBill - totalPaid;
              let effectiveCurrentBill = currentBill;
              
              if (pastDue < 0) {
                  const surplus = Math.abs(pastDue);
                  pastDue = 0;
                  effectiveCurrentBill = Math.max(0, currentBill - surplus);
              }

              const lastPayment = cPayments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

              return {
                  name: customer.name,
                  status: customer.isActive ? 'Active' : 'Inactive',
                  rate: customer.ratePerKg,
                  pastDues: Math.round(pastDue), 
                  currentMonthBill: Math.round(effectiveCurrentBill),
                  lastPayment: lastPayment ? `${lastPayment.amount} on ${lastPayment.date}` : 'None'
              };
          }

          if (name === 'get_pending_list') {
              const today = new Date();
              const startOfCurrentMonthStr = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];

              const pendingList = customers.map(c => {
                  const cEntries = entries.filter(e => e.customerId === c.id);
                  const cPayments = payments.filter(p => p.customerId === c.id);
                  
                  const pastEntries = cEntries.filter(e => e.date < startOfCurrentMonthStr);
                  const pastBill = pastEntries.reduce((acc, e) => acc + (e.isDelivered ? e.quantity * c.ratePerKg : 0), 0);
                  const totalPaid = cPayments.reduce((acc, p) => acc + p.amount, 0);
                  
                  const pastDue = pastBill - totalPaid;
                  return { name: c.name, pastDue: Math.round(pastDue) };
              }).filter(item => item.pastDue > 10); 

              pendingList.sort((a, b) => b.pastDue - a.pastDue);

              if (pendingList.length === 0) return { message: "No past dues found." };
              return { count: pendingList.length, defaulters: pendingList.slice(0, 5) };
          }

          if (name === 'get_monthly_report') {
              const yearMonth = data.yearMonth;
              if (!yearMonth) return { error: "Month not specified" };
              const monthEntries = entries.filter(e => e.date.startsWith(yearMonth));
              const totalMilk = monthEntries.reduce((acc, e) => acc + (e.isDelivered ? e.quantity : 0), 0);
              let totalBillGenerated = 0;
              monthEntries.forEach(e => {
                  const cust = customers.find(c => c.id === e.customerId);
                  if (cust && e.isDelivered) {
                      totalBillGenerated += (e.quantity * cust.ratePerKg);
                  }
              });
              return { month: yearMonth, totalMilkDistributed: totalMilk.toFixed(1) + ' kg', totalRevenueGenerated: Math.round(totalBillGenerated) };
          }

          if (name === 'get_daily_report') {
              const date = data.date || new Date().toISOString().split('T')[0];
              const dayEntries = entries.filter(e => e.date === date);
              const deliveredCount = dayEntries.filter(e => e.isDelivered).length;
              const totalQty = dayEntries.reduce((acc, e) => acc + (e.isDelivered ? e.quantity : 0), 0);
              const absentCount = customers.filter(c => c.isActive).length - deliveredCount;
              return { date: date, deliveredCustomers: deliveredCount, totalMilkDistributed: totalQty, absentCustomers: absentCount };
          }

          if (name === 'get_cattle_records') {
              if (inseminations.length === 0) return { message: "No cattle records found." };
              return inseminations.map(cow => {
                  const d = new Date(cow.inseminationDate);
                  d.setDate(d.getDate() + 283);
                  const expected = d.toISOString().split('T')[0];
                  return { name: cow.cowName, color: cow.cowColor, inseminationDate: cow.inseminationDate, expectedDelivery: expected };
              });
          }

          // --- WRITE OPERATIONS (Delegated to App.tsx) ---

          let actionType = 'UNKNOWN';

          if (name === 'add_milk_entry') actionType = 'ADD_ENTRY';
          else if (name === 'add_payment') actionType = 'ADD_PAYMENT';
          else if (name === 'delete_payment') actionType = 'DELETE_PAYMENT';
          else if (name === 'mark_vacation') actionType = 'ADD_RANGE_ENTRY';
          else if (name === 'mark_delivery_range') actionType = 'ADD_RANGE_ENTRY';
          else if (name === 'add_new_customer') actionType = 'ADD_CUSTOMER';
          else if (name === 'update_customer_profile') actionType = 'UPDATE_CUSTOMER';
          else if (name === 'add_cattle_record') actionType = 'ADD_CATTLE';
          else if (name === 'delete_cattle_record') actionType = 'DELETE_CATTLE';
          else if (name === 'delete_customer') actionType = 'DELETE_CUSTOMER';

          if (actionType !== 'UNKNOWN') {
             const result = { action: actionType, data: data };
             const responseMsg = await onAction(result);
             return { success: true, message: responseMsg || "Done" };
          }
          return { error: "Unknown tool" };
      };

      const customerNames = customers.map(c => c.name);
      await client.connect(customerNames, apiKey);
  };

  const stopLiveSession = () => {
      liveClient.current?.disconnect();
      liveClient.current = null;
      setVolume(0);
  };

  const toggleMute = () => {
     setIsMuted(!isMuted);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
      setIsDragging(true);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      dragOffset.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;
      const maxX = window.innerWidth - 50;
      const maxY = window.innerHeight - 50;
      setPosition({ 
          x: Math.min(Math.max(0, newX), maxX), 
          y: Math.min(Math.max(0, newY), maxY) 
      });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
      setIsDragging(false);
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };


  if (!isOpen) return null;

  const renderBars = (mini = false) => {
      return Array.from({ length: mini ? 3 : 5 }).map((_, i) => {
          const height = mini 
             ? Math.max(4, Math.min(20, volume * 200 * (1 + i * 0.1)))
             : Math.max(8, Math.min(80, volume * 800 * (1 + i * 0.1)));
          return (
              <div 
                key={i}
                className={`${mini ? 'w-1.5 bg-lime-400' : 'w-3 bg-lime-400'} rounded-full transition-all duration-100 ease-out shadow-[0_0_10px_rgba(163,230,53,0.5)]`}
                style={{ height: `${height}px` }}
              />
          );
      });
  };

  if (isMinimized) {
      const isRightSide = typeof window !== 'undefined' ? position.x > window.innerWidth / 2 : false;
      return (
          <div 
             onPointerDown={handlePointerDown}
             onPointerMove={handlePointerMove}
             onPointerUp={handlePointerUp}
             style={{ 
                 left: `${position.x}px`, 
                 top: `${position.y}px`,
                 touchAction: 'none'
             }}
             className="fixed z-50 cursor-move select-none w-14 h-14" 
          >
             <div className={`
                 bg-gray-900/90 border border-gray-700/50 backdrop-blur-xl text-white rounded-full 
                 shadow-[0_8px_30px_rgba(0,0,0,0.3)] flex items-center overflow-hidden 
                 transition-all duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] 
                 ring-1 ring-white/10 h-14 absolute top-0 group
                 ${isDragging ? 'w-14' : 'w-14 hover:w-64'} 
                 ${isRightSide ? 'right-0 flex-row-reverse' : 'left-0 flex-row'}
             `}>
                 <div className="w-14 h-14 flex items-center justify-center shrink-0 relative z-20">
                     <div className="w-10 h-10 rounded-full bg-lime-300 flex items-center justify-center border-2 border-white/10 relative overflow-hidden shadow-lg shadow-lime-400/20">
                         <span className="text-red-600 font-hindi font-bold text-xl pt-0.5">श्री</span>
                         {status === 'Connected' && <div className="absolute inset-0 rounded-full border border-white/20 animate-pulse"></div>}
                     </div>
                 </div>
                 <div className={`flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-75 whitespace-nowrap min-w-max ${isRightSide ? 'pl-4' : 'pr-4'}`}>
                     <div className="flex gap-1 h-6 items-center justify-center pointer-events-none px-1">
                         {status === 'Connected' ? renderBars(true) : <Loader2 size={16} className="animate-spin text-lime-400"/>}
                     </div>
                     <div className="h-4 w-px bg-gray-700/80 mx-1"></div>
                     <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
                         <button 
                            onClick={() => setIsMinimized(false)}
                            className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-300 hover:text-white"
                            title="Expand"
                         >
                             <Maximize2 size={18} />
                         </button>
                         <button 
                            onClick={onClose}
                            className="p-2 hover:bg-red-500/20 rounded-full transition-colors text-gray-400 hover:text-red-400"
                            title="Close"
                         >
                             <X size={18} />
                         </button>
                     </div>
                 </div>
             </div>
          </div>
      );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/95 backdrop-blur-xl animate-fade-in p-6">
       <button 
            onClick={() => setIsMinimized(true)}
            className="absolute top-6 right-6 p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
       >
           <Minimize2 size={24} />
       </button>
       <div className="w-full max-w-sm relative flex flex-col items-center justify-between h-[50vh] min-h-[400px]">
           <div className="text-center space-y-4">
               <div className="relative mx-auto">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-lime-300 to-lime-500 flex items-center justify-center shadow-[0_0_50px_rgba(163,230,53,0.6)] z-10 relative border-4 border-white/10 overflow-hidden">
                        <span className="text-red-600 font-hindi font-bold text-4xl pt-1 drop-shadow-sm">श्री</span>
                    </div>
                    {status === 'Connected' && (
                        <>
                            <div className="absolute inset-0 rounded-full border border-lime-400/30 animate-[ping_2s_ease-out_infinite]"></div>
                            <div className="absolute inset-[-10px] rounded-full border border-lime-400/10 animate-[ping_3s_ease-out_infinite_0.5s]"></div>
                        </>
                    )}
               </div>
               <div>
                   <h2 className="text-3xl font-bold text-white font-hindi tracking-wide drop-shadow-md">श्री AI</h2>
                   <p className={`text-sm font-medium mt-1 transition-colors ${status === 'Connected' ? 'text-lime-400' : 'text-gray-400'}`}>
                       {status === 'Connected' ? 'Listening...' : status}
                   </p>
               </div>
           </div>
           <div className="flex-1 flex items-center justify-center gap-2 w-full h-24">
               {status === 'Connected' ? (
                   <div className="flex items-center gap-3">
                       {renderBars()}
                   </div>
               ) : (
                   <Loader2 className="text-gray-600 animate-spin" size={32} />
               )}
           </div>
           <div className="flex items-center gap-8 w-full justify-center pb-4">
               <button 
                  onClick={toggleMute}
                  className={`p-5 rounded-full backdrop-blur-md transition-all active:scale-95 border-2 ${isMuted ? 'bg-white text-gray-900 border-white' : 'bg-gray-800/50 text-white border-gray-600 hover:bg-gray-700'}`}
               >
                   {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
               </button>
               <button 
                  onClick={onClose}
                  className="p-6 rounded-full bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:bg-red-700 transition-all active:scale-95 transform hover:-translate-y-1"
               >
                   <PhoneOff size={32} fill="currentColor" />
               </button>
           </div>
           <div className="absolute bottom-[-80px] w-full text-center">
               <p className="text-gray-500 text-xs leading-relaxed">
                   Try: "Check Ramesh delivery for 5th" <br/>
                   "Update Ramesh phone number"
               </p>
           </div>
       </div>
    </div>
  );
};

export default VoiceAssistant;
