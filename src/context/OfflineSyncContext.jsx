import { createContext, useContext, useEffect, useState } from 'react';
import { useOnline } from '../hooks/useOnline';
import api from '../config/api';
import toast from 'react-hot-toast';

const OfflineSyncContext = createContext();

export const OfflineSyncProvider = ({ children }) => {
    const isOnline = useOnline();
    const [queue, setQueue] = useState(() => {
        const saved = localStorage.getItem('ritam_bharat_pos_offline_queue');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('ritam_bharat_pos_offline_queue', JSON.stringify(queue));
    }, [queue]);

    // Attempt to sync when back online
    useEffect(() => {
        if (isOnline && queue.length > 0) {
            syncQueue();
        }
    }, [isOnline]);

    const syncQueue = async () => {
        const ordersToSync = [...queue];
        if (ordersToSync.length === 0) return;

        toast.loading(`Syncing ${ordersToSync.length} offline orders...`, { id: 'sync-orders' });

        let successCount = 0;
        const remainingQueue = [];

        for (const order of ordersToSync) {
            try {
                await api.post('/orders', order);
                successCount++;
            } catch (error) {
                console.error('Sync failed for order:', order, error);
                remainingQueue.push(order);
            }
        }

        setQueue(remainingQueue);

        if (successCount > 0) {
            toast.success(`${successCount} orders sent to kitchen!`, { id: 'sync-orders' });
        } else {
            toast.dismiss('sync-orders');
        }
    };

    const addToQueue = (orderData) => {
        setQueue(prev => [...prev, orderData]);
        toast.success("No internet! Your order is saved and will be sent automatically once you're back online.", {
            icon: '📶',
            duration: 5000
        });
    };

    return (
        <OfflineSyncContext.Provider value={{ isOnline, queue, addToQueue }}>
            {children}
            {/* Visual Indicator of Connection Status */}
            {!isOnline && (
                <div className="fixed top-0 left-0 right-0 z-[100] bg-orange-500 text-white text-[10px] py-1 text-center font-bold uppercase tracking-widest animate-pulse">
                    Offline Mode - Browsing Cached Menu
                </div>
            )}
        </OfflineSyncContext.Provider>
    );
};

export const useOfflineSync = () => useContext(OfflineSyncContext);
