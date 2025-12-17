
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
        importance: 4, // High importance
        visibility: 1,
        vibration: true,
      });
      
      await LocalNotifications.createChannel({
        id: 'cattle_alerts',
        name: 'Cattle Alerts',
        description: 'Important alerts for cattle gestation and calving dates',
        importance: 5, // Max importance
        visibility: 1,
        vibration: true,
      });
    } catch (e) {
      console.error("Channel creation failed", e);
    }
  },

  async scheduleDailyReminders() {
    try {
      // Create channels first
      await this.createChannels();

      // Check if already scheduled to avoid duplicates
      const pending = await LocalNotifications.getPending();
      const hasMorning = pending.notifications.some(n => n.id === ID_DAILY_MORNING);
      const hasEvening = pending.notifications.some(n => n.id === ID_DAILY_EVENING);

      const notifications = [];

      if (!hasMorning) {
        notifications.push({
          id: ID_DAILY_MORNING,
          title: "☀️ Morning Route",
          body: "Don't forget to update the morning delivery status.",
          schedule: { 
            on: { hour: 9, minute: 0 },
            allowWhileIdle: true 
          },
          channelId: 'daily_updates',
          actionTypeId: "",
          extra: { type: 'daily_reminder', slot: 'morning' }
        });
      }

      if (!hasEvening) {
        notifications.push({
          id: ID_DAILY_EVENING,
          title: "🌙 Evening Route",
          body: "Evening deliveries pending? Mark them now.",
          schedule: { 
            on: { hour: 19, minute: 0 },
            allowWhileIdle: true
          },
          channelId: 'daily_updates',
          actionTypeId: "",
          extra: { type: 'daily_reminder', slot: 'evening' }
        });
      }

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
        console.log("Daily reminders scheduled via AlarmManager");
      }
    } catch (e) {
      console.error("Failed to schedule daily reminders", e);
    }
  },

  async scheduleCattleAlert(cow: InseminationRecord) {
    try {
      const insemDate = new Date(cow.inseminationDate);
      // Cow gestation is ~283 days
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
        // Set specific time for alert (e.g., 10 AM)
        alertDate.setHours(10, 0, 0, 0);
        
        // Only schedule if the date is in the future
        if (alertDate > now) {
          // Generate a unique ID based on cow ID and alert type
          // Simple hash: last 6 digits of cow ID + daysBefore
          const baseId = parseInt(cow.id.slice(-5)) || Math.floor(Math.random() * 10000);
          const notifId = baseId + alert.daysBefore;

          notifications.push({
            id: notifId,
            title: alert.title,
            body: `${cow.cowName} (${cow.cowColor}) is due for calving on ${dueDate.toDateString()}.`,
            schedule: { at: alertDate, allowWhileIdle: true },
            channelId: 'cattle_alerts',
            extra: { type: 'cattle_alert', cowId: cow.id }
          });
        }
      });

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
        console.log(`Scheduled ${notifications.length} alerts for ${cow.cowName}`);
      }

    } catch (e) {
      console.error("Failed to schedule cattle alert", e);
    }
  }
};
