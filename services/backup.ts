
import { AppState } from '../types';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

// Backup File Structure Schema
interface BackupData {
  meta: {
    version: number;
    appName: string;
    timestamp: number;
    date: string;
  };
  data: AppState;
}

const CURRENT_SCHEMA_VERSION = 1;
const APP_SIGNATURE = "ShreeDairyApp";

/**
 * Generates a JSON file.
 * COMPLIANCE UPDATE: Uses Directory.Cache to avoid 'MANAGE_EXTERNAL_STORAGE' permission requirements.
 * This ensures the app is compliant with Android 11+ Scoped Storage rules on the Play Store.
 */
export const exportBackup = async (state: AppState): Promise<void> => {
  try {
    const backup: BackupData = {
      meta: {
        version: CURRENT_SCHEMA_VERSION,
        appName: APP_SIGNATURE,
        timestamp: Date.now(),
        date: new Date().toLocaleString()
      },
      data: state
    };

    const fileName = `Shree_Backup_${new Date().toISOString().split('T')[0]}_${Date.now().toString().slice(-4)}.json`;
    const dataStr = JSON.stringify(backup, null, 2);

    if (Capacitor.isNativePlatform()) {
        // Native: Write to private cache then share via Intent
        try {
            const result = await Filesystem.writeFile({
                path: fileName,
                data: dataStr,
                directory: Directory.Cache, // Safer than Documents for Play Store compliance
                encoding: Encoding.UTF8
            });

            await Share.share({
                title: 'Export Backup',
                text: 'Save your Shree App backup file securely.',
                url: result.uri,
                dialogTitle: 'Save Backup File'
            });
        } catch (e) {
            console.error("Native write/share failed", e);
            throw new Error("Could not prepare backup file for sharing.");
        }
    } else {
        // Web Fallback
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
  } catch (error) {
    console.error("Export failed", error);
    throw new Error("Failed to generate backup file.");
  }
};

/**
 * Reads a JSON file.
 */
export const importBackup = async (file: File): Promise<AppState> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const fileContent = event.target?.result as string;
        if (!fileContent) {
            reject(new Error("File is empty."));
            return;
        }

        let parsed: any;
        try {
            parsed = JSON.parse(fileContent);
        } catch (e) {
             reject(new Error("Selected file is not a valid JSON backup file."));
             return;
        }

        // Validate Root Structure
        if (!parsed.meta || !parsed.data) {
           throw new Error("Invalid backup format. Missing metadata.");
        }

        if (parsed.meta.appName !== APP_SIGNATURE) {
            throw new Error("This file does not belong to 'Shree' App.");
        }

        const loadedState = parsed.data;
        const sanitizedState: AppState = {
            businessProfile: loadedState.businessProfile || {
                businessName: "Shree Dairy Farm",
                businessNameHi: "श्री डेयरी फार्म",
                ownerName: "Lakshman Prasad",
                address: "Bakrour, near Vaidh ji",
                phone: "8340685325"
            },
            customers: Array.isArray(loadedState.customers) ? loadedState.customers : [],
            entries: Array.isArray(loadedState.entries) ? loadedState.entries : [],
            payments: Array.isArray(loadedState.payments) ? loadedState.payments : [],
            inseminations: Array.isArray(loadedState.inseminations) ? loadedState.inseminations : [],
            notifications: Array.isArray(loadedState.notifications) ? loadedState.notifications : [],
            language: loadedState.language || 'en',
            isDarkMode: loadedState.isDarkMode ?? true,
            fontSize: loadedState.fontSize || 'medium',
            lastBackupTimestamp: loadedState.lastBackupTimestamp || 0,
            isOnboardingComplete: loadedState.isOnboardingComplete ?? true,
            customApiKey: loadedState.customApiKey || '',
            useCustomApiKey: loadedState.useCustomApiKey || false
        };

        resolve(sanitizedState);

      } catch (err: any) {
        console.error("Import parsing failed", err);
        reject(new Error(err.message || "Failed to read backup file."));
      }
    };

    reader.onerror = () => {
      reject(new Error("Error reading file from device storage."));
    };

    reader.readAsText(file);
  });
};
