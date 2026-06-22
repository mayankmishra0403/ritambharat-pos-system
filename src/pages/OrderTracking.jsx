import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, Clock, Receipt, ChefHat, Sparkles, Utensils, Bell } from 'lucide-react';
import api from '../config/api';

const STEPS = [
    { key: 'PENDING', label: 'Order Placed', icon: Receipt, color: 'text-orange-500', bg: 'bg-orange-500' },
    { key: 'ACCEPTED', label: 'Accepted', icon: Bell, color: 'text-green-500', bg: 'bg-green-500' },
    { key: 'PREPARING', label: 'Preparing', icon: ChefHat, color: 'text-blue-500', bg: 'bg-blue-500' },
    { key: 'SERVED', label: 'Ready to Serve', icon: Utensils, color: 'text-purple-500', bg: 'bg-purple-500' },
    { key: 'COMPLETED', label: 'Completed', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500' },
];

const STATUS_INDEX = { PENDING: 0, ACCEPTED: 1, PREPARING: 2, SERVED: 3, COMPLETED: 4, CANCELLED: -1, REJECTED: -1 };

const statusLabel = (status) => {
    const map = {
        PENDING: 'Waiting to be accepted',
        ACCEPTED: 'Order accepted by restaurant',
        PREPARING: 'Being prepared in kitchen',
        SERVED: 'Ready to be served',
        COMPLETED: 'Order completed',
        CANCELLED: 'Order was cancelled',
        REJECTED: 'Order was rejected',
    };
    return map[status] || status;
};

const statusColor = (status) => {
    const map = {
        PENDING: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        ACCEPTED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        PREPARING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        SERVED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
};

const OrderTracking = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await api.get(`/orders/${orderId}`);
                if (res.data.success) {
                    setOrder(res.data.data);
                } else {
                    setError('Order not found');
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load order');
            } finally {
                setLoading(false);
            }
        };
        if (orderId) fetchOrder();
    }, [orderId]);

    useEffect(() => {
        if (!order || order.status === 'COMPLETED' || order.status === 'CANCELLED') return;
        const interval = setInterval(async () => {
            try {
                const res = await api.get(`/orders/${orderId}`);
                if (res.data.success && res.data.data.status !== order.status) {
                    setOrder(res.data.data);
                }
            } catch { }
        }, 5000);
        return () => clearInterval(interval);
    }, [order, orderId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="text-center max-w-sm">
                    <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-foreground mb-2">Order Not Found</h2>
                    <p className="text-muted-foreground text-sm">{error || 'This order does not exist or has been removed.'}</p>
                </div>
            </div>
        );
    }

    const isCancelled = order.status === 'CANCELLED' || order.status === 'REJECTED';
    const currentStep = STATUS_INDEX[order.status] ?? -1;
    const itemCount = order.items?.reduce((s, i) => s + i.quantity, 0) || 0;
    const showBill = order.status === 'SERVED' || order.status === 'COMPLETED' || order.paymentStatus === 'PAID';

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-br from-primary/10 to-orange-500/10 p-6 border-b border-border">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
                            <Receipt className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-foreground">Order Status</h2>
                            <p className="text-sm text-muted-foreground font-mono">#{order.orderNumber}</p>
                        </div>
                    </div>
                    <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${statusColor(order.status)}`}>
                        <Sparkles className="w-4 h-4" />
                        {statusLabel(order.status)}
                    </div>
                </div>

                {order.table?.name && (
                    <div className="px-6 pt-4 pb-2 flex items-center gap-3">
                        <Utensils className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">Table {order.table.name}</span>
                    </div>
                )}

                <div className="p-6">
                    {isCancelled ? (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <XCircle className="w-10 h-10 text-red-500" />
                            </div>
                            <h3 className="text-xl font-black text-foreground mb-1">Order Cancelled</h3>
                            <p className="text-sm text-muted-foreground">This order has been cancelled.</p>
                        </div>
                    ) : (
                        <div className="space-y-0">
                            {STEPS.map((step, idx) => {
                                const StepIcon = step.icon;
                                const isActive = idx <= currentStep;
                                const isCurrent = idx === currentStep;
                                const isLast = idx === STEPS.length - 1;
                                return (
                                    <div key={step.key} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${isActive ? step.bg : 'bg-muted'
                                                } ${isCurrent ? 'ring-4 ring-offset-2 ring-offset-background ' + step.bg.replace('bg-', 'ring-') : ''}`}>
                                                <StepIcon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                                            </div>
                                            {!isLast && (
                                                <div className={`w-0.5 h-10 ${isActive && idx < currentStep ? 'bg-green-400' : 'bg-muted'}`} />
                                            )}
                                        </div>
                                        <div className={`pb-10 ${isLast ? 'pb-0' : ''}`}>
                                            <p className={`text-sm font-bold ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                {step.label}
                                            </p>
                                            {isCurrent && (
                                                <p className="text-xs text-muted-foreground mt-0.5">{statusLabel(step.key)}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="border-t border-border px-6 py-4 space-y-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Order Items</p>
                    <div className="space-y-1.5">
                        {order.items?.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span className="text-foreground">
                                    {item.name} <span className="text-muted-foreground">x{item.quantity}</span>
                                </span>
                                <span className="font-medium text-foreground">₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">{itemCount} items</span>
                        <span className="text-xl font-black text-foreground">₹{order.total?.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(order.createdAt).toLocaleString()}
                    </div>
                </div>

                <div className="p-4 border-t border-border">
                    {showBill && (
                        <Link
                            to={`/bill/${orderId}`}
                            className="block w-full py-3.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all text-center"
                        >
                            View Bill
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderTracking;
