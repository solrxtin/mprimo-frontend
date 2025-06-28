"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useUserStore } from '@/stores/useUserStore';
import socketService from '@/utils/socketService';

interface Notification {
  id: string;
  title: string;
  body: string;
  data?: any;
  read: boolean;
  timestamp: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useUserStore();
  
  // Use the initialized socket from socketService
  useEffect(() => {
    if (user?._id) {
      // Get the socket instance from socketService
      const socketInstance = socketService.connect(user._id);
      setSocket(socketInstance);
      
      // Join notification room for this user
      socketService.joinRoom(`notifications-${user._id}`);
      
      return () => {
        socketService.leaveRoom(`notifications-${user._id}`);
        // Note: We don't disconnect here as the socket is managed by socketService
      };
    }
  }, [user]);
  
  // Listen for notifications
  useEffect(() => {
    if (!socket) return;
    
    const handleNotification = (notification: any) => {
      // Add new notification to state
      setNotifications(prev => [
        {
          id: Math.random().toString(36).substring(2, 9),
          ...notification,
          read: false,
          timestamp: new Date(notification.timestamp || Date.now())
        },
        ...prev
      ]);
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        const browserNotification = new Notification(notification.title, {
          body: notification.body,
          icon: '/logo192.png'
        });
        
        // Handle click on notification
        browserNotification.onclick = () => {
          window.focus();
          if (notification.data?.url) {
            window.location.href = notification.data.url;
          }
        };
      }
    };
    
    // Listen for notification events
    socket.on('notification', handleNotification);
    
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket]);
  
  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };
  
  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };
  
  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
