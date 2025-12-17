
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
const BACKUP_FOLDER = "Shree_Dairy_Backups";

// Helper: Ensure backup directory exists
const ensureBackupDir = async () => {
  try {
    await Filesystem.mkdir({
      path: BACKUP_FOLDER,
      directory: Directory.Documents,
      recursive: true // Create parent if needed
    });
  } catch (e) {
    // Ignore error if folder already exists
  }
};

/**
 * Saves a backup to the Public Documents folder.
 * This file will survive app uninstall.
 */
export const saveToPublicStorage = async (state: AppState, isAuto = false): Promise<string> => {
  try {
    if (!Capacitor.isNativePlatform()) return '';

    await ensureBackupDir();

    const backup: BackupData = {
      meta: {
        version: CURRENT_SCHEMA_VERSION,
        appName: APP_SIGNATURE,
        timestamp: Date.now(),
        date: new Date().toLocaleString()
      },
      data: state
    };

    // Filename: Shree_AutoBackup_2023-10-25.json OR Shree_Backup_169...json
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = isAuto 
      ? `${BACKUP_FOLDER}/Shree_AutoBackup_${dateStr}.json`
      : `${BACKUP_FOLDER}/Shree_Backup_${dateStr}_${Date.now().toString().slice(-4)}.json`;

    const dataStr = JSON.stringify(backup, null, 2);

    const result = await Filesystem.writeFile({
      path: fileName,
      data: dataStr,
      directory: Directory.Documents,
      encoding: Encoding.UTF8
    });

    console.log(`Backup saved to ${fileName}`);
    return result.uri;

  } catch (error) {
    console.error("Public storage save failed", error);
    throw new Error("Failed to save to public storage.");
  }
};

/**
 * Scans the Documents/Shree_Dairy_Backups folder for files.
 * Used to restore data after reinstall.
 */
export const findPublicBackups = async (): Promise<string[]> => {
  try {
    if (!Capacitor.isNativePlatform()) return [];

    const result = await Filesystem.readdir({
      path: BACKUP_FOLDER,
      directory: Directory.Documents
    });

    // Return list of filenames
    return result.files.map(f => f.name).filter(name => name.endsWith('.json'));

  } catch (e) {
    console.log("No public backups found or permission denied");
    return [];
  }
};

/**
 * Loads a specific backup file from the public folder.
 */
export const loadPublicBackup = async (filename: string): Promise<AppState> => {
    try {
        const result = await Filesystem.readFile({
            path: `${BACKUP_FOLDER}/${filename}`,
            directory: Directory.Documents,
            encoding: Encoding.UTF8
        });

        const parsed = JSON.parse(result.data as string);
        if (!parsed.meta || !parsed.data) throw new Error("Invalid structure");
        
        return parsed.data; // Return the State object
    } catch (e) {
        console.error("Failed to load public backup", e);
        throw e;
    }
}

/**
 * Standard Export (Share Sheet)
 */
export const exportBackup = async (state: AppState): Promise<void> => {
  try {
    // First, save to public storage so we have a copy
    const publicUri = await saveToPublicStorage(state, false);

    if (Capacitor.isNativePlatform()) {
        await Share.share({
            title: 'Export Backup',
            text: 'Keep this file safe to restore your data later.',
            url: publicUri,
            dialogTitle: 'Save Backup File'
        });
    } else {
        // Web Fallback
        const dataStr = JSON.stringify({ meta: { version: 1, appName: APP_SIGNATURE }, data: state }, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Shree_Backup_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  } catch (error) {
    console.error("Export failed", error);
    throw new Error("Failed to generate backup file.");
  }
};

/**
 * File Picker Import
 */
export const importBackup = async (file: File): Promise<AppState> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileContent = event.target?.result as string;
        const parsed = JSON.parse(fileContent);
        if (!parsed.meta || !parsed.data) throw new Error("Invalid backup format.");
        resolve(parsed.data);
      } catch (err: any) {
        reject(new Error("Invalid file."));
      }
    };
    reader.readAsText(file);
  });
};
