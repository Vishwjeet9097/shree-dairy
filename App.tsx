
// ... (imports remain same)
import React, { useState, useEffect, useRef } from 'react';
import { AppState, Customer, MilkEntry, Payment, AppView, InseminationRecord, AppNotification, BusinessProfile } from './types';
import { loadState, saveState, saveAutoBackup, loadAutoBackup, getAutoBackupDate, INITIAL_STATE } from './services/storage';
import { exportBackup, importBackup } from './services/backup';
import { NotificationService } from './services/notifications'; 
import { updateWidgetData, WidgetData } from './services/widgetBridge'; 
import { LocalNotifications } from '@capacitor/local-notifications'; 
import { TEXTS } from './constants';
import Dashboard from './components/Dashboard';
import CustomerList from './components/CustomerList';
import CustomerDetail from './components/CustomerDetail';
import VoiceAssistant from './components/VoiceAssistant';
import AddCustomerModal from './components/AddCustomerModal';
import PaymentModal from './components/PaymentModal';
import VacationModal from './components/VacationModal';
import CattleManager from './components/CattleManager';
import BusinessProfileModal from './components/BusinessProfileModal';
import Onboarding from './components/Onboarding'; 
import Toast from './components/Toast';
import ImportConfirmModal from './components/ImportConfirmModal';
import WidgetPreviewModal from './components/WidgetPreviewModal'; 
import PermissionModal from './components/PermissionModal'; 
import { AppLogo } from './components/BrandAssets';
import { Users, Settings, Mic, Home, Sun, Moon, Download, UploadCloud, Database, RefreshCw, ShieldCheck, Loader2, Type, Key, ToggleRight, ToggleLeft, Smartphone, Bell, Lock } from 'lucide-react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

