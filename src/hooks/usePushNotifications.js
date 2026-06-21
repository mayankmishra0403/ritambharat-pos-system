import { useState, useEffect, useCallback } from 'react';
import api from '../config/api';

export const usePushNotifications = () => {
    const [permissionStatus, setPermissionStatus] = useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'denied'
    );
    const [subscribed, setSubscribed] = useState(false);
    const [vapidPublicKey, setVapidPublicKey] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchVapidKey = async () => {
            try {
                const res = await api.get('/push/vapid-public-key');
                setVapidPublicKey(res.data.data.publicKey);
            } catch (e) {}
        };
        fetchVapidKey();
    }, []);

    useEffect(() => {
        const checkExisting = async () => {
            if (!('serviceWorker' in navigator)) return;
            try {
                const registration = await navigator.serviceWorker.ready;
                const sub = await registration.pushManager.getSubscription();
                setSubscribed(!!sub);
            } catch (e) {}
        };
        checkExisting();
    }, []);

    const subscribe = useCallback(async () => {
        if (!('Notification' in window) || !('serviceWorker' in navigator) || !vapidPublicKey) return;

        setLoading(true);
        try {
            if (Notification.permission === 'denied') {
                setPermissionStatus('denied');
                return;
            }

            let permission = Notification.permission;
            if (permission === 'default') {
                permission = await Notification.requestPermission();
                setPermissionStatus(permission);
            }

            if (permission !== 'granted') return;

            const registration = await navigator.serviceWorker.ready;
            const existing = await registration.pushManager.getSubscription();
            if (existing) {
                const subJson = existing.toJSON();
                try {
                    await api.post('/push/subscribe', { subscription: subJson });
                } catch (e) {}
                setSubscribed(true);
                return;
            }

            const key = urlBase64ToUint8Array(vapidPublicKey);
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: key,
            });

            const subJson = subscription.toJSON();
            await api.post('/push/subscribe', { subscription: subJson });
            setSubscribed(true);
        } catch (e) {
            console.error('Push subscribe error:', e);
        } finally {
            setLoading(false);
        }
    }, [vapidPublicKey]);

    const unsubscribe = useCallback(async () => {
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const existing = await registration.pushManager.getSubscription();
            if (existing) {
                const endpoint = existing.endpoint;
                await existing.unsubscribe();
                try {
                    await api.post('/push/unsubscribe', { endpoint });
                } catch (e) {}
            }
            setSubscribed(false);
        } catch (e) {
            console.error('Push unsubscribe error:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    return { permissionStatus, subscribed, loading, subscribe, unsubscribe };
};

const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(ch => ch.charCodeAt(0)));
};
