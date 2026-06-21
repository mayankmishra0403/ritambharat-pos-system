import { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
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

    useEffect(() => {
        if (!socket) return;

        socket.on('order:created', () => {
            toast.success('New order placed');
        });
        socket.on('order:status-changed', () => {
            toast.success('Order status updated');
        });
        socket.on('waiter:order-ready', (data) => {
            toast.success(`Order #${data.orderNumber} is ready to serve!`);
        });

        return () => {
            socket.off('order:created');
            socket.off('order:status-changed');
            socket.off('waiter:order-ready');
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
        </div>
    );
};

export default WaiterDashboard;
