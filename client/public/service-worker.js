// client/public/service-worker.js

self.addEventListener('push', event => {
    const data = event.data.json();
    
    // Default data structure for notification
    const options = {
        body: data.body,
        icon: '/vite-logo.svg', // Use a small icon from your public folder
        vibrate: [100, 50, 100],
        data: {
            url: data.url // URL to open on click
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();

    // Focus on the existing window or open a new one to navigate to the URL
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            const urlToOpen = event.notification.data.url || '/dashboard';

            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.endsWith(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            // If no window is found, open a new one
            return clients.openWindow(urlToOpen);
        })
    );
});