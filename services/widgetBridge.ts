
import { Preferences } from '@capacitor/preferences';

const WIDGET_DATA_KEY = 'shree_widget_data_v1';

export interface WidgetData {
  updatedAt: number;
  highDues: { name: string; amount: number }[];
  routeStats: {
    pending: number;
    total: number;
    slot: string; // 'Morning' or 'Evening'
  };
}

export const updateWidgetData = async (data: WidgetData) => {
  try {
    await Preferences.set({
      key: WIDGET_DATA_KEY,
      value: JSON.stringify(data)
    });
    // Note: In a full native project, we would invoke a Capacitor Plugin call here
    // to trigger the AppWidgetManager update intent. 
    // Since this is a pure web bridge, we persist the data so the native widget 
    // (if installed) can poll or read this SharedPreference on its next update cycle.
    console.log('Widget Data Synced', data);
  } catch (e) {
    console.error('Failed to sync widget data', e);
  }
};
