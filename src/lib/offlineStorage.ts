/**
 * offlineStorage.ts
 * Browser internal storage engine & offline synchronization manager for SabanOS.
 * Provides resilient offline caching for Orders, Delivery Notes, Driver ID and dispatch queue.
 */

import { useState, useEffect } from 'react';
import { DriverProfile } from '../types';

export const DEFAULT_DRIVER_PROFILE: DriverProfile = {
  id: 'DRV-1024',
  fullName: 'חכמת עלי סבן',
  idNumber: '028945612',
  driverLicense: '9120485',
  licenseType: 'C (משא מעל 15 טון + היתר מנוף חלוקה)',
  truckNumber: '48-291-74',
  truckType: 'משאית מנוף 🏗️',
  phone: '050-8868010',
  warehouse: 'החרש',
  bloodType: 'O+',
  emergencyContactName: 'מוקד סבן לוגיסטיקה / סדרן ראשי',
  emergencyContactPhone: '03-9620049',
  safetyCertificateExpiry: '2027-12-31',
  hazardousMaterialsPermit: true,
  craneOperatorPermit: true,
  issuedDate: '2026-01-15',
  barcodeValue: 'SABAN-DRV-1024-4829174'
};

const STORAGE_KEYS = {
  ORDERS: 'saban_orders_v2',
  DELIVERY_NOTES: 'saban_delivery_notes_v2',
  DRIVER_PROFILE: 'saban_driver_id_profile_v1',
  OFFLINE_QUEUE: 'saban_offline_sync_queue_v1',
  LAST_OFFLINE_TIMESTAMP: 'saban_last_offline_time_v1',
  THEME_MODE: 'saban_theme_whatsapp_mode'
};

export class OfflineStorageEngine {
  // 1. Driver Digital ID Profile
  static getDriverProfile(): DriverProfile {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DRIVER_PROFILE);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Error loading driver profile from storage:', e);
    }
    return DEFAULT_DRIVER_PROFILE;
  }

  static saveDriverProfile(profile: DriverProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DRIVER_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.warn('Error saving driver profile to storage:', e);
    }
  }

  // 2. Offline Queue for mutation sync
  static getOfflineQueue(): Array<{ id: string; type: string; payload: any; timestamp: string }> {
    try {
      const queue = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      return queue ? JSON.parse(queue) : [];
    } catch (e) {
      return [];
    }
  }

  static addToOfflineQueue(type: string, payload: any): void {
    try {
      const queue = this.getOfflineQueue();
      queue.push({
        id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type,
        payload,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
      localStorage.setItem(STORAGE_KEYS.LAST_OFFLINE_TIMESTAMP, new Date().toISOString());
    } catch (e) {
      console.warn('Error adding to offline queue:', e);
    }
  }

  static clearOfflineQueue(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
    } catch (e) {
      console.warn('Error clearing offline queue:', e);
    }
  }

  // 3. Storage Diagnostics
  static getStorageStats() {
    let ordersCount = 0;
    let notesCount = 0;
    let queueLength = 0;

    try {
      const orders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (orders) ordersCount = JSON.parse(orders).length;
      const notes = localStorage.getItem(STORAGE_KEYS.DELIVERY_NOTES);
      if (notes) notesCount = JSON.parse(notes).length;
      queueLength = this.getOfflineQueue().length;
    } catch (e) {}

    return {
      ordersCount,
      notesCount,
      queueLength,
      hasOfflineQueue: queueLength > 0,
      isLocalStorageAvailable: typeof window !== 'undefined' && !!window.localStorage
    };
  }
}

/**
 * Hook to track live online/offline network status
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [pendingQueueCount, setPendingQueueCount] = useState<number>(() => {
    return OfflineStorageEngine.getOfflineQueue().length;
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setPendingQueueCount(OfflineStorageEngine.getOfflineQueue().length);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setPendingQueueCount(OfflineStorageEngine.getOfflineQueue().length);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check on storage queue length
    const interval = setInterval(() => {
      setPendingQueueCount(OfflineStorageEngine.getOfflineQueue().length);
    }, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return { isOnline, pendingQueueCount };
}
