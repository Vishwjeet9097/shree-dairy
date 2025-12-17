
import { AppState } from '../types';
import { Preferences } from '@capacitor/preferences';

const STORAGE_KEY = 'doodhwala_app_v1';
const AUTO_BACKUP_KEY = 'doodhwala_auto_backup_daily';
const AUTO_BACKUP_DATE_KEY = 'doodhwala_auto_backup_date';

export const INITIAL_STATE: AppState = {
  businessProfile: {
      businessName: "Shree Dairy Farm",
      businessNameHi: "श्री डेयरी फार्म",
      ownerName: "Lakshman Prasad",
      address: "Bakrour, near Vaidh ji",
      phone: "8340685325"
  },
  customers: [],
  entries: [],
  payments: [],
  inseminations: [],
  notifications: [], // Initialized
  language: 'hi', // Default Hindi
  isDarkMode: true, // Default Dark
  fontSize: 'medium',
  lastBackupTimestamp: 0,
  isOnboardingComplete: false,
  customApiKey: '',
  useCustomApiKey: false
};

// Async Storage Wrapper for Native Platform
export const loadState = async (): Promise<AppState> => {
  try {
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    if (value === null) {
      return INITIAL_STATE;
    }
    const loadedState = JSON.parse(value);
    
    // Validate Structure and Default missing arrays
    return {
        ...INITIAL_STATE,
        ...loadedState,
        businessProfile: loadedState.businessProfile || INITIAL_STATE.businessProfile,
        customers: Array.isArray(loadedState.customers) ? loadedState.customers : [],
        entries: Array.isArray(loadedState.entries) ? loadedState.entries : [],
        payments: Array.isArray(loadedState.payments) ? loadedState.payments : [],
        inseminations: Array.isArray(loadedState.inseminations) ? loadedState.inseminations : [],
        notifications: Array.isArray(loadedState.notifications) ? loadedState.notifications : [],
        isOnboardingComplete: loadedState.isOnboardingComplete ?? false,
        customApiKey: loadedState.customApiKey || '',
        useCustomApiKey: loadedState.useCustomApiKey || false
    };
  } catch (err) {
    console.error("Load state failed", err);
    return INITIAL_STATE;
  }
};

export const saveState = async (state: AppState) => {
  try {
    const serializedState = JSON.stringify(state);
    await Preferences.set({ key: STORAGE_KEY, value: serializedState });
  } catch (err) {
    console.error("Save state failed", err);
  }
};

// --- Auto Backup Methods ---

export const saveAutoBackup = async (state: AppState) => {
    try {
        const serializedState = JSON.stringify(state);
        await Preferences.set({ key: AUTO_BACKUP_KEY, value: serializedState });
        await Preferences.set({ key: AUTO_BACKUP_DATE_KEY, value: new Date().toISOString().split('T')[0] });
        console.log("Auto-backup created successfully.");
    } catch (err) {
        console.error("Auto-backup failed", err);
    }
};

export const loadAutoBackup = async (): Promise<AppState | null> => {
    try {
        const { value } = await Preferences.get({ key: AUTO_BACKUP_KEY });
        if (!value) return null;
        return JSON.parse(value);
    } catch (err) {
        console.error("Load auto-backup failed", err);
        return null;
    }
};

export const getAutoBackupDate = async (): Promise<string | null> => {
    const { value } = await Preferences.get({ key: AUTO_BACKUP_DATE_KEY });
    return value;
};
