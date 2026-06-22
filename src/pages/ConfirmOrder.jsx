import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, Table, Clock, Receipt } from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';

const ConfirmOrder = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [action, setAction] = useState(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await api.get(`/orders/${orderId}`);
                if (res.data.success) {
                    setOrder(res.data.data);
                } else {
                    toast.error('Order not found');
                }
            } catch (err) {
                toast.error('Failed to load order');
            } finally {
                setLoading(false);
            }
        };
        if (orderId) fetchOrder();
    }, [orderId]);

    const handleAccept = async () => {
        setAction('accepting');
        try {
            const res = await api.post(`/orders/${orderId}/accept`);
            if (res.data.success) {
                setOrder(prev => ({ ...prev, status: 'ACCEPTED' }));
                toast.success('Order accepted! Kitchen has been notified.');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to accept order');
        } finally {
            setAction(null);
        }
    };

    const handleReject = async () => {
        if (!window.confirm('Are you sure you want to reject this order?')) return;
        setAction('rejecting');
        try {
            await api.delete(`/orders/${orderId}`, {
                data: { reason: 'Rejected from confirm page' }
            });
            setOrder(prev => ({ ...prev, status: 'CANCELLED' }));
            toast.success('Order rejected');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reject order');
        } finally {
            setAction(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-foreground">Order Not Found</h2>
                </div>
            </div>
        );
    }

    const isAccepted = order.status === 'ACCEPTED';
    const isCancelled = order.status === 'CANCELLED';
    const itemCount = order.items?.reduce((s, i) => s + i.quantity, 0) || 0;

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
                {isAccepted ? (
                    <div className="p-8 text-center">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-12 h-12 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-black text-foreground mb-2">Order Accepted!</h2>
                        <p className="text-muted-foreground">Kitchen has been notified. KOT sent to printer.</p>
                    </div>
                ) : isCancelled ? (
                    <div className="p-8 text-center">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-black text-foreground mb-2">Order Rejected</h2>
                        <p className="text-muted-foreground">The order has been cancelled.</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-gradient-to-br from-orange-500/10 to-primary/10 p-6 border-b border-border">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center">
                                    <Receipt className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-foreground">New Order Request</h2>
                                    <p className="text-sm text-muted-foreground font-mono">#{order.orderNumber}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {order.table?.name && (
                                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl">
                                    <Table className="w-5 h-5 text-primary" />
                                    <span className="font-bold text-foreground">Table {order.table.name}</span>
                                </div>
                            )}

                            {order.customerName && (
                                <div className="text-sm text-muted-foreground">
                                    Customer: <span className="font-medium text-foreground">{order.customerName}</span>
                                    {order.customerPhone && <span> ({order.customerPhone})</span>}
                                </div>
                            )}

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

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(order.createdAt).toLocaleString()}
                            </div>
                        </div>

                        <div className="p-4 border-t border-border flex gap-3">
                            <button
                                onClick={handleAccept}
                                disabled={action !== null}
                                className="flex-1 py-3.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {action === 'accepting' ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                Accept Order
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={action !== null}
                                className="flex-1 py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {action === 'rejecting' ? <Loader className="w-4 h-4 animate-spin" /> : <XCircle className="w-5 h-5" />}
                                Reject
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ConfirmOrder;