// ... (CowIcon and NavItem remain same)
const CowIcon = ({ className, size = 24, strokeWidth = 2 }: { className?: string; size?: number; strokeWidth?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M19 8L16 4" />
    <path d="M5 8L8 4" />
    <path d="M7 8h10v6a5 5 0 0 1-10 0V8z" />
    <path d="M2 12h5" />
    <path d="M17 12h5" />
    <path d="M10 11h.01" />
    <path d="M14 11h.01" />
  </svg>
);

const NavItem = ({ isSelected, onClick, icon: Icon, label, size=24 }: { isSelected: boolean; onClick: () => void; icon: any; label: string; size?: number }) => (
  <button 
    onClick={onClick}
    className="relative p-1 flex flex-col items-center justify-center w-16 h-14 group"
  >
     <div className={`transition-all duration-300 ease-out ${isSelected ? 'transform -translate-y-1' : 'group-hover:scale-105'}`}>
        <Icon 
          size={size} 
          strokeWidth={isSelected ? 2.5 : 2}
          className={`transition-all duration-300 ${
            isSelected 
            ? 'text-lime-600 dark:text-lime-400 drop-shadow-[0_0_8px_rgba(163,230,53,0.6)]' 
            : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
          }`} 
        />
     </div>
     <span className={`text-[10px] font-medium mt-0.5 transition-colors font-hindi ${isSelected ? 'text-lime-600 dark:text-lime-400' : 'text-gray-400 dark:text-gray-500'}`}>
         {label}
     </span>
  </button>
);

const App: React.FC = () => {
  // Initialize with default state first, then load async
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [isAppReady, setIsAppReady] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); 
  const [isWidgetPreviewOpen, setIsWidgetPreviewOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [autoBackupDateStr, setAutoBackupDateStr] = useState<string | null>(null);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [pendingPermissionType, setPendingPermissionType] = useState<'notification' | 'microphone'>('notification');
  const [hasNotifPermission, setHasNotifPermission] = useState(false);
  const [hasAskedPermissionSession, setHasAskedPermissionSession] = useState(false); // Track per session
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');

  const t = TEXTS[state.language];
  const getFontSizeClass = () => {
      switch(state.fontSize) {
          case 'small': return 'text-sm';
          case 'large': return 'text-lg';
          default: return 'text-base';
      }
  };
  const effectiveApiKey = (state.useCustomApiKey && state.customApiKey) ? state.customApiKey : undefined;

  useEffect(() => {
    const initApp = async () => {
      const loaded = await loadState();
      setState(loaded);
      const lastBackup = await getAutoBackupDate();
      setAutoBackupDateStr(lastBackup);
      
      // Initial Native Checks
      if (Capacitor.isNativePlatform()) {
          try {
              const check = await LocalNotifications.checkPermissions();
              setHasNotifPermission(check.display === 'granted');
          } catch (e) {
              console.error("Permission check failed", e);
          }
          
          LocalNotifications.addListener('localNotificationReceived', (notif) => {
              showNotification(notif.body, 'info', `sys-${notif.id}-${Date.now()}`);
          });
      }
      setTimeout(() => setIsAppReady(true), 800);
    };
    initApp();
    if (Capacitor.isNativePlatform()) {
        CapacitorApp.addListener('backButton', ({ canGoBack }) => {
            if (isVoiceOpen) { setIsVoiceOpen(false); return; }
            if (isAddCustomerOpen) { setIsAddCustomerOpen(false); return; }
            if (isProfileModalOpen) { setIsProfileModalOpen(false); return; }
            if (isWidgetPreviewOpen) { setIsWidgetPreviewOpen(false); return; }
            if (currentView !== 'dashboard') { setCurrentView('dashboard'); return; }
            CapacitorApp.exitApp();
        });
    }
  }, []);

  useEffect(() => {
    if (isAppReady) {
       saveState(state);
       // Widget logic...
       const prepareWidgetData = () => {
           const highDues = state.customers.map(c => {
                const cEntries = state.entries.filter(e => e.customerId === c.id);
                const cPayments = state.payments.filter(p => p.customerId === c.id);
                const bill = cEntries.reduce((acc, e) => acc + (e.isDelivered ? e.quantity * c.ratePerKg : 0), 0);
                const paid = cPayments.reduce((acc, p) => acc + p.amount, 0);
                return { name: c.name, amount: Math.round(bill - paid) };
           }).filter(d => d.amount > 500).sort((a,b) => b.amount - a.amount).slice(0, 3);

           const now = new Date();
           const todayStr = now.toISOString().split('T')[0];
           const isEvening = now.getHours() >= 14;
           const slot = isEvening ? 'evening' : 'morning';
           const slotLabel = isEvening ? 'Evening' : 'Morning';
           const activeCustomers = state.customers.filter(c => c.isActive);
           const targetCustomers = activeCustomers.filter(c => c.preferredTime === slot || c.preferredTime === 'both');
           const deliveredCount = targetCustomers.filter(c => {
               return state.entries.some(e => e.customerId === c.id && e.date === todayStr && (e.slot === slot || (!e.slot && slot === 'morning')));
           }).length;

           updateWidgetData({
               updatedAt: Date.now(),
               highDues,
               routeStats: { pending: targetCustomers.length - deliveredCount, total: targetCustomers.length, slot: slotLabel }
           });
       };
       prepareWidgetData();
    }
  }, [state, isAppReady]);

  // Auto-Prompt for Permissions on Load if missing
  useEffect(() => {
      // Trigger only if app is fully ready, user has finished onboarding, 
      // we are on native platform, we don't have permission, and we haven't asked this session.
      if (isAppReady && state.isOnboardingComplete && Capacitor.isNativePlatform() && !hasNotifPermission && !hasAskedPermissionSession) {
          const timer = setTimeout(() => {
              handlePermissionRequest('notification');
              setHasAskedPermissionSession(true);
          }, 2500); // 2.5s delay after open
          return () => clearTimeout(timer);
      }
  }, [isAppReady, state.isOnboardingComplete, hasNotifPermission, hasAskedPermissionSession]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info', uniqueId?: string) => {
      setNotification({ message, type });
      if (uniqueId) {
          const exists = state.notifications.some(n => n.id === uniqueId);
          if (exists) return;
      }
      const newNotif: AppNotification = { id: uniqueId || Date.now().toString(), message, type, timestamp: Date.now(), read: false };
      setState(prev => ({ ...prev, notifications: [newNotif, ...prev.notifications].slice(0, 50) }));
  };

  const handleClearNotifications = () => setState(prev => ({ ...prev, notifications: [] }));
  const handleMarkNotificationsRead = () => setState(prev => ({ ...prev, notifications: prev.notifications.map(n => ({ ...n, read: true })) }));
  const handleDismissNotification = (id: string) => setState(prev => ({ ...prev, notifications: prev.notifications.filter(n => n.id !== id) }));

  useEffect(() => {
    if (!isAppReady) return;
    const runScheduledTasks = async () => {
        const todayStr = new Date().toISOString().split('T')[0];
        const now = new Date();
        const currentHour = now.getHours();
        if (Capacitor.isNativePlatform() && hasNotifPermission) {
             await NotificationService.scheduleDailyReminders();
        }
        const lastAutoBackup = await getAutoBackupDate();
        if (currentHour >= 21 && lastAutoBackup !== todayStr) {
            await saveAutoBackup(state);
            setAutoBackupDateStr(todayStr);
        }
        if (now.getDay() === 1 && currentHour >= 9 && currentHour < 12) {
             const activeCustomers = state.customers.filter(c => c.isActive);
             activeCustomers.forEach(cust => {
                  const custEntries = state.entries.filter(e => e.customerId === cust.id);
                  const custPayments = state.payments.filter(p => p.customerId === cust.id);
                  const totalBill = custEntries.reduce((acc, e) => acc + (e.isDelivered ? e.quantity * cust.ratePerKg : 0), 0);
                  const totalPaid = custPayments.reduce((acc, p) => acc + p.amount, 0);
                  const due = totalBill - totalPaid;
                  if (due > 3000) showNotification(`💰 High Dues: ${cust.name} owes ₹${due.toFixed(0)}`, 'error', `high-due-${cust.id}-${todayStr}`);
             });
        }
    };
    runScheduledTasks();
  }, [state.customers, state.entries, state.inseminations, isAppReady, hasNotifPermission]);

  const handlePermissionRequest = (type: 'notification' | 'microphone') => { setPendingPermissionType(type); setPermissionModalOpen(true); };
  
  const confirmPermission = async () => {
      setPermissionModalOpen(false);
      if (pendingPermissionType === 'notification') {
          const granted = await NotificationService.requestPermissions();
          if (granted) { 
              setHasNotifPermission(true); 
              await NotificationService.scheduleDailyReminders(); 
              showNotification("Notifications enabled!", 'success'); 
          }
          else {
              showNotification("Permission denied. Enable in Settings.", 'error');
          }
      } else { 
          // For mic, we usually just open the voice assistant which requests it
          setIsVoiceOpen(true); 
      }
  };

  const handleOnboardingComplete = (settings: { language: 'en' | 'hi', isDarkMode: boolean }) => {
      setState(prev => ({ ...prev, language: settings.language, isDarkMode: settings.isDarkMode, isOnboardingComplete: true }));
      // Ask for permission after onboarding immediately
      if (Capacitor.isNativePlatform()) {
          setTimeout(() => {
              handlePermissionRequest('notification');
              setHasAskedPermissionSession(true);
          }, 1500);
      }
  };

  // ... (Rest of CRUD handlers remain same)
  const handleCustomerSelect = (customer: Customer) => { setSelectedCustomer(customer); setCurrentView('customer-detail'); };
  const handleAddEntry = (entry: MilkEntry) => {
    setState(prev => {
        const updatedEntries = prev.entries.filter(e => {
            const sameDay = e.customerId === entry.customerId && e.date === entry.date;
            if (!sameDay) return true;
            if (entry.slot) return e.slot !== entry.slot;
            return false;
        });
        return { ...prev, entries: [...updatedEntries, entry] };
    });
  };
  const handleMarkAllDelivered = () => {
      const today = new Date().toISOString().split('T')[0];
      const hour = new Date().getHours();
      const targetSlot = hour < 14 ? 'morning' : 'evening';
      const activeCustomers = state.customers.filter(c => c.isActive);
      const newEntries: MilkEntry[] = [];
      const timestamp = Date.now();
      activeCustomers.forEach(customer => {
          if (targetSlot === 'morning' && customer.preferredTime === 'evening') return;
          if (targetSlot === 'evening' && customer.preferredTime === 'morning') return;
          const exists = state.entries.some(e => e.customerId === customer.id && e.date === today && (e.slot === targetSlot || (!e.slot && targetSlot === 'morning')));
          if (!exists) {
              newEntries.push({ id: `${customer.id}-${today}-${targetSlot}`, customerId: customer.id, date: today, quantity: customer.defaultQty, isDelivered: true, slot: targetSlot as 'morning' | 'evening', timestamp });
          }
      });
      if (newEntries.length > 0) {
          setState(prev => ({ ...prev, entries: [...prev.entries, ...newEntries] }));
          showNotification(`Marked ${newEntries.length} for ${targetSlot}`, 'success');
      } else { showNotification(`All ${targetSlot} deliveries updated!`, 'info'); }
  };
  const handleSavePayment = (paymentData: Omit<Payment, 'id'>) => {
    const newPayment: Payment = { ...paymentData, id: Date.now().toString() };
    setState(prev => ({ ...prev, payments: [...prev.payments, newPayment] }));
    showNotification("Payment recorded successfully", 'success');
  };
  const handleSaveCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'isActive'>) => {
    if (editingCustomer) {
      setState(prev => ({ ...prev, customers: prev.customers.map(c => c.id === editingCustomer.id ? { ...c, ...customerData } : c) }));
      if (selectedCustomer && selectedCustomer.id === editingCustomer.id) setSelectedCustomer(prev => prev ? { ...prev, ...customerData } : null);
      showNotification("Customer updated", 'success');
    } else {
      const newCustomer: Customer = { ...customerData, id: Date.now().toString(), createdAt: Date.now(), isActive: true };
      setState(prev => ({ ...prev, customers: [...prev.customers, newCustomer] }));
      showNotification("New customer added", 'success');
    }
    setIsAddCustomerOpen(false); setEditingCustomer(null);
  };
  const handleDeleteCustomer = (customerId: string) => {
    setState(prev => ({
      ...prev,
      customers: prev.customers.filter(c => c.id !== customerId),
      entries: prev.entries.filter(e => e.customerId !== customerId),
      payments: prev.payments.filter(p => p.customerId !== customerId)
    }));
  };
  const handleDeleteCustomerUI = () => {
      if(selectedCustomer) { handleDeleteCustomer(selectedCustomer.id); setSelectedCustomer(null); setCurrentView('customers'); showNotification("Customer deleted", 'info'); }
  }
  const handleToggleCustomerStatus = (id: string) => {
    setState(prev => ({ ...prev, customers: prev.customers.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c) }));
    if (selectedCustomer && selectedCustomer.id === id) setSelectedCustomer(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
  };
  const handleUpdateProfile = (profile: BusinessProfile) => { setState(prev => ({ ...prev, businessProfile: profile })); showNotification("Profile updated successfully", 'success'); };
  const handleExportData = () => {
      setIsLoading(true); setLoadingMsg("Creating backup...");
      setTimeout(async () => {
          try {
            const timestamp = Date.now();
            const stateToSave = { ...state, lastBackupTimestamp: timestamp };
            setState(stateToSave); await saveState(stateToSave); await exportBackup(stateToSave);
          } catch (e) { console.error(e); showNotification("Export failed", 'error'); } finally { setIsLoading(false); }
      }, 500);
  };
  const handleRestoreClick = () => { if (fileInputRef.current) fileInputRef.current.value = ''; fileInputRef.current?.click(); };
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) { if (fileInputRef.current) fileInputRef.current.value = ''; return; }
      setPendingImportFile(file); setIsImportConfirmOpen(true);
  };
  const processImport = () => {
      if (!pendingImportFile) return;
      setIsImportConfirmOpen(false); setIsLoading(true); setLoadingMsg("Restoring data...");
      setTimeout(async () => {
          try {
              const restoredState = await importBackup(pendingImportFile); setState(restoredState); await saveState(restoredState); showNotification("Data restored successfully!", 'success');
          } catch (error: any) { console.error(error); showNotification(`Restore Failed: ${error.message}`, 'error'); } finally { setIsLoading(false); setLoadingMsg(""); setPendingImportFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }
      }, 500);
  };
  const handleRestoreAutoBackup = async () => {
      const backup = await loadAutoBackup();
      if (!backup) { showNotification("No auto-backup found", 'error'); return; }
      const lastDate = await getAutoBackupDate();
      const confirmRestore = window.confirm(`⚠ RESTORE AUTO-BACKUP\n\nDate: ${lastDate}\n\nThis will replace current data. Continue?`);
      if (confirmRestore) { setIsLoading(true); setLoadingMsg("Restoring auto-backup..."); setTimeout(async () => { setState(backup); await saveState(backup); setIsLoading(false); showNotification("System restored from auto-backup", 'success'); }, 500); }
  };

  // ... (Voice Action and Render logic same as before)
  const handleVoiceAction = async (result: any) => {
    const { action, data } = result;

    if (action === 'ADD_ENTRY') {
      const customer = state.customers.find(c => c.name.toLowerCase().includes(data.customerName.toLowerCase()));
      if (!customer) return "Customer not found";
      const today = new Date().toISOString().split('T')[0];
      const date = data.date || today;
      const slot = data.slot ? data.slot.toLowerCase() : (new Date().getHours() < 14 ? 'morning' : 'evening');
      const entry: MilkEntry = { id: `${customer.id}-${date}-${slot}`, customerId: customer.id, date: date, quantity: data.quantity !== undefined ? data.quantity : customer.defaultQty, isDelivered: data.isDelivered, slot: slot, timestamp: Date.now() };
      handleAddEntry(entry);
      return `Updated ${customer.name}: ${entry.isDelivered ? entry.quantity + 'L' : 'absent'} (${date})`;
    }

    if (action === 'ADD_RANGE_ENTRY' || action === 'mark_delivery_range') {
        const customer = state.customers.find(c => c.name.toLowerCase().includes(data.customerName.toLowerCase()));
        if (!customer) return "Customer not found";
        
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        const newEntries: MilkEntry[] = [];
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${day}`;

            const slots: ('morning' | 'evening')[] = [];
            if (customer.preferredTime === 'both') {
                slots.push('morning', 'evening');
            } else {
                slots.push(customer.preferredTime);
            }

            slots.forEach(slot => {
                 newEntries.push({
                     id: `${customer.id}-${dateStr}-${slot}`,
                     customerId: customer.id,
                     date: dateStr,
                     quantity: data.quantity !== undefined ? data.quantity : customer.defaultQty,
                     isDelivered: data.isDelivered, 
                     note: data.reason, 
                     slot: slot,
                     timestamp: Date.now()
                 });
            });
        }
        
        setState(prev => {
            const newEntryIds = new Set(newEntries.map(e => e.id));
            const filteredEntries = prev.entries.filter(e => !newEntryIds.has(e.id));
            return { ...prev, entries: [...filteredEntries, ...newEntries] };
        });
        return `Updated records from ${data.startDate} to ${data.endDate}`;
    }

    // ... Other actions unchanged
    if (action === 'ADD_PAYMENT') {
        const customer = state.customers.find(c => c.name.toLowerCase().includes(data.customerName.toLowerCase()));
        if (!customer) return "Customer not found";
        handleSavePayment({ customerId: customer.id, amount: data.amount, date: data.date || new Date().toISOString().split('T')[0], type: 'cash' });
        return `Added payment of ₹${data.amount} for ${customer.name}`;
    }

    if (action === 'DELETE_PAYMENT') {
        const customer = state.customers.find(c => c.name.toLowerCase().includes(data.customerName.toLowerCase()));
        if (!customer) return "Customer not found";
        setState(prev => ({
             ...prev,
             payments: prev.payments.filter(p => !(p.customerId === customer.id && p.amount === data.amount && (!data.date || p.date === data.date)))
        }));
        return `Deleted payment of ₹${data.amount}`;
    }

    if (action === 'ADD_CUSTOMER') {
        handleSaveCustomer({ name: data.name, nameHi: data.nameHi || undefined, ratePerKg: data.rate, defaultQty: data.quantity, phone: '', address: '', preferredTime: 'morning', behavior: 'good' });
        return `Added new customer ${data.name}`;
    }

    if (action === 'UPDATE_CUSTOMER') {
        const customer = state.customers.find(c => c.name.toLowerCase().includes(data.customerName.toLowerCase()));
        if (!customer) return "Customer not found";
        const updated: Customer = { ...customer };
        if (data.phone) updated.phone = data.phone;
        if (data.address) updated.address = data.address;
        if (data.rate) updated.ratePerKg = data.rate;
        if (data.defaultQty) updated.defaultQty = data.defaultQty;
        if (data.isActive !== undefined) updated.isActive = data.isActive;
        
        setState(prev => ({ ...prev, customers: prev.customers.map(c => c.id === customer.id ? updated : c) }));
        return `Updated profile for ${customer.name}`;
    }
    
    if (action === 'ADD_CATTLE') {
        const newCow: InseminationRecord = { id: Date.now().toString(), cowName: data.cowName, cowColor: data.cowColor || '', inseminationDate: data.date || new Date().toISOString().split('T')[0], timestamp: Date.now() };
        setState(prev => ({ ...prev, inseminations: [...prev.inseminations, newCow] }));
        NotificationService.scheduleCattleAlert(newCow);
        return `Recorded insemination for ${data.cowName}`;
    }

    if (action === 'DELETE_CATTLE') {
         setState(prev => ({ ...prev, inseminations: prev.inseminations.filter(c => !(c.cowName.toLowerCase().includes(data.cowName.toLowerCase()) && (!data.date || c.inseminationDate === data.date))) }));
         return `Deleted cattle record for ${data.cowName}`;
    }

    if (action === 'DELETE_CUSTOMER') {
        const customer = state.customers.find(c => c.name.toLowerCase().includes(data.customerName.toLowerCase()));
        if (!customer) return "Customer not found";
        handleDeleteCustomer(customer.id);
        return `Deleted customer ${customer.name}`;
    }
    return "Action completed";
  };

  const handleRangeEntries = (startDate: string, endDate: string, reason: string, isDelivered: boolean, quantity?: number) => {
      const selectedId = selectedCustomer?.id;
      if (!selectedId) return;
      const customer = state.customers.find(c => c.id === selectedId);
      if (!customer) return;
      const voiceData = { action: 'ADD_RANGE_ENTRY', data: { customerName: customer.name, startDate, endDate, reason, isDelivered, quantity } };
      handleVoiceAction(voiceData); 
      showNotification("Updated delivery range", 'success');
  };

  if (!isAppReady) {
      return (
          <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center animate-fade-in relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-lime-900/20 via-gray-900 to-gray-900"></div>
              <AppLogo className="animate-pulse" size={128} />
              <h1 className="text-4xl font-bold text-white mt-8 font-hindi tracking-wider">श्री</h1>
              <p className="text-lime-400 mt-2 font-medium tracking-widest text-sm uppercase">Dairy Manager</p>
              <div className="absolute bottom-10 flex flex-col items-center"><Loader2 className="animate-spin text-gray-600 mb-2" size={24} /><p className="text-gray-600 text-xs">Initializing Secure Storage...</p></div>
          </div>
      );
  }

  if (!state.isOnboardingComplete) { return <Onboarding onComplete={handleOnboardingComplete} />; }

  return (
    <div className={`min-h-screen font-sans ${state.isDarkMode ? 'dark bg-gray-900' : 'bg-gray-100'} ${getFontSizeClass()} transition-colors duration-300 pb-safe-area select-none`}>
      {notification && <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      <PermissionModal isOpen={permissionModalOpen} type={pendingPermissionType} onConfirm={confirmPermission} onCancel={() => setPermissionModalOpen(false)} language={state.language} />
      {isLoading && <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in"><div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-2xl flex flex-col items-center gap-4"><Loader2 className="text-lime-500 animate-spin" size={32} /><h3 className="text-lg font-bold text-gray-900 dark:text-white font-hindi">{loadingMsg}</h3></div></div>}
      <ImportConfirmModal isOpen={isImportConfirmOpen} file={pendingImportFile} onClose={() => { setIsImportConfirmOpen(false); setPendingImportFile(null); if(fileInputRef.current) fileInputRef.current.value = ''; }} onConfirm={processImport} language={state.language} />
      <WidgetPreviewModal isOpen={isWidgetPreviewOpen} onClose={() => setIsWidgetPreviewOpen(false)} customers={state.customers} entries={state.entries} payments={state.payments} inseminations={state.inseminations} />
      <div className="max-w-md mx-auto min-h-screen relative overflow-hidden bg-gray-100 dark:bg-gray-900 shadow-2xl">
        {currentView !== 'customer-detail' && <div className="absolute top-0 left-0 right-0 h-32 bg-lime-300 dark:bg-gray-800 rounded-b-[3rem] z-0 transition-colors"></div>}
        <div className="relative z-10 px-4 pt-4 h-full overflow-y-auto no-scrollbar">
            {currentView === 'dashboard' && <Dashboard customers={state.customers} entries={state.entries} payments={state.payments} notifications={state.notifications} language={state.language} isDarkMode={state.isDarkMode} inseminations={state.inseminations} onAddEntry={handleAddEntry} onViewAll={() => setCurrentView('customers')} onMarkAll={handleMarkAllDelivered} onSelectCustomer={handleCustomerSelect} onClearNotifications={handleClearNotifications} onMarkNotificationsRead={handleMarkNotificationsRead} onDismissNotification={handleDismissNotification} onProfileClick={() => setIsProfileModalOpen(true)} />}
            {currentView === 'customers' && <CustomerList customers={state.customers} entries={state.entries} payments={state.payments} notifications={state.notifications} language={state.language} onSelect={handleCustomerSelect} onAddCustomer={() => { setEditingCustomer(null); setIsAddCustomerOpen(true); }} onClearNotifications={handleClearNotifications} onMarkNotificationsRead={handleMarkNotificationsRead} onDismissNotification={handleDismissNotification} />}
            {currentView === 'cattle' && <CattleManager inseminations={state.inseminations} language={state.language} onAdd={(rec) => { setState(prev => ({ ...prev, inseminations: [...prev.inseminations, rec] })); NotificationService.scheduleCattleAlert(rec); }} onDelete={(id) => setState(prev => ({ ...prev, inseminations: prev.inseminations.filter(i => i.id !== id) }))} />}
            {currentView === 'settings' && (
            <div className="pt-20 pb-24 space-y-4 animate-fade-in">
                <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm"><h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white font-hindi">{t.settings}</h2><div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700"><span className="text-gray-600 dark:text-gray-300 font-medium">{t.language}</span><button onClick={() => setState(prev => ({ ...prev, language: prev.language === 'en' ? 'hi' : 'en' }))} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full font-bold text-sm text-lime-600 dark:text-lime-400">{state.language === 'en' ? 'English' : 'हिंदी'}</button></div><div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700"><span className="text-gray-600 dark:text-gray-300 font-medium">{t.darkMode}</span><button onClick={() => setState(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }))} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-lime-600 dark:text-lime-400">{state.isDarkMode ? <Moon size={20} /> : <Sun size={20} />}</button></div>{Capacitor.isNativePlatform() && (<div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700"><span className="text-gray-600 dark:text-gray-300 font-medium flex items-center gap-2"><Bell size={18} /> Notifications</span><button onClick={() => handlePermissionRequest('notification')} className={`px-4 py-2 rounded-full font-bold text-xs ${hasNotifPermission ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{hasNotifPermission ? 'Active' : 'Enable'}</button></div>)}</div>
                <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-lime-100 dark:border-lime-900/20"><h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white font-hindi flex items-center gap-2"><Key size={18} className="text-lime-500" /> AI Configuration</h2><div className="flex items-center justify-between mb-4"><span className="text-gray-600 dark:text-gray-300 font-medium text-sm">Use Custom API Key</span><button onClick={() => setState(prev => ({ ...prev, useCustomApiKey: !prev.useCustomApiKey }))} className={`relative w-11 h-6 rounded-full transition-colors ${state.useCustomApiKey ? 'bg-lime-500' : 'bg-gray-300 dark:bg-gray-600'}`}><span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${state.useCustomApiKey ? 'translate-x-5' : 'translate-x-0'}`} /></button></div>{state.useCustomApiKey && (<div className="space-y-2 animate-fade-in"><div className="relative"><input type="password" value={state.customApiKey || ''} onChange={(e) => setState(prev => ({ ...prev, customApiKey: e.target.value }))} placeholder="Enter your API Key" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-200 dark:focus:ring-lime-900" /></div></div>)}</div>
                <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm"><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full text-orange-600 dark:text-orange-400"><Smartphone size={20} /></div><span className="text-gray-900 dark:text-white font-bold font-hindi">Home Screen Widget</span></div><button onClick={() => setIsWidgetPreviewOpen(true)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full font-bold text-xs transition-colors">Preview</button></div><div className="grid grid-cols-2 gap-3 mt-4"><button onClick={handleExportData} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 hover:bg-lime-50 dark:hover:bg-gray-600 hover:border-lime-300 transition-all group"><Download size={24} className="text-gray-600 dark:text-gray-300 group-hover:text-lime-600" /><span className="text-xs font-bold text-gray-700 dark:text-gray-300 group-hover:text-lime-600">{Capacitor.isNativePlatform() ? 'Share Backup File' : 'Download File'}</span></button><button onClick={handleRestoreClick} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 hover:bg-orange-50 dark:hover:bg-gray-600 hover:border-orange-300 transition-all group"><UploadCloud size={24} className="text-gray-600 dark:text-gray-300 group-hover:text-orange-500" /><span className="text-xs font-bold text-gray-700 dark:text-gray-300 group-hover:text-orange-500">Restore File</span></button><input type="file" accept="*/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" /></div></div>
                <div className="pt-4 text-center pb-8"><div className="flex items-center justify-center gap-2 mb-2"><ShieldCheck size={14} className="text-lime-500" /><span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Secure & Local Storage</span></div><p className="text-[10px] text-gray-400">App Version 2.1.0 • Play Store Compliant</p></div>
            </div>
            )}
            {currentView === 'customer-detail' && selectedCustomer && <CustomerDetail customer={selectedCustomer} businessProfile={state.businessProfile} entries={state.entries} payments={state.payments} language={state.language} onAddEntry={handleAddEntry} onOpenPaymentModal={() => setIsPaymentModalOpen(true)} onEditCustomer={() => { setEditingCustomer(selectedCustomer); setIsAddCustomerOpen(true); }} onDeleteCustomer={handleDeleteCustomerUI} onToggleStatus={handleToggleCustomerStatus} onBack={() => setCurrentView('customers')} onVacation={() => setIsVacationModalOpen(true)} />}
        </div>
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 pb-safe pt-2 px-6 flex justify-between items-center z-40 max-w-md mx-auto rounded-t-[2rem]"><NavItem isSelected={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon={Home} label={t.dashboard} /><NavItem isSelected={currentView === 'customers'} onClick={() => setCurrentView('customers')} icon={Users} label={t.customers} /><div className="relative -top-6"><button onClick={() => handlePermissionRequest('microphone')} className="w-16 h-16 bg-gradient-to-tr from-lime-400 to-lime-500 rounded-full flex items-center justify-center shadow-lg shadow-lime-300/50 dark:shadow-lime-900/50 text-white transform transition-transform active:scale-95 border-4 border-white dark:border-gray-900"><Mic size={32} /></button></div><NavItem isSelected={currentView === 'cattle'} onClick={() => setCurrentView('cattle')} icon={CowIcon} label={t.cattle} /><NavItem isSelected={currentView === 'settings'} onClick={() => setCurrentView('settings')} icon={Settings} label={t.settings} /></div>
      </div>
      <VoiceAssistant isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} language={state.language} customers={state.customers} entries={state.entries} payments={state.payments} inseminations={state.inseminations} onAction={handleVoiceAction} apiKey={effectiveApiKey} />
      <AddCustomerModal isOpen={isAddCustomerOpen} onClose={() => { setIsAddCustomerOpen(false); setEditingCustomer(null); }} onSave={handleSaveCustomer} initialData={editingCustomer} language={state.language} apiKey={effectiveApiKey} />
      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onSave={handleSavePayment} customerId={selectedCustomer?.id || ''} language={state.language} />
      <VacationModal isOpen={isVacationModalOpen} onClose={() => setIsVacationModalOpen(false)} onSave={handleRangeEntries} language={state.language} />
      <BusinessProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} onSave={handleUpdateProfile} currentProfile={state.businessProfile} />
    </div>
  );
};

export default App;
