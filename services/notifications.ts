
import { LocalNotifications } from '@capacitor/local-notifications';
import { InseminationRecord } from '../types';

// Constants for Notification IDs
const ID_DAILY_MORNING = 1001;
const ID_DAILY_EVENING = 1002;

export const NotificationService = {
  
  async requestPermissions() {
    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (e) {
      console.error("Notification permission error", e);
      return false;
    }
  },

  async createChannels() {
    // Required for Android 8.0+ (API 26+)
    try {
      await LocalNotifications.createChannel({
        id: 'daily_updates',
        name: 'Daily Updates',
        description: 'Reminders for morning and evening milk delivery routes',
        importance: 5, // 5 = Max (Heads-up)
        visibility: 1, // 1 = Public
        vibration: true,
        sound: 'default'
      });
      
      await LocalNotifications.createChannel({
        id: 'cattle_alerts',
        name: 'Cattle Alerts',
        description: 'Important alerts for cattle gestation and calving dates',
        importance: 5, 
        visibility: 1,
        vibration: true,
      });
    } catch (e) {
      console.error("Channel creation failed", e);
    }
  },

  async scheduleDailyReminders(schedule?: { morning: string, evening: string }) {
    try {
      await this.createChannels();

      // Parse times or use defaults
      const mTime = schedule?.morning ? schedule.morning.split(':') : ['08', '00'];
      const eTime = schedule?.evening ? schedule.evening.split(':') : ['19', '00'];

      const morningHour = parseInt(mTime[0]);
      const morningMin = parseInt(mTime[1]);
      const eveningHour = parseInt(eTime[0]);
      const eveningMin = parseInt(eTime[1]);

      // Cancel existing to update time
      await LocalNotifications.cancel({ notifications: [{ id: ID_DAILY_MORNING }, { id: ID_DAILY_EVENING }] });

      const notifications = [];

      notifications.push({
        id: ID_DAILY_MORNING,
        title: "☀️ Morning Route",
        body: "Time for morning deliveries. Update the records!",
        schedule: { 
          on: { hour: morningHour, minute: morningMin },
          allowWhileIdle: true 
        },
        channelId: 'daily_updates',
        iconColor: '#84cc16', // Lime 500
        actionTypeId: "",
        extra: { type: 'daily_reminder', slot: 'morning' }
      });

      notifications.push({
        id: ID_DAILY_EVENING,
        title: "🌙 Evening Route",
        body: "Evening shift started. Mark your deliveries.",
        schedule: { 
          on: { hour: eveningHour, minute: eveningMin },
          allowWhileIdle: true
        },
        channelId: 'daily_updates',
        iconColor: '#84cc16', // Lime 500
        actionTypeId: "",
        extra: { type: 'daily_reminder', slot: 'evening' }
      });

      await LocalNotifications.schedule({ notifications });
      console.log(`Daily reminders scheduled: Morning ${morningHour}:${morningMin}, Evening ${eveningHour}:${eveningMin}`);
      
    } catch (e) {
      console.error("Failed to schedule daily reminders", e);
    }
  },

  async scheduleCattleAlert(cow: InseminationRecord) {
    try {
      await this.createChannels();

      const insemDate = new Date(cow.inseminationDate);
      const dueDate = new Date(insemDate);
      dueDate.setDate(insemDate.getDate() + 283);

      const alerts = [
        { daysBefore: 15, title: "🐮 Cattle Alert: 15 Days Left" },
        { daysBefore: 3, title: "🚨 Cattle Alert: 3 Days Left!" }
      ];

      const notifications = [];
      const now = new Date();

      alerts.forEach(alert => {
        const alertDate = new Date(dueDate);
        alertDate.setDate(dueDate.getDate() - alert.daysBefore);
        alertDate.setHours(9, 0, 0, 0); // 9 AM
        
        if (alertDate > now) {
          const baseId = parseInt(cow.id.slice(-5)) || Math.floor(Math.random() * 10000);
          const notifId = baseId + alert.daysBefore;

          notifications.push({
            id: notifId,
            title: alert.title,
            body: `${cow.cowName} (${cow.cowColor}) is due for calving on ${dueDate.toDateString()}.`,
            schedule: { at: alertDate, allowWhileIdle: true },
            channelId: 'cattle_alerts',
            iconColor: '#ef4444', // Red 500
            extra: { type: 'cattle_alert', cowId: cow.id }
          });
        }
      });

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
      }

    } catch (e) {
      console.error("Failed to schedule cattle alert", e);
    }
  }
};
