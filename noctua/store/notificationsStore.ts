import { create } from 'zustand';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
}

interface NotificationsState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) =>
    set((state: NotificationsState) => {
      const newNotification: Notification = {
        ...notification,
        id: Math.random().toString(36).substring(7),
        timestamp: new Date(),
      };
      // Keep only last 3 notifications
      const updatedNotifications = [newNotification, ...state.notifications].slice(0, 3);
      return { notifications: updatedNotifications };
    }),
  removeNotification: (id: string) =>
    set((state: NotificationsState) => ({
      notifications: state.notifications.filter((n: Notification) => n.id !== id),
    })),
  clearNotifications: () => set({ notifications: [] }),
}));
