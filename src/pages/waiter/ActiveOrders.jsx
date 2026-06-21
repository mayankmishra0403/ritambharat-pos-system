import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import { ArrowLeft, ChefHat, CookingPot, CheckCheck, Clock, XCircle } from 'lucide-react';

const STATUS_STYLES = {
    PENDING: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Pending' },
    ACCEPTED: { icon: ChefHat, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Confirmed' },
    PREPARING: { icon: CookingPot, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Preparing' },
    READY: { icon: CheckCheck, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Ready' },
    SERVED: { icon: CheckCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Served' },
    CANCELLED: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Cancelled' }
};

const ActiveOrders = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const restaurantId = typeof user?.restaurant === 'object' ? user.restaurant._id : user?.restaurant;

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['waiter-orders', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return [];
            const res = await api.get(`/waiter/orders?restaurantId=${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId,
        refetchInterval: 10000
    });

    const activeOrders = orders.filter(o =>
        ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status)
    );

    return (
        <div className="space-y-4">
            <button
                onClick={() => navigate('/waiter-app')}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft size={16} /> Back to Dashboard
            </button>

            <h2 className="text-lg font-bold text-foreground">Active Orders ({activeOrders.length})</h2>

            {isLoading ? (
                <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
                </div>
            ) : activeOrders.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground/50">
                    <CheckCheck size={48} className="mx-auto opacity-20 mb-3" />
                    <p className="text-sm font-medium">No active orders</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {activeOrders.map(order => {
                        const style = STATUS_STYLES[order.status] || STATUS_STYLES.PENDING;
                        const Icon = style.icon;

                        return (
                            <div
                                key={order._id}
                                onClick={() => navigate(`/waiter-app/order/${order._id}`)}
                                className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-all active:scale-[0.99]"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-foreground">#{order.orderNumber}</span>
                                        {order.table && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                                T{order.table?.name || ''}
                                            </span>
                                        )}
                                    </div>
                                    <div className={`flex items-center gap-1 text-xs font-bold ${style.color} ${style.bg} px-2 py-1 rounded-full`}>
                                        <Icon size={12} />
                                        {style.label}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                    {order.items?.slice(0, 4).map((item, idx) => (
                                        <span key={idx} className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                                            {item.quantity}x {item.name}
                                        </span>
                                    ))}
                                    {(order.items?.length || 0) > 4 && (
                                        <span className="text-xs text-muted-foreground">+{order.items.length - 4} more</span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                                    <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    <span className="font-bold">${order.total?.toFixed(2)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ActiveOrders;
