// src/utils/notifications.js

import apiClient from '../services/apiClient';

const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

export const subscribeUserToPush = async (VAPID_PUBLIC_KEY) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push messaging is not supported.');
        return;
    }

    try {
        const registration = await navigator.serviceWorker.register('/service-worker.js',{
            scope:'/'
        });

        console.log('Service Worker registered.');

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        // Send the subscription to your backend
        await apiClient.post('/notifications/subscribe', subscription);
        console.log('Push subscription saved to server.');
        return true;
    } catch (error) {
        console.error('Push subscription failed:', error);
        return false;
    }
};