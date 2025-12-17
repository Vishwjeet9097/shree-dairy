
import React, { useState, useEffect, useMemo } from 'react';
import { X, Smartphone, AlertCircle, Sun, Moon, Battery, Wifi, Signal, IndianRupee, Clock, Calendar, PlusCircle } from 'lucide-react';
import { Customer, MilkEntry, Payment, InseminationRecord } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  entries: MilkEntry[];
  payments: Payment[];
  inseminations?: InseminationRecord[];
}

const WidgetPreviewModal: React.FC<Props> = ({ isOpen, onClose, customers, entries, payments, inseminations = [] }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [showAddGuide, setShowAddGuide] = useState(false);

  // --- Logic replicated from WidgetBridge ---
  const widgetData = useMemo(() => {
      // 1. High Dues (Top 1 for combined view)
      const topDefaulter = customers.map(c => {
        const cEntries = entries.filter(e => e.customerId === c.id);
        const cPayments = payments.filter(p => p.customerId === c.id);
        const bill = cEntries.reduce((acc, e) => acc + (e.isDelivered ? e.quantity * c.ratePerKg : 0), 0);
        const paid = cPayments.reduce((acc, p) => acc + p.amount, 0);
        return { name: c.name, amount: Math.round(bill - paid) };
      })
      .filter(d => d.amount > 100) // Show anyone with dues > 100
      .sort((a,b) => b.amount - a.amount)[0]; // Get the single highest

      // 2. Nearest Cattle Alert
      let nearestCow = null;
      if (inseminations.length > 0) {
          const now = new Date();
          const records = inseminations.map(cow => {
            const insemDate = new Date(cow.inseminationDate);
            const dueDate = new Date(insemDate);
            dueDate.setDate(insemDate.getDate() + 283); 
            const diffTime = dueDate.getTime() - now.getTime();
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return { name: cow.cowName, color: cow.cowColor, daysLeft };
          });
          // Filter for upcoming
          const upcoming = records.filter(r => r.daysLeft > -30).sort((a,b) => a.daysLeft - b.daysLeft);
          nearestCow = upcoming[0];
      }

      return {
          topDefaulter,
          nearestCow
      };
  }, [customers, entries, payments, inseminations]);

  // Rotate Slides
  useEffect(() => {
      if (!isOpen) return;
      const interval = setInterval(() => {
          setActiveSlide(prev => (prev + 1) % 2);
      }, 5000);
      return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
        <div className="relative w-full max-w-sm aspect-[9/19] bg-gray-950 rounded-[3rem] border-8 border-gray-900 shadow-2xl overflow-hidden flex flex-col ring-1 ring-gray-800">
            
            {/* Fake Status Bar */}
            <div className="h-10 px-6 flex items-center justify-between text-white/90 text-xs font-medium z-20 pt-3">
                <span>9:41</span>
                <div className="flex gap-1.5 items-center">
                    <Signal size={14} />
                    <Wifi size={14} />
                    <Battery size={14} />
                </div>
            </div>

            {/* Notch Area */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-20"></div>

            {/* Fake Home Screen Area */}
            <div className="flex-1 flex flex-col pt-16 relative overflow-hidden">
                {/* Wallpaper Effect */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-80 z-0"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 z-0"></div>
                
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-12 right-6 z-50 p-2 bg-black/40 backdrop-blur-md rounded-full text-white/80 hover:bg-black/60 hover:text-white transition-all border border-white/10"
                >
                    <X size={20} />
                </button>

                <h3 className="text-white/70 text-center text-[10px] font-bold mb-6 relative z-10 uppercase tracking-[0.2em] drop-shadow-md">Widget Preview</h3>

                {/* THE WIDGET CONTAINER */}
                <div className="relative z-10 mx-6">
                    <div className="w-full aspect-[1.9/1] rounded-[26px] shadow-2xl overflow-hidden ring-1 ring-white/10 relative group cursor-default">
                        
                        {/* SLIDE 1: HIGHEST DUES (RED THEME) */}
                        <div className={`absolute inset-0 bg-gradient-to-br from-red-500 to-orange-600 p-6 flex flex-col justify-between transition-all duration-700 ease-in-out ${activeSlide === 0 ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
                            
                            {/* Background Icon */}
                            <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 opacity-20 transform rotate-12 pointer-events-none">
                                <IndianRupee size={110} className="text-black" />
                            </div>

                            {/* Top Row */}
                            <div className="flex justify-between items-start relative z-10">
                                <div className="flex items-center gap-2">
                                    <AlertCircle size={18} className="text-white/90" />
                                    <span className="text-sm font-hindi font-bold text-white/90 tracking-wide">Highest Due</span>
                                </div>
                                <span className="font-hindi font-bold text-white/30 text-lg">श्री</span>
                            </div>

                            {/* Center Number */}
                            <div className="relative z-10">
                                {widgetData.topDefaulter ? (
                                    <h2 className="text-5xl font-bold text-white font-hindi tracking-tight drop-shadow-md">
                                        ₹{widgetData.topDefaulter.amount.toLocaleString()}
                                    </h2>
                                ) : (
                                    <h2 className="text-3xl font-bold text-white/90 font-hindi">All Clear!</h2>
                                )}
                            </div>

                            {/* Bottom Pill */}
                            <div className="relative z-10">
                                {widgetData.topDefaulter ? (
                                    <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                                        <span className="text-xs text-white/90 font-bold font-hindi">
                                            {widgetData.topDefaulter.name}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                                        <span className="text-xs text-white/90 font-bold">No pending payments</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SLIDE 2: UPCOMING COW DELIVERY (LIME THEME) */}
                        <div className={`absolute inset-0 bg-gradient-to-br from-lime-400 to-lime-600 p-6 flex flex-col justify-between transition-all duration-700 ease-in-out ${activeSlide === 1 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                            
                            {/* Background Icon */}
                            <div className="absolute right-[-15px] top-1/2 -translate-y-1/2 opacity-20 transform -rotate-12 pointer-events-none">
                                <Clock size={120} className="text-black" />
                            </div>

                            {/* Top Row */}
                            <div className="flex justify-between items-start relative z-10">
                                <div className="flex items-center gap-2">
                                    <Calendar size={18} className="text-gray-900" />
                                    <span className="text-sm font-hindi font-bold text-gray-900 tracking-wide">Upcoming Delivery</span>
                                </div>
                                <span className="font-hindi font-bold text-gray-900/30 text-lg">श्री</span>
                            </div>

                            {/* Center Number */}
                            <div className="relative z-10">
                                {widgetData.nearestCow ? (
                                    <h2 className="text-5xl font-bold text-gray-900 font-hindi tracking-tight drop-shadow-sm">
                                        {widgetData.nearestCow.daysLeft} <span className="text-2xl opacity-70">Days</span>
                                    </h2>
                                ) : (
                                    <h2 className="text-3xl font-bold text-gray-900 font-hindi">No Events</h2>
                                )}
                            </div>

                            {/* Bottom Pill */}
                            <div className="relative z-10">
                                {widgetData.nearestCow ? (
                                    <div className="inline-flex items-center gap-2 bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-sm">
                                        <span className="text-xs text-gray-900 font-bold font-hindi">
                                            {widgetData.nearestCow.name}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-gray-900/50"></span>
                                        <span className="text-[10px] text-gray-900/70 font-bold uppercase">
                                            {widgetData.nearestCow.color}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-2 bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
                                        <span className="text-xs text-gray-900 font-bold">No upcoming calving</span>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                    
                    {/* Reflection / Shadow */}
                    <div className="w-[90%] mx-auto h-4 bg-black/40 blur-xl rounded-full mt-2"></div>
                </div>

                {/* Indicators */}
                <div className="flex justify-center gap-1.5 mt-6 relative z-10">
                    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${activeSlide === 0 ? 'bg-white w-4' : 'bg-white/30'}`}></div>
                    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${activeSlide === 1 ? 'bg-white w-4' : 'bg-white/30'}`}></div>
                </div>

                {/* Add Widget Button */}
                {!showAddGuide && (
                    <div className="mt-8 px-8 flex justify-center relative z-20">
                        <button 
                            onClick={() => setShowAddGuide(true)}
                            className="bg-white text-black px-6 py-3 rounded-full font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <PlusCircle size={18} />
                            Add to Home Screen
                        </button>
                    </div>
                )}

                {/* Guide Text Overlay */}
                {showAddGuide && (
                    <div className="absolute inset-0 bg-black/80 z-30 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                        <Smartphone size={48} className="text-white mb-4 animate-pulse" />
                        <h4 className="text-white font-bold text-lg mb-2">To Add Widget:</h4>
                        <ol className="text-gray-300 text-sm space-y-3 text-left list-decimal pl-4">
                            <li>Go to your phone's <b>Home Screen</b>.</li>
                            <li><b>Long press</b> on an empty space.</li>
                            <li>Select <b>Widgets</b>.</li>
                            <li>Find <b>Shree App</b> in the list.</li>
                            <li>Drag the widget to your screen.</li>
                        </ol>
                        <button 
                            onClick={() => setShowAddGuide(false)}
                            className="mt-8 text-white/50 text-xs uppercase font-bold tracking-widest hover:text-white"
                        >
                            Close
                        </button>
                    </div>
                )}

                {/* Fake App Grid at bottom */}
                {!showAddGuide && (
                    <div className="mt-auto mb-8 grid grid-cols-4 gap-6 px-6 relative z-10">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg flex items-center justify-center">
                                    {i === 1 && <div className="w-8 h-8 rounded-full bg-lime-400 flex items-center justify-center text-red-600 font-bold font-hindi text-lg">श्री</div>}
                                </div>
                                <div className="w-8 h-1.5 bg-white/20 rounded-full"></div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default WidgetPreviewModal;
