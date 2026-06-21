import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

export const useSocket = () => {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [currentRestaurantId, setCurrentRestaurantId] = useState(null);
    const [currentOrderId, setCurrentOrderId] = useState(null);

    useEffect(() => {
        const socketInstance = io(SOCKET_URL, {
            autoConnect: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10, // Increased attempts
        });

        socketInstance.on('connect', () => {
            console.log('Socket connected:', socketInstance.id);
            setConnected(true);

            // Auto-rejoin rooms on reconnection
            if (currentRestaurantId) {
                socketInstance.emit('join:restaurant', currentRestaurantId);
                console.log('Auto-rejoined restaurant:', currentRestaurantId);
            }
            if (currentOrderId) {
                socketInstance.emit('join:order', currentOrderId);
                console.log('Auto-rejoined order:', currentOrderId);
            }
        });

        socketInstance.on('disconnect', () => {
            console.log('Socket disconnected');
            setConnected(false);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [currentRestaurantId, currentOrderId]); // Re-bind listeners if IDs change

    const joinRestaurant = (idOrObject) => {
        const restaurantId = idOrObject?._id || idOrObject;
        if (restaurantId && typeof restaurantId === 'string') {
            setCurrentRestaurantId(restaurantId);
            if (socket?.connected) {
                socket.emit('join:restaurant', restaurantId);
            }
        }
    };

    const joinOrder = (orderId) => {
        if (orderId) {
            setCurrentOrderId(orderId);
            if (socket?.connected) {
                socket.emit('join:order', orderId);
            }
        }
    };

    return {
        socket,
        connected,
        joinRestaurant,
        joinOrder,
    };
};
