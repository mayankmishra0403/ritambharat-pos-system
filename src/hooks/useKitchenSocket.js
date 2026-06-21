import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useKitchenSocket = (socket, restaurantId) => {
    const queryClient = useQueryClient();

    const playNewOrderSound = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();

            oscillator.connect(gain);
            gain.connect(ctx.destination);

            oscillator.frequency.setValueAtTime(800, ctx.currentTime);
            oscillator.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.3);
        } catch (e) {
        }
    }, []);

    useEffect(() => {
        if (!socket || !restaurantId) return;

        const handleNewOrder = (data) => {
            playNewOrderSound();
            queryClient.invalidateQueries({ queryKey: ['kds-orders', restaurantId] });
            queryClient.invalidateQueries({ queryKey: ['kds-notifications', restaurantId] });
        };

        const handleStatusUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ['kds-orders', restaurantId] });
            queryClient.invalidateQueries({ queryKey: ['kds-notifications', restaurantId] });
        };

        const handleOrderDeleted = () => {
            queryClient.invalidateQueries({ queryKey: ['kds-orders', restaurantId] });
        };

        socket.on('kds:new-order', handleNewOrder);
        socket.on('kds:status-update', handleStatusUpdate);
        socket.on('kds:order-deleted', handleOrderDeleted);
        socket.on('order:created', handleNewOrder);
        socket.on('order:status-changed', handleStatusUpdate);
        socket.on('order:cancelled', handleOrderDeleted);

        return () => {
            socket.off('kds:new-order', handleNewOrder);
            socket.off('kds:status-update', handleStatusUpdate);
            socket.off('kds:order-deleted', handleOrderDeleted);
            socket.off('order:created', handleNewOrder);
            socket.off('order:status-changed', handleStatusUpdate);
            socket.off('order:cancelled', handleOrderDeleted);
        };
    }, [socket, restaurantId, queryClient, playNewOrderSound]);
};
