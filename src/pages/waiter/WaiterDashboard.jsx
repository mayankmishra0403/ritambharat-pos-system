import { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { useSoundAlert } from '../../hooks/useSoundAlert';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import PWAInstallPrompt from '../../components/common/PWAInstallPrompt';
import api from '../../config/api';
import {
    UtensilsCrossed, ShoppingBag, Clock, ChevronRight, LogOut, Bell
} from 'lucide-react';
import toast from 'react-hot-toast';

const WaiterDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { socket, connected, joinRestaurant } = useSocket();
    const [restaurantId, setRestaurantId] = useState(null);

    useEffect(() => {
        if (user?.restaurant) {
            const id = typeof user.restaurant === 'object' ? user.restaurant._id : user.restaurant;
            setRestaurantId(id);
            joinRestaurant(id);
        }
    }, [user, joinRestaurant]);

    const { permissionStatus, subscribed, loading, subscribe, unsubscribe } = usePushNotifications();

    const handleBellClick = async () => {
        if (loading) return;
        if (subscribed) {
            await unsubscribe();
            toast.success('Notifications disabled');
        } else {
            if (permissionStatus === 'denied') {
                toast.error('Notifications blocked — enable in browser settings');
                return;
            }
            await subscribe();
            if (Notification.permission === 'granted') {
                toast.success('Notifications enabled');
            }
        }
    };

    const { data: tables = [] } = useQuery({
        queryKey: ['waiter-tables', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return [];
            const res = await api.get(`/waiter/tables?restaurantId=${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId,
        refetchInterval: 30000
    });

    const { data: activeOrders = [] } = useQuery({
        queryKey: ['waiter-orders', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return [];
            const res = await api.get(`/waiter/orders?restaurantId=${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId,
        refetchInterval: 10000
    });

    useSoundAlert(socket, restaurantId, {
        event: 'order:created',
        soundProfile: 'new-order',
    });

    useSoundAlert(socket, restaurantId, {
        event: 'service:new',
        soundProfile: 'waiter-call',
        onAlert: (data) => {
            const tableName = data.tableName || data.table?.name || 'a table';
            const requestType = (data.type || data.request?.type || '').replace(/_/g, ' ');
            toast.custom(
                (t) => (
                    <div className="bg-card border border-orange-500/30 rounded-xl p-4 shadow-xl max-w-xs">
                        <p className="font-bold text-orange-500 text-sm uppercase tracking-wider">
                            {requestType || 'Service Request'}
                        </p>
                        <p className="text-foreground font-semibold mt-1">{data.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">Table: {tableName}</p>
                    </div>
                ),
                { duration: 5000, position: 'top-center' }
            );
        },
    });

    useSoundAlert(socket, restaurantId, {
        event: 'waiter:order-ready',
        soundProfile: 'new-order',
        onAlert: (data) => {
            toast.success(`Order #${data.orderNumber} is ready to serve!`, { duration: 5000 });
        },
    });

    useSoundAlert(socket, restaurantId, {
        event: 'complaint:new',
        soundProfile: 'waiter-call',
        onAlert: (data) => {
            toast.error(data.message || 'New complaint received', { duration: 5000 });
        },
    });

    useEffect(() => {
        if (!socket) return;

        socket.on('order:status-changed', () => {
            toast.success('Order status updated');
        });
        socket.on('order:cancelled', () => {
            toast.error('An order was cancelled');
        });
        socket.on('order:paid', () => {
            toast.success('Payment received for an order');
        });

        return () => {
            socket.off('order:status-changed');
            socket.off('order:cancelled');
            socket.off('order:paid');
        };
    }, [socket]);

    const activeCount = activeOrders.filter(o =>
        ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status)
    ).length;

    const occupiedTables = tables.filter(t => t.status === 'OCCUPIED').length;
    const freeTables = tables.filter(t => t.status === 'FREE').length;

    const isHome = location.pathname === '/waiter-app';

    return (
        <div className="min-h-screen bg-background max-w-lg mx-auto">
            <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <UtensilsCrossed size={20} className="text-primary" />
                    <span className="font-bold text-foreground">Waiter App</span>
                    {connected && (
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{user?.name}</span>
                    <button
                        onClick={handleBellClick}
                        disabled={loading}
                        className="p-1.5 rounded-lg transition-colors relative disabled:opacity-50"
                        title={
                            subscribed ? 'Notifications on — tap to disable' :
                            permissionStatus === 'denied' ? 'Notifications blocked' :
                            'Enable notifications'
                        }
                    >
                        <Bell size={16} className={
                            subscribed ? 'text-green-500' :
                            permissionStatus === 'denied' ? 'text-red-500/50' :
                            'text-muted-foreground hover:text-foreground'
                        } />
                        {loading && (
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        )}
                        {subscribed && !loading && (
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full" />
                        )}
                        {permissionStatus === 'denied' && !loading && (
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                        )}
                    </button>
                    <button
                        onClick={logout}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>

            {isHome && (
                <div className="p-4 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-card border border-border p-4 rounded-xl text-center">
                            <p className="text-2xl font-bold text-foreground">{activeCount}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Active Orders</p>
                        </div>
                        <div className="bg-card border border-border p-4 rounded-xl text-center">
                            <p className="text-2xl font-bold text-red-500">{occupiedTables}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Occupied</p>
                        </div>
                        <div className="bg-card border border-border p-4 rounded-xl text-center">
                            <p className="text-2xl font-bold text-green-500">{freeTables}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Free</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => navigate('/waiter-app/order/new')}
                            className="p-6 bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-2xl text-left hover:shadow-lg transition-all active:scale-[0.98]"
                        >
                            <ShoppingBag size={28} className="text-primary mb-3" />
                            <p className="font-bold text-foreground">New Order</p>
                            <p className="text-xs text-muted-foreground mt-1">Dine-in or Takeaway</p>
                        </button>

                        <button
                            onClick={() => navigate('/waiter-app/orders')}
                            className="p-6 bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/20 rounded-2xl text-left hover:shadow-lg transition-all active:scale-[0.98]"
                        >
                            <Bell size={28} className="text-orange-500 mb-3" />
                            <p className="font-bold text-foreground">Active Orders</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {activeCount > 0 ? `${activeCount} orders to track` : 'No active orders'}
                            </p>
                        </button>
                    </div>

                    {activeOrders.filter(o => o.status === 'READY').length > 0 && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock size={16} className="text-green-500" />
                                <span className="font-bold text-sm text-green-500">Ready to Serve</span>
                            </div>
                            {activeOrders.filter(o => o.status === 'READY').map(order => (
                                <div
                                    key={order._id}
                                    onClick={() => navigate(`/waiter-app/order/${order._id}`)}
                                    className="flex items-center justify-between py-2 border-b border-green-500/10 last:border-0 cursor-pointer hover:bg-green-500/5 rounded px-2 -mx-2 transition-colors"
                                >
                                    <div>
                                        <span className="text-sm font-bold text-foreground">#{order.orderNumber}</span>
                                        {order.table && (
                                            <span className="text-xs text-muted-foreground ml-2">T{table.table?.name || order.table}</span>
                                        )}
                                    </div>
                                    <ChevronRight size={16} className="text-muted-foreground" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className={isHome ? 'hidden' : 'p-4'}>
                <Outlet context={{ restaurantId, tables }} />
            </div>

            <PWAInstallPrompt />
        </div>
    );
};

export default WaiterDashboard;
