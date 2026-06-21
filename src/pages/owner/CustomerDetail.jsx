import { useQuery } from '@tanstack/react-query';
import api from '../../config/api';
import { ArrowLeft, Clock, ShoppingBag, ChefHat, CheckCheck } from 'lucide-react';
import CustomerProfile from '../../components/crm/CustomerProfile';

const STATUS_ICONS = {
    PENDING: Clock,
    ACCEPTED: ChefHat,
    PREPARING: ChefHat,
    READY: CheckCheck,
    SERVED: CheckCheck,
    CANCELLED: Clock
};

const STATUS_COLORS = {
    PENDING: 'text-yellow-500',
    ACCEPTED: 'text-blue-500',
    PREPARING: 'text-orange-500',
    READY: 'text-green-500',
    SERVED: 'text-green-500',
    CANCELLED: 'text-red-500'
};

const CustomerDetail = ({ customer, restaurantId, onBack }) => {
    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['customer-orders', customer.phone || customer._id, restaurantId],
        queryFn: async () => {
            const id = customer.phone || customer._id;
            const res = await api.get(`/customers/${encodeURIComponent(id)}/orders?restaurantId=${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId && !!(customer.phone || customer._id)
    });

    return (
        <div>
            <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
                <ArrowLeft size={16} />
                Back to Customers
            </button>

            <CustomerProfile customer={customer} />

            <h3 className="font-bold text-foreground mt-6 mb-3 flex items-center gap-2">
                <ShoppingBag size={16} />
                Order History ({orders.length})
            </h3>

            {isLoading && (
                <div className="text-center py-8 text-sm text-muted-foreground">Loading orders...</div>
            )}

            {!isLoading && orders.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">No orders found</div>
            )}

            <div className="space-y-2">
                {orders.map(order => {
                    const Icon = STATUS_ICONS[order.status] || Clock;
                    const color = STATUS_COLORS[order.status] || 'text-muted-foreground';
                    return (
                        <div key={order._id} className="bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-foreground">#{order.orderNumber}</span>
                                    <span className={`flex items-center gap-1 text-[10px] font-bold ${color}`}>
                                        <Icon size={10} />
                                        {order.status}
                                    </span>
                                    {order.table?.name && (
                                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                            {order.table.name}
                                        </span>
                                    )}
                                </div>
                                <span className="font-mono font-bold text-primary text-sm">₹{order.total?.toFixed(2)}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {order.items?.slice(0, 3).map((item, idx) => (
                                    <span key={idx} className="text-[10px] bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground">
                                        {item.quantity}x {item.name}
                                    </span>
                                ))}
                                {order.items?.length > 3 && (
                                    <span className="text-[10px] text-muted-foreground">
                                        +{order.items.length - 3} more
                                    </span>
                                )}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-2">
                                {new Date(order.createdAt).toLocaleString()}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CustomerDetail;
