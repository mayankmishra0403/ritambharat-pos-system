import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import {
    ShoppingBag, Clock, ChefHat, CheckCheck, Phone, User,
    Search, Plus, RefreshCw, Package, X
} from 'lucide-react';
import TakeawayForm from '../../components/takeaway/TakeawayForm';

const STATUS_CONFIG = {
    PENDING: { label: 'Pending', icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    PREPARING: { label: 'Preparing', icon: ChefHat, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    READY: { label: 'Ready', icon: CheckCheck, color: 'text-green-500', bg: 'bg-green-500/10' },
    SERVED: { label: 'Picked Up', icon: Package, color: 'text-muted-foreground', bg: 'bg-muted/50' }
};

const TakeawayDashboard = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);

    const restaurantId = useMemo(() => {
        if (!user?.restaurant) return null;
        return typeof user.restaurant === 'object' ? user.restaurant._id : user.restaurant;
    }, [user]);

    const { data, isLoading } = useQuery({
        queryKey: ['takeaway-dashboard', restaurantId],
        queryFn: async () => {
            const res = await api.get(`/takeaway?restaurantId=${restaurantId}`);
            return res.data.data;
        },
        refetchInterval: 10000,
        enabled: !!restaurantId
    });

    const readyMutation = useMutation({
        mutationFn: async (orderId) => {
            await api.patch(`/takeaway/order/${orderId}/ready`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['takeaway-dashboard', restaurantId] });
            toast.success('Order marked as ready');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to update')
    });

    const completeMutation = useMutation({
        mutationFn: async (orderId) => {
            await api.patch(`/takeaway/order/${orderId}/complete`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['takeaway-dashboard', restaurantId] });
            toast.success('Order picked up');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to update')
    });

    const orders = (data?.orders || []).filter(order => {
        if (filterStatus !== 'all' && order.status !== filterStatus) return false;
        if (search) {
            const q = search.toLowerCase();
            return (
                order.orderNumber?.toLowerCase().includes(q) ||
                order.customerName?.toLowerCase().includes(q) ||
                order.customerPhone?.includes(q)
            );
        }
        return true;
    });

    const stats = data?.stats || { pending: 0, preparing: 0, ready: 0, completed: 0 };

    const statCards = [
        { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
        { label: 'Preparing', value: stats.preparing, icon: ChefHat, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Ready', value: stats.ready, icon: CheckCheck, color: 'text-green-500', bg: 'bg-green-500/10' },
        { label: 'Completed', value: stats.completed, icon: Package, color: 'text-muted-foreground', bg: 'bg-muted/50' },
    ];

    return (
        <div className="flex bg-background min-h-screen text-foreground font-sans selection:bg-primary/30 transition-colors duration-300">
            <Sidebar open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
            {mobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header onMobileMenuClick={() => setMobileMenuOpen(true)} />

                <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-8 custom-scrollbar">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">Takeaway / Delivery</h1>
                                <p className="text-sm text-muted-foreground">Manage pickup and delivery orders</p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
                            >
                                <Plus size={14} />
                                New Order
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                            {statCards.map((s, i) => (
                                <div key={i} className="bg-card border border-border/50 rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${s.bg} ${s.color}`}>
                                            <s.icon size={16} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-foreground">{s.value}</p>
                                            <p className="text-xs text-muted-foreground">{s.label}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-3 mb-4 flex-wrap">
                            <div className="relative flex-1 max-w-xs">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search orders..."
                                    className="w-full pl-9 pr-3 py-2 bg-muted/30 border border-border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                                />
                            </div>
                            <div className="flex gap-1">
                                {['all', 'PENDING', 'PREPARING', 'READY'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                            filterStatus === status
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                                        }`}
                                    >
                                        {status === 'all' ? 'All' : status}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => queryClient.invalidateQueries({ queryKey: ['takeaway-dashboard', restaurantId] })}
                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                            >
                                <RefreshCw size={16} />
                            </button>
                        </div>

                        {/* Orders List */}
                        {isLoading ? (
                            <div className="text-center py-16 text-sm text-muted-foreground">Loading orders...</div>
                        ) : orders.length === 0 ? (
                            <div className="text-center py-16 bg-card border border-border/50 rounded-2xl">
                                <ShoppingBag size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                                <h3 className="font-bold text-foreground mb-1">No takeaway orders</h3>
                                <p className="text-sm text-muted-foreground mb-4">Create a new takeaway or delivery order to get started</p>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold"
                                >
                                    New Order
                                </button>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {orders.map(order => {
                                    const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
                                    const StatusIcon = statusConfig.icon;
                                    const itemsCount = order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
                                    return (
                                        <div key={order._id} className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className="font-bold text-foreground text-lg">#{order.orderNumber}</span>
                                                        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
                                                            <StatusIcon size={10} />
                                                            {statusConfig.label}
                                                        </span>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                                            {order.orderType}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                                                        <span className="flex items-center gap-1">
                                                            <User size={10} />
                                                            {order.customerName || 'Guest'}
                                                        </span>
                                                        {order.customerPhone && (
                                                            <span className="flex items-center gap-1">
                                                                <Phone size={10} />
                                                                {order.customerPhone}
                                                            </span>
                                                        )}
                                                        <span>{new Date(order.createdAt).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {order.items?.slice(0, 4).map((item, idx) => (
                                                            <span key={idx} className="text-[10px] bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground">
                                                                {item.quantity}x {item.name}
                                                            </span>
                                                        ))}
                                                        {order.items?.length > 4 && (
                                                            <span className="text-[10px] text-muted-foreground">+{order.items.length - 4} more</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="font-mono font-bold text-primary text-lg">₹{order.total?.toFixed(2)}</p>
                                                    <p className="text-[10px] text-muted-foreground">{itemsCount} items</p>
                                                    <div className="flex gap-1 mt-2">
                                                        {order.status === 'PENDING' && (
                                                            <button
                                                                onClick={() => readyMutation.mutate(order._id)}
                                                                disabled={readyMutation.isPending}
                                                                className="px-3 py-1.5 bg-blue-500/10 text-blue-500 rounded-lg text-[10px] font-bold hover:bg-blue-500/20 disabled:opacity-50 transition-colors"
                                                            >
                                                                Mark Ready
                                                            </button>
                                                        )}
                                                        {order.status === 'READY' && (
                                                            <button
                                                                onClick={() => completeMutation.mutate(order._id)}
                                                                disabled={completeMutation.isPending}
                                                                className="px-3 py-1.5 bg-green-500/10 text-green-500 rounded-lg text-[10px] font-bold hover:bg-green-500/20 disabled:opacity-50 transition-colors"
                                                            >
                                                                Picked Up
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {showCreateModal && (
                <TakeawayForm
                    restaurantId={restaurantId}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        queryClient.invalidateQueries({ queryKey: ['takeaway-dashboard', restaurantId] });
                    }}
                />
            )}
        </div>
    );
};

export default TakeawayDashboard;
