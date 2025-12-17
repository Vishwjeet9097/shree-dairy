// ... (imports remain same)
import React, { useState, useEffect, useRef } from 'react';
import { AppState, Customer, MilkEntry, Payment, AppView, InseminationRecord, AppNotification, BusinessProfile } from './types';
import { loadState, saveState, saveAutoBackup, loadAutoBackup, getAutoBackupDate, INITIAL_STATE } from './services/storage';
import { exportBackup, importBackup, saveToPublicStorage, findPublicBackups, loadPublicBackup } from './services/backup'; 
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
import TimePicker from './components/TimePicker'; // Import TimePicker
import { AppLogo } from './components/BrandAssets';
import { Users, Settings, Mic, Home, Sun, Moon, Download, UploadCloud, Database, RefreshCw, ShieldCheck, Loader2, Type, Key, ToggleRight, ToggleLeft, Smartphone, Bell, Lock, Radio, BellRing, FolderLock, Clock } from 'lucide-react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

// ... (CowIcon and NavItem components remain same)
const CowIcon = ({ className, size = 24, strokeWidth = 2 }: { className?: string; size?: number; strokeWidth?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 8L16 4" /><path d="M5 8L8 4" /><path d="M7 8h10v6a5 5 0 0 1-10 0V8z" /><path d="M2 12h5" /><path d="M17 12h5" /><path d="M10 11h.01" /><path d="M14 11h.01" /></svg>
);

const NavItem = ({ isSelected, onClick, icon: Icon, label, size=24 }: { isSelected: boolean; onClick: () => void; icon: any; label: string; size?: number }) => (
  <button onClick={onClick} className="relative p-1 flex flex-col items-center justify-center w-16 h-14 group">
     <div className={`transition-all duration-300 ease-out ${isSelected ? 'transform -translate-y-1' : 'group-hover:scale-105'}`}>
        <Icon size={size} strokeWidth={isSelected ? 2.5 : 2} className={`transition-all duration-300 ${isSelected ? 'text-lime-600 dark:text-lime-400 drop-shadow-[0_0_8px_rgba(163,230,53,0.6)]' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
     </div>
     <span className={`text-[10px] font-medium mt-0.5 transition-colors font-hindi ${isSelected ? 'text-lime-600 dark:text-lime-400' : 'text-gray-400 dark:text-gray-500'}`}>{label}</span>
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
  const [pendingPermissionType, setPendingPermissionType] = useState<'notification' | 'microphone' | 'storage'>('notification');
  const [hasNotifPermission, setHasNotifPermission] = useState(false);
  const [hasAskedPermissionSession, setHasAskedPermissionSession] = useState(false); // Track per session
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  
  // Time Picker State
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [activeTimeSlot, setActiveTimeSlot] = useState<'morning' | 'evening'>('morning');
  
  // Track Mic Permission State
  const [micPermissionState, setMicPermissionState] = useState<PermissionState | 'unknown'>('unknown');

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
      
      // Auto-Restore Check (Simulating Reinstall Recovery)
      if (Capacitor.isNativePlatform() && loaded.customers.length === 0) {
           try {
               const backups = await findPublicBackups();
               if (backups.length > 0) {
                   const confirmRestore = window.confirm(`Found ${backups.length} existing backup(s) on this device. Restore the latest one?`);
                   if (confirmRestore) {
                       const latest = backups.sort().reverse()[0];
                       setIsLoading(true);
                       setLoadingMsg("Restoring from Device Storage...");
                       try {
                           const backupState = await loadPublicBackup(latest);
                           setState(backupState);
                           await saveState(backupState); 
                           showNotification("Data restored successfully!", 'success');
                       } catch(e) {
                           showNotification("Failed to restore. Please import manually.", 'error');
                       } finally {
                           setIsLoading(false);
                       }
                   }
               }
           } catch(e) {
               console.log("Could not auto-scan backups (Permission needed?)");
               setTimeout(() => handlePermissionRequest('storage'), 2000);
           }
      }

      const lastBackup = await getAutoBackupDate();
      setAutoBackupDateStr(lastBackup);
      
      if (Capacitor.isNativePlatform()) {
          try {
              // INITIAL STARTUP PERMISSION CHECK
              const check = await LocalNotifications.checkPermissions();
              setHasNotifPermission(check.display === 'granted');
              
              if (check.display !== 'granted' && loaded.isOnboardingComplete) {
                  // FORCE ASK on startup if onboarding is done
                  setTimeout(async () => {
                      const result = await NotificationService.requestPermissions();
                      if (result) {
                          setHasNotifPermission(true);
                          await NotificationService.scheduleDailyReminders(loaded.notificationSchedule);
                      }
                  }, 1000);
              } else if (check.display === 'granted') {
                  // Ensure channels and schedule are active
                  await NotificationService.scheduleDailyReminders(loaded.notificationSchedule);
              }
          } catch (e) {
              console.error("Permission check failed", e);
          }
          
          LocalNotifications.addListener('localNotificationReceived', (notif) => {
              showNotification(notif.body, 'info', `sys-${notif.id}-${Date.now()}`);
          });
      }

      if (navigator.permissions && navigator.permissions.query) {
          try {
              const result = await navigator.permissions.query({ name: 'microphone' as any });
              setMicPermissionState(result.state);
              result.onchange = () => { setMicPermissionState(result.state); };
          } catch (e) { console.warn("Microphone permission query not supported", e); }
      }

      setTimeout(() => setIsAppReady(true), 800);
    };
    initApp();
    
    // --- 9 PM AUTO BACKUP SCHEDULER ---
    const backupInterval = setInterval(async () => {
        const now = new Date();
        if (now.getHours() === 21 && now.getMinutes() < 5) {
            const todayStr = now.toISOString().split('T')[0];
            const lastAuto = await getAutoBackupDate();
            
            if (lastAuto !== todayStr && state.customers.length > 0) {
                console.log("Triggering 9 PM Auto-Backup...");
                await saveToPublicStorage(state, true); 
                await saveAutoBackup(state); 
                showNotification("Daily Backup Successful", 'success');
            }
        }
    }, 60000); 

    return () => clearInterval(backupInterval);

  }, []);

  // ... (useEffect for sync remains same)
  // Sync state changes to internal storage
  useEffect(() => {
     if (!isAppReady) return;
     const timeoutId = setTimeout(async () => {
         await saveState(state);
         const topDefaulter = state.customers
             .map(c => {
                 const due = state.entries.filter(e => e.customerId === c.id).reduce((acc,e) => acc + (e.isDelivered?e.quantity*c.ratePerKg:0),0) 
                           - state.payments.filter(p => p.customerId === c.id).reduce((acc,p)=>acc+p.amount,0);
                 return {name: c.name, amount: due};
             })
             .sort((a,b) => b.amount - a.amount)[0];
         updateWidgetData({
             updatedAt: Date.now(),
             highDues: topDefaulter ? [topDefaulter] : [],
             routeStats: { pending: 0, total: 0, slot: 'Morning' }
         });
     }, 1000); 
     return () => clearTimeout(timeoutId);
  }, [state, isAppReady]);

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

  // Permission Handling
  const handlePermissionRequest = (type: 'notification' | 'microphone' | 'storage') => { 
      setPendingPermissionType(type); 
      setPermissionModalOpen(true); 
  };
  
  const handleMicClick = async () => {
      // Always attempt a fresh getUserMedia so we don't get stuck on stale state
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          setMicPermissionState('granted');
          setIsVoiceOpen(true);
      } catch (e: any) {
          console.error("Mic check failed", e);
          if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
              setMicPermissionState('denied');
              showNotification("Permission required! Tap to open Settings.", 'error');
              handlePermissionRequest('microphone');
          } else {
              handlePermissionRequest('microphone');
          }
      }
  };

  const confirmPermission = async () => {
      if (pendingPermissionType === 'notification') {
          setPermissionModalOpen(false);
          const granted = await NotificationService.requestPermissions();
          if (granted) { 
              setHasNotifPermission(true); 
              await NotificationService.scheduleDailyReminders(state.notificationSchedule); 
              showNotification("Notifications enabled!", 'success'); 
          } else {
              showNotification("Permission denied. Enable in Settings.", 'error');
          }
      } else if (pendingPermissionType === 'storage') {
          setPermissionModalOpen(false);
          try {
             const status = await Filesystem.requestPermissions();
             if (status.publicStorage === 'granted') {
                 showNotification("Storage access granted. Auto-backups active.", 'success');
                 await saveToPublicStorage(state, true);
             } else {
                 showNotification("Storage permission needed for backups.", 'error');
             }
          } catch(e) {
             console.error(e);
             try {
                await saveToPublicStorage(state, true);
                showNotification("Storage access verified.", 'success');
             } catch(err) {
                showNotification("Please allow Files access in Settings.", 'error');
             }
          }
      } else { 
          // Microphone
          try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              stream.getTracks().forEach(track => track.stop());
              
              setState(prev => ({ ...prev, hasSeenMicRationale: true }));
              setMicPermissionState('granted');
              setPermissionModalOpen(false);
              setIsVoiceOpen(true); 
          } catch (err) {
              console.error("Mic permission check failed", err);
              setPermissionModalOpen(false);
              showNotification("Microphone access is required for AI commands.", 'error');
          }
      }
  };

  const handleTestNotification = async () => {
      if (!Capacitor.isNativePlatform()) {
          showNotification("Native notifications require an Android/iOS device.", 'info');
          return;
      }

      if (!hasNotifPermission) {
          showNotification("Enable notifications first!", 'error');
          return;
      }
      try {
          await NotificationService.createChannels();
          const scheduleDate = new Date(Date.now() + 3000); 
          
          await LocalNotifications.schedule({
              notifications: [
                  {
                      title: "Shree App Test",
                      body: "🔔 This is your system alert! It works.",
                      id: 99999,
                      schedule: { at: scheduleDate }, 
                      channelId: 'daily_updates',
                      iconColor: '#84cc16'
                  }
              ]
          });
          showNotification("Scheduled! Close app now to see alert.", 'info');
      } catch (e) {
          console.error(e);
          showNotification("Failed to schedule test notification.", 'error');
      }
  };

  const handleOnboardingComplete = (settings: { language: 'en' | 'hi', isDarkMode: boolean }) => {
      setState(prev => ({ ...prev, language: settings.language, isDarkMode: settings.isDarkMode, isOnboardingComplete: true }));
      if (Capacitor.isNativePlatform()) {
          setTimeout(() => {
              handlePermissionRequest('notification');
          }, 1000);
          setTimeout(() => {
              handlePermissionRequest('storage'); // Ask for storage after notifications
          }, 3000);
      }
  };

  // Schedule Updates
  const handleScheduleChange = (type: 'morning' | 'evening', time: string) => {
      const newSchedule = { ...state.notificationSchedule, [type]: time };
      setState(prev => ({ ...prev, notificationSchedule: newSchedule }));
      if (Capacitor.isNativePlatform()) {
          NotificationService.scheduleDailyReminders(newSchedule);
      }
  };

  const openTimePicker = (slot: 'morning' | 'evening') => {
      setActiveTimeSlot(slot);
      setIsTimePickerOpen(true);
  };

  const handleTimePickerSave = (timeStr: string) => {
      handleScheduleChange(activeTimeSlot, timeStr);
  };

  // Helper to format time for display (24h -> 12h)
  const formatTimeDisplay = (time24: string) => {
      if (!time24) return { time: '--:--', ampm: '' };
      const [h, m] = time24.split(':');
      let hour = parseInt(h);
      if (isNaN(hour)) return { time: '--:--', ampm: '' };
      
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12;
      hour = hour ? hour : 12; 
      return { time: `${hour}:${m}`, ampm };
  };

  // ... (Rest of the CRUD handlers remain identical)
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
  const handleVoiceAction = async (result: any) => {
    const { action, data } = result;
    if (action === 'ADD_ENTRY') {
      let customer = state.customers.find(c => c.name.toLowerCase().includes(data.customerName.toLowerCase()));
      
      // AUTO CREATE CUSTOMER IF MISSING
      if (!customer) {
          const newName = data.customerName.charAt(0).toUpperCase() + data.customerName.slice(1);
          const newCustomer: Customer = {
              id: Date.now().toString(),
              name: newName,
              nameHi: newName, 
              phone: '',
              address: 'Added via Voice',
              defaultQty: 1, 
              ratePerKg: 60,
              isActive: true,
              preferredTime: 'morning',
              behavior: 'good',
              createdAt: Date.now()
          };
          
          setState(prev => ({ ...prev, customers: [...prev.customers, newCustomer] }));
          customer = newCustomer;
          showNotification(`Created new profile for ${newName}`, 'success');
      }

      const today = new Date().toISOString().split('T')[0];
      const date = data.date || today;
      const slot = data.slot ? data.slot.toLowerCase() : (new Date().getHours() < 14 ? 'morning' : 'evening');
      const qty = data.quantity !== undefined ? Number(data.quantity) : customer.defaultQty;
      
      const entry: MilkEntry = { 
          id: `${customer.id}-${date}-${slot}`, 
          customerId: customer.id, 
          date: date, 
          quantity: isNaN(qty) ? customer.defaultQty : qty, 
          isDelivered: data.isDelivered, 
          slot: slot, 
          timestamp: Date.now() 
      };
      handleAddEntry(entry);
      return `Updated ${customer.name}: ${entry.isDelivered ? entry.quantity + 'L' : 'absent'} (${date})`;
    }
    
    // ... (rest of voice actions) ...
    if (action === 'ADD_PAYMENT') {
        const customer = state.customers.find(c => c.name.toLowerCase().includes(data.customerName.toLowerCase()));
        if (!customer) return "Customer not found";
        const amt = Number(data.amount);
        handleSavePayment({ customerId: customer.id, amount: isNaN(amt) ? 0 : amt, date: data.date || new Date().toISOString().split('T')[0], type: 'cash' });
        return `Added payment of ₹${amt} for ${customer.name}`;
    }
    if (action === 'DELETE_PAYMENT') {
        const customer = state.customers.find(c => c.name.toLowerCase().includes(data.customerName.toLowerCase()));
        if (!customer) return "Customer not found";
        setState(prev => ({ ...prev, payments: prev.payments.filter(p => !(p.customerId === customer.id && p.amount === data.amount && (!data.date || p.date === data.date))) }));
        return `Deleted payment of ₹${data.amount}`;
    }
    if (action === 'ADD_CUSTOMER') {
        const rate = Number(data.rate);
        const qty = Number(data.quantity);
        // Explicit preferredTime logic
        const pTime = data.preferredTime ? data.preferredTime.toLowerCase() : 'morning';
        
        const newCustomer: Customer = {
            id: Date.now().toString(),
            name: data.name,
            nameHi: data.nameHi || data.name,
            ratePerKg: isNaN(rate) ? 60 : rate,
            defaultQty: isNaN(qty) ? 1 : qty,
            phone: data.phone || '',
            address: data.address || '',
            preferredTime: pTime as any,
            behavior: 'good',
            isActive: true,
            createdAt: Date.now()
        };

        // Use direct state update to ensure atomic addition
        setState(prev => ({ ...prev, customers: [...prev.customers, newCustomer] }));
        showNotification(`Added customer ${data.name} (${pTime})`, 'success');
        return `Created profile for ${data.name} with ${pTime} slot.`;
    }
    if (action === 'UPDATE_CUSTOMER') {
        const customer = state.customers.find(c => c.name.toLowerCase().includes(data.customerName.toLowerCase()));
        if (!customer) return "Customer not found";
        const updated: Customer = { ...customer };
        if (data.phone) updated.phone = data.phone;
        if (data.address) updated.address = data.address;
        if (data.rate) updated.ratePerKg = Number(data.rate);
        if (data.defaultQty) updated.defaultQty = Number(data.defaultQty);
        if (data.isActive !== undefined) updated.isActive = data.isActive;
        if (data.preferredTime) updated.preferredTime = data.preferredTime.toLowerCase();
        
        setState(prev => ({ ...prev, customers: prev.customers.map(c => c.id === customer.id ? updated : c) }));
        return `Updated profile for ${customer.name}`;
    }
    // ... (other actions remain same) ...
    if (action === 'ADD_RANGE_ENTRY') {
        const customer = state.customers.find(c => c.name.toLowerCase().includes(data.customerName.toLowerCase()));
        if (!customer) return "Customer not found";
        
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        const newEntries: MilkEntry[] = [];
        
        const overrideQty = data.quantity !== undefined ? Number(data.quantity) : undefined;

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${day}`;
            const slots: ('morning' | 'evening')[] = [];
            if (customer.preferredTime === 'both') { slots.push('morning', 'evening'); } else { slots.push(customer.preferredTime); }
            slots.forEach(slot => {
                 newEntries.push({ 
                     id: `${customer.id}-${dateStr}-${slot}`, 
                     customerId: customer.id, 
                     date: dateStr, 
                     quantity: overrideQty !== undefined ? overrideQty : customer.defaultQty, 
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
      {/* Time Picker Modal */}
      <TimePicker 
          isOpen={isTimePickerOpen} 
          onClose={() => setIsTimePickerOpen(false)}
          onSave={handleTimePickerSave}
          initialTime={state.notificationSchedule[activeTimeSlot]}
          title={activeTimeSlot === 'morning' ? t.morning : t.evening}
      />
      
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
                <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white font-hindi">{t.settings}</h2>
                    
                    {/* ... Settings Items ... */}
                    <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-300 font-medium">{t.language}</span>
                        <button onClick={() => setState(prev => ({ ...prev, language: prev.language === 'en' ? 'hi' : 'en' }))} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full font-bold text-sm text-lime-600 dark:text-lime-400">{state.language === 'en' ? 'English' : 'हिंदी'}</button>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-300 font-medium">{t.darkMode}</span>
                        <button onClick={() => setState(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }))} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-lime-600 dark:text-lime-400">
                            {state.isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                    </div>

                    {Capacitor.isNativePlatform() && (
                        <>
                           <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700">
                               <span className="text-gray-600 dark:text-gray-300 font-medium flex items-center gap-2"><Bell size={18} /> Notifications</span>
                               <button onClick={() => handlePermissionRequest('notification')} className={`px-4 py-2 rounded-full font-bold text-xs ${hasNotifPermission ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{hasNotifPermission ? 'Active' : 'Enable'}</button>
                           </div>

                           {/* STORAGE PERMISSION BUTTON */}
                           <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700">
                               <span className="text-gray-600 dark:text-gray-300 font-medium flex items-center gap-2"><FolderLock size={18} /> Auto-Backup</span>
                               <button onClick={() => handlePermissionRequest('storage')} className="px-4 py-2 bg-lime-100 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400 rounded-full font-bold text-xs hover:bg-lime-200 transition-colors">
                                   Allow Access
                               </button>
                           </div>
                        </>
                    )}
                    
                    {/* ENHANCED NOTIFICATION SCHEDULE SECTION */}
                    <div className="py-4 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock size={18} className="text-gray-600 dark:text-gray-300" />
                            <span className="text-gray-600 dark:text-gray-300 font-medium">Notification Schedule</span>
                        </div>
                        <div className="flex gap-4">
                            {/* Morning Card */}
                            <button 
                                onClick={() => openTimePicker('morning')}
                                className="flex-1 bg-gray-100 dark:bg-gray-700/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 hover:bg-white dark:hover:bg-gray-700 border border-transparent hover:border-lime-300 dark:hover:border-lime-500/50 transition-all shadow-sm group"
                            >
                                <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1 group-hover:text-lime-600 dark:group-hover:text-lime-400">Morning</div>
                                <div className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-1">
                                    {formatTimeDisplay(state.notificationSchedule.morning).time} 
                                    <span className="text-xs text-gray-400 font-medium bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded">{formatTimeDisplay(state.notificationSchedule.morning).ampm}</span>
                                </div>
                                <Clock size={14} className="text-gray-400 mt-2 opacity-50" />
                            </button>

                            {/* Evening Card */}
                            <button 
                                onClick={() => openTimePicker('evening')}
                                className="flex-1 bg-gray-100 dark:bg-gray-700/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 hover:bg-white dark:hover:bg-gray-700 border border-transparent hover:border-lime-300 dark:hover:border-lime-500/50 transition-all shadow-sm group"
                            >
                                <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1 group-hover:text-lime-600 dark:group-hover:text-lime-400">Evening</div>
                                <div className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-1">
                                    {formatTimeDisplay(state.notificationSchedule.evening).time}
                                    <span className="text-xs text-gray-400 font-medium bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded">{formatTimeDisplay(state.notificationSchedule.evening).ampm}</span>
                                </div>
                                <Clock size={14} className="text-gray-400 mt-2 opacity-50" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-300 font-medium flex items-center gap-2 text-sm ml-1">
                            <BellRing size={16} className="text-lime-500" /> Test System Alert
                        </span>
                        <button 
                            onClick={handleTestNotification}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-lime-200 dark:hover:bg-lime-900 text-gray-700 dark:text-gray-300 rounded-full font-bold text-xs flex items-center gap-2 transition-colors"
                        >
                            <Radio size={14} className={isLoading ? "animate-pulse text-red-500" : ""} /> 
                            Send 3s Timer
                        </button>
                    </div>

                </div>
                {/* ... other sections ... */}
                <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-lime-100 dark:border-lime-900/20"><h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white font-hindi flex items-center gap-2"><Key size={18} className="text-lime-500" /> AI Configuration</h2><div className="flex items-center justify-between mb-4"><span className="text-gray-600 dark:text-gray-300 font-medium text-sm">Use Custom API Key</span><button onClick={() => setState(prev => ({ ...prev, useCustomApiKey: !prev.useCustomApiKey }))} className={`relative w-11 h-6 rounded-full transition-colors ${state.useCustomApiKey ? 'bg-lime-500' : 'bg-gray-300 dark:bg-gray-600'}`}><span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${state.useCustomApiKey ? 'translate-x-5' : 'translate-x-0'}`} /></button></div>{state.useCustomApiKey && (<div className="space-y-2 animate-fade-in"><div className="relative"><input type="password" value={state.customApiKey || ''} onChange={(e) => setState(prev => ({ ...prev, customApiKey: e.target.value }))} placeholder="Enter your API Key" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-200 dark:focus:ring-lime-900" /></div></div>)}</div>
                <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm"><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full text-orange-600 dark:text-orange-400"><Smartphone size={20} /></div><span className="text-gray-900 dark:text-white font-bold font-hindi">Home Screen Widget</span></div><button onClick={() => setIsWidgetPreviewOpen(true)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full font-bold text-xs transition-colors">Preview</button></div><div className="grid grid-cols-2 gap-3 mt-4"><button onClick={handleExportData} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 hover:bg-lime-50 dark:hover:bg-gray-600 hover:border-lime-300 transition-all group"><Download size={24} className="text-gray-600 dark:text-gray-300 group-hover:text-lime-600" /><span className="text-xs font-bold text-gray-700 dark:text-gray-300 group-hover:text-lime-600">{Capacitor.isNativePlatform() ? 'Share Backup File' : 'Download File'}</span></button><button onClick={handleRestoreClick} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 hover:bg-orange-50 dark:hover:bg-gray-600 hover:border-orange-300 transition-all group"><UploadCloud size={24} className="text-gray-600 dark:text-gray-300 group-hover:text-orange-500" /><span className="text-xs font-bold text-gray-700 dark:text-gray-300 group-hover:text-orange-500">Restore File</span></button><input type="file" accept="*/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" /></div></div>
                <div className="pt-4 text-center pb-8"><div className="flex items-center justify-center gap-2 mb-2"><ShieldCheck size={14} className="text-lime-500" /><span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Secure & Local Storage</span></div><p className="text-[10px] text-gray-400">App Version 2.2.0 • Play Store Compliant</p></div>
            </div>
            )}
            {currentView === 'customer-detail' && selectedCustomer && <CustomerDetail customer={selectedCustomer} businessProfile={state.businessProfile} entries={state.entries} payments={state.payments} language={state.language} onAddEntry={handleAddEntry} onOpenPaymentModal={() => setIsPaymentModalOpen(true)} onEditCustomer={() => { setEditingCustomer(selectedCustomer); setIsAddCustomerOpen(true); }} onDeleteCustomer={handleDeleteCustomerUI} onToggleStatus={handleToggleCustomerStatus} onBack={() => setCurrentView('customers')} onVacation={() => setIsVacationModalOpen(true)} />}
        </div>
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 pb-safe pt-2 px-6 flex justify-between items-center z-40 max-w-md mx-auto rounded-t-[2rem]"><NavItem isSelected={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon={Home} label={t.dashboard} /><NavItem isSelected={currentView === 'customers'} onClick={() => setCurrentView('customers')} icon={Users} label={t.customers} /><div className="relative -top-6"><button onClick={handleMicClick} className="w-16 h-16 bg-gradient-to-tr from-lime-400 to-lime-500 rounded-full flex items-center justify-center shadow-lg shadow-lime-300/50 dark:shadow-lime-900/50 text-white transform transition-transform active:scale-95 border-4 border-white dark:border-gray-900"><Mic size={32} /></button></div><NavItem isSelected={currentView === 'cattle'} onClick={() => setCurrentView('cattle')} icon={CowIcon} label={t.cattle} /><NavItem isSelected={currentView === 'settings'} onClick={() => setCurrentView('settings')} icon={Settings} label={t.settings} /></div>
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