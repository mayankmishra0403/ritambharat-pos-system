import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { useKitchenSocket } from '../../hooks/useKitchenSocket';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { ChefHat, CookingPot, CheckCheck, Bell, AlertCircle } from 'lucide-react';
import KanbanColumn from '../../components/kds/KanbanColumn';
import NewOrderSound from '../../components/kds/NewOrderSound';
import KitchenHeader from './KitchenHeader';

const STATUS_COLUMNS = {
    PENDING: {
        title: 'New Orders',
        icon: Bell,
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
        next: 'CONFIRMED'
    },
    CONFIRMED: {
        title: 'Confirmed',
        icon: ChefHat,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        next: 'PREPARING'
    },
    PREPARING: {
        title: 'Preparing',
        icon: CookingPot,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
        next: 'READY'
    },
    READY: {
        title: 'Ready to Serve',
        icon: CheckCheck,
        color: 'text-green-500',
        bg: 'bg-green-500/10',
        next: 'SERVED'
    }
};

const KitchenDisplay = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { socket, connected, joinRestaurant } = useSocket();
    const [restaurantId, setRestaurantId] = useState(null);
    const [fullscreen, setFullscreen] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(() => {
        return localStorage.getItem('kdsSound') !== 'false';
    });
    const [newOrderTrigger, setNewOrderTrigger] = useState(0);

    useEffect(() => {
        if (user?.restaurant) {
            const id = typeof user.restaurant === 'object' ? user.restaurant._id : user.restaurant;
            setRestaurantId(id);
            joinRestaurant(id);
        }
    }, [user, joinRestaurant]);

    useKitchenSocket(socket, restaurantId);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    useEffect(() => {
        localStorage.setItem('kdsSound', soundEnabled.toString());
    }, [soundEnabled]);

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (e) {
        }
    };

    const { data: ordersByStatus = {}, isLoading } = useQuery({
        queryKey: ['kds-orders', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return {};
            const res = await api.get(`/kds/orders?restaurantId=${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId,
        refetchInterval: 15000
    });

    const { data: notifications = [] } = useQuery({
        queryKey: ['kds-notifications', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return [];
            const res = await api.get(`/kds/notifications?restaurantId=${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId,
        refetchInterval: 30000
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => api.patch(`/kds/orders/${id}/status`, { status }),
        onMutate: async ({ id, status }) => {
            await queryClient.cancelQueries({ queryKey: ['kds-orders', restaurantId] });
            const previous = queryClient.getQueryData(['kds-orders', restaurantId]);

            queryClient.setQueryData(['kds-orders', restaurantId], (old) => {
                if (!old) return old;
                const updated = { ...old };

                for (const [key, orders] of Object.entries(updated)) {
                    updated[key] = orders.filter(o => o._id !== id);
                }

                const foundOrder = Object.values(old).flat().find(o => o._id === id);
                if (foundOrder && status !== 'SERVED' && status !== 'CANCELLED') {
                    if (!updated[status]) updated[status] = [];
                    updated[status] = [...updated[status], { ...foundOrder, status }];
                }

                return updated;
            });

            return { previous };
        },
        onError: (err, variables, context) => {
            queryClient.setQueryData(['kds-orders', restaurantId], context.previous);
            toast.error(err.response?.data?.message || 'Update failed');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['kds-orders', restaurantId] });
            queryClient.invalidateQueries({ queryKey: ['kds-notifications', restaurantId] });
        }
    });

    const markAllNotificationsRead = async () => {
        try {
            await Promise.all(
                notifications.filter(n => !n.isRead).map(n =>
                    api.patch(`/kds/notifications/${n._id}/read`)
                )
            );
            queryClient.invalidateQueries({ queryKey: ['kds-notifications', restaurantId] });
        } catch (e) {
        }
    };

    const stats = useMemo(() => {
        const allOrders = Object.values(ordersByStatus).flat() || [];
        const active = allOrders.length;
        const urgent = allOrders.filter(o => {
            const created = new Date(o.createdAt).getTime();
            return (Date.now() - created) > 15 * 60 * 1000;
        }).length;
        const ready = ordersByStatus.READY?.length || 0;
        return { active, urgent, ready };
    }, [ordersByStatus]);

    if (isLoading) {
        return (
            <div className="flex h-screen bg-background items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
                    <p className="text-sm text-muted-foreground">Loading Kitchen Display...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-background text-foreground flex-col overflow-hidden">
            <NewOrderSound play={newOrderTrigger > 0 && soundEnabled} />

            <KitchenHeader
                fullscreen={fullscreen}
                onToggleFullscreen={toggleFullscreen}
                soundEnabled={soundEnabled}
                onToggleSound={() => setSoundEnabled(!soundEnabled)}
                stats={stats}
                notifications={notifications}
                onMarkAllRead={markAllNotificationsRead}
                onLogout={logout}
                showBackButton={user?.role === 'OWNER' || user?.role === 'ADMIN'}
                onBackToPanel={() => navigate('/dashboard')}
            />

            <div className="flex-1 overflow-hidden p-3 sm:p-4 lg:p-6">
                <div className="h-full overflow-x-auto pb-2 custom-scrollbar">
                    <div className="flex flex-col sm:flex-row gap-4 h-full min-w-full sm:min-w-[700px] lg:min-w-0">
                        {Object.entries(STATUS_COLUMNS).map(([status, config]) => {
                            const columnOrders = ordersByStatus[status] || [];
                            const Icon = config.icon;

                            return (
                                <KanbanColumn
                                    key={status}
                                    title={config.title}
                                    icon={Icon}
                                    color={config.color}
                                    bgColor={config.bg}
                                    orders={columnOrders}
                                    nextStatus={config.next}
                                    onUpdateStatus={updateStatusMutation.mutate}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KitchenDisplay;
