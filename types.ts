
export type Language = 'en' | 'hi';
export type AppView = 'dashboard' | 'customers' | 'cattle' | 'settings' | 'customer-detail';

export interface BusinessProfile {
  businessName: string;
  businessNameHi?: string;
  ownerName: string;
  address: string;
  phone: string;
  email?: string;
}

export interface Customer {
  id: string;
  name: string;
  nameHi?: string;
  phone: string;
  address: string;
  defaultQty: number; // in Liters/KG per delivery
  ratePerKg: number;
  isActive: boolean;
  preferredTime: 'morning' | 'evening' | 'both'; 
  behavior: 'very_good' | 'good' | 'ok' | 'bad'; 
  createdAt: number;
}

export interface MilkEntry {
  id: string;
  customerId: string;
  date: string; // ISO YYYY-MM-DD
  quantity: number;
  isDelivered: boolean;
  slot?: 'morning' | 'evening';
  note?: string; 
  timestamp: number;
}

export interface Payment {
  id: string;
  customerId: string;
  amount: number;
  date: string;
  type: 'cash' | 'online';
  note?: string;
}

export interface InseminationRecord {
  id: string;
  cowName: string;
  cowColor: string;
  inseminationDate: string; // YYYY-MM-DD
  note?: string;
  timestamp: number;
}

export interface AppNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: number;
  read: boolean;
}

export interface InvoiceData {
  customer: Customer;
  businessDetails: BusinessProfile;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  items: {
    description: string;
    rate: string;
    qty: string;
    total: number;
  }[];
  totals: {
    subtotal: number;
    previousDue: number;
    paid: number;
    grandTotal: number;
  };
}

export interface AppState {
  businessProfile: BusinessProfile;
  customers: Customer[];
  entries: MilkEntry[];
  payments: Payment[];
  inseminations: InseminationRecord[];
  notifications: AppNotification[];
  language: Language;
  isDarkMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
  lastBackupTimestamp?: number; 
  isOnboardingComplete: boolean;
  customApiKey?: string;
  useCustomApiKey?: boolean;
}
