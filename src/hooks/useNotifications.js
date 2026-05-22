import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import {
  requestNotificationPermission,
  setupMessageListener,
  saveFCMTokenToBackend,
  removeFCMTokenFromBackend
} from '../config/firebase';

export const useNotifications = (authToken) => {
  const fcmTokenRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!authToken || initializedRef.current) return;

    const init = async () => {
      try {
        initializedRef.current = true;

        // Get FCM token (also registers service worker internally)
        const token = await requestNotificationPermission();

        if (!token) {
          console.warn('Could not get FCM token');
          return;
        }

        fcmTokenRef.current = token;

        // Save to backend
        const saveResult = await saveFCMTokenToBackend(token, authToken);
        if (saveResult?.success) {
          console.log('✅ FCM token saved to backend');
        }

        // Listen for foreground messages — show toast + browser notification
        setupMessageListener((notification) => {
          console.log('🔔 New notification:', notification);

          // Show toast in UI
          toast.info(
            `${notification.title}\n${notification.body}`,
            {
              position: 'top-right',
              autoClose: 6000,
              onClick: () => {
                if (notification.data?.bookingId) {
                  window.location.href = '/dashboard/bookings';
                }
              }
            }
          );
        });

        console.log('✅ Notifications initialized successfully');
      } catch (error) {
        console.error('Error initializing notifications:', error);
        initializedRef.current = false;
      }
    };

    init();

    return () => {
      if (fcmTokenRef.current && authToken) {
        removeFCMTokenFromBackend(fcmTokenRef.current, authToken).catch(() => {});
      }
    };
  }, [authToken]);
};

export default useNotifications;
