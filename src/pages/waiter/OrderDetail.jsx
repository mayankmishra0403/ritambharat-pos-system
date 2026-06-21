import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle, XCircle, Clock, Receipt } from 'lucide-react';

const STATUS_CONFIG = {
    PENDING: { label: 'Pending', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    ACCEPTED: { label: 'Accepted', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    PREPARING: { label: 'Preparing', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    READY: { label: 'Ready', color: 'text-green-500', bg: 'bg-green-500/10' },
    SERVED: { label: 'Served', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    CANCELLED: { label: 'Cancelled', color: 'text-red-500', bg: 'bg-red-500/10' }
};

const OrderDetail = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: order, isLoading } = useQuery({
        queryKey: ['order-detail', orderId],
        queryFn: async () => {
            const res = await api.get(`/orders/${orderId}`);
            return res.data.data;
        },
        enabled: !!orderId,
        refetchInterval: 10000
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => api.patch(`/waiter/orders/${id}/status`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['order-detail', orderId] });
            queryClient.invalidateQueries({ queryKey: ['waiter-orders'] });
            toast.success('Status updated');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Update failed')
    });

    const requestBillMutation = useMutation({
        mutationFn: () => api.post(`/waiter/orders/${orderId}/bill`),
        onSuccess: () => toast.success('Bill requested!'),
        onError: (err) => toast.error(err.response?.data?.message || 'Failed')
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="text-center py-20">
                <p className="text-muted-foreground">Order not found</p>
                <button onClick={() => navigate('/waiter-app')} className="mt-4 text-primary text-sm font-bold">Go back</button>
            </div>
        );
    }

    const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
    const Icon = order.status === 'CANCELLED' ? XCircle :
                 order.status === 'SERVED' ? CheckCircle :
                 Clock;

    return (
        <div className="space-y-4">
            <button
                onClick={() => navigate('/waiter-app')}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft size={16} /> Back
            </button>

            <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Order #{order.orderNumber}</h2>
                        {order.table && (
                            <p className="text-sm text-muted-foreground">Table {order.table?.name || 'N/A'}</p>
                        )}
                        {order.customerName && (
                            <p className="text-sm text-muted-foreground">{order.customerName}</p>
                        )}
                    </div>
                    <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${statusConfig.bg} ${statusConfig.color}`}>
                        <Icon size={14} className="inline mr-1" />
                        {statusConfig.label}
                    </div>
                </div>

                <div className="space-y-2 divide-y divide-border">
                    {order.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 py-2">
                            <span className="bg-foreground text-background w-6 h-6 flex items-center justify-center rounded text-xs font-bold font-mono">
                                {item.quantity}
                            </span>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-foreground">{item.name}</p>
                                {item.specialInstructions && (
                                    <p className="text-xs text-yellow-500 italic">{item.specialInstructions}</p>
                                )}
                            </div>
                            <span className="text-sm font-bold text-foreground">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                <div className="border-t border-border mt-3 pt-3 space-y-1 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span>${order.subtotal?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                        <span>Tax</span>
                        <span>${order.tax?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-foreground text-base">
                        <span>Total</span>
                        <span>${order.total?.toFixed(2)}</span>
                    </div>
                </div>

                {order.paymentStatus && (
                    <div className="mt-3 pt-3 border-t border-border">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                            order.paymentStatus === 'PAID' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                        }`}>
                            {order.paymentStatus}
                        </span>
                        {order.paymentMethod && (
                            <span className="text-xs text-muted-foreground ml-2">via {order.paymentMethod}</span>
                        )}
                    </div>
                )}

                {order.statusHistory?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Timeline</p>
                        <div className="space-y-1">
                            {order.statusHistory.map((h, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    <span className="font-medium text-foreground">{h.status}</span>
                                    <span className="text-muted-foreground">
                                        {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-3">
                {order.status === 'READY' && (
                    <button
                        onClick={() => updateStatusMutation.mutate({ id: orderId, status: 'SERVED' })}
                        className="flex-1 py-3 bg-green-500 text-white font-bold text-sm rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <CheckCircle size={18} /> Mark Served
                    </button>
                )}

                {!['SERVED', 'CANCELLED'].includes(order.status) && order.status !== 'READY' && (
                    <button
                        onClick={() => updateStatusMutation.mutate({ id: orderId, status: 'CANCELLED' })}
                        className="flex-1 py-3 bg-red-500/10 text-red-500 font-bold text-sm rounded-xl hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 border border-red-500/20"
                    >
                        <XCircle size={18} /> Cancel
                    </button>
                )}

                {order.paymentStatus !== 'PAID' && (
                    <button
                        onClick={() => requestBillMutation.mutate()}
                        disabled={requestBillMutation.isPending}
                        className="flex-1 py-3 bg-primary/10 text-primary font-bold text-sm rounded-xl hover:bg-primary/20 transition-colors flex items-center justify-center gap-2 border border-primary/20"
                    >
                        <Receipt size={18} /> Request Bill
                    </button>
                )}
            </div>
        </div>
    );
};

export default OrderDetail;
