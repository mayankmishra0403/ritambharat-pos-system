import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle, XCircle, Clock, Receipt, Plus, Save, User, Minus } from 'lucide-react';

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
    const { user } = useAuth();

    const [showAddItems, setShowAddItems] = useState(false);
    const [addItemsCart, setAddItemsCart] = useState([]);
    const [editCustomer, setEditCustomer] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

    const restaurantId = typeof user?.restaurant === 'object' ? user.restaurant._id : user?.restaurant;

    const { data: order, isLoading } = useQuery({
        queryKey: ['order-detail', orderId],
        queryFn: async () => {
            const res = await api.get(`/orders/${orderId}`);
            return res.data.data;
        },
        enabled: !!orderId,
        refetchInterval: 10000
    });

    const { data: menuItems = [] } = useQuery({
        queryKey: ['waiter-menu', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return [];
            const res = await api.get(`/menu/restaurant/${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId && showAddItems
    });

    const categories = [...new Set(menuItems.map(item => item.category))];
    const [menuSearch, setMenuSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

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

    const updateCustomerMutation = useMutation({
        mutationFn: ({ customerName, customerPhone }) =>
            api.patch(`/orders/${orderId}/customer`, { customerName, customerPhone }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['order-detail', orderId] });
            setEditCustomer(false);
            toast.success('Customer details updated');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to update customer')
    });

    const addItemsMutation = useMutation({
        mutationFn: (items) => api.post(`/waiter/orders/${orderId}/items`, { items }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['order-detail', orderId] });
            queryClient.invalidateQueries({ queryKey: ['waiter-orders'] });
            setAddItemsCart([]);
            setShowAddItems(false);
            toast.success('Items added to order');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to add items')
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

    const canModify = !['SERVED', 'CANCELLED'].includes(order.status) && order.paymentStatus !== 'PAID';

    const handleAddItem = (item) => {
        setAddItemsCart(prev => {
            const existing = prev.find(i => i.menuItem === item._id);
            if (existing) {
                return prev.map(i =>
                    i.menuItem === item._id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [...prev, { menuItem: item._id, name: item.name, quantity: 1 }];
        });
    };

    const handleItemQty = (menuItemId, delta) => {
        setAddItemsCart(prev =>
            prev.map(i =>
                i.menuItem === menuItemId
                    ? { ...i, quantity: Math.max(1, i.quantity + delta) }
                    : i
            ).filter(i => i.quantity > 0)
        );
    };

    const filteredItems = menuItems.filter(item => {
        const matchSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase());
        const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
        return matchSearch && matchCategory && item.isAvailable;
    });

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
                        {order.customerName ? (
                            <p className="text-sm text-muted-foreground">{order.customerName}{order.customerPhone ? ` (${order.customerPhone})` : ''}</p>
                        ) : (
                            <p className="text-xs text-muted-foreground italic">No customer details</p>
                        )}
                    </div>
                    <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${statusConfig.bg} ${statusConfig.color}`}>
                        <Icon size={14} className="inline mr-1" />
                        {statusConfig.label}
                    </div>
                </div>

                {canModify && (
                    <div className="flex gap-2 mb-3">
                        <button
                            onClick={() => {
                                setEditCustomer(!editCustomer);
                                setCustomerName(order.customerName || '');
                                setCustomerPhone(order.customerPhone || '');
                            }}
                            className="flex-1 py-2 bg-muted text-foreground font-bold text-xs rounded-lg hover:bg-muted/80 transition-colors flex items-center justify-center gap-1"
                        >
                            <User size={14} /> {order.customerName ? 'Edit Customer' : 'Add Customer'}
                        </button>
                        <button
                            onClick={() => setShowAddItems(!showAddItems)}
                            className="flex-1 py-2 bg-primary/10 text-primary font-bold text-xs rounded-lg hover:bg-primary/20 transition-colors flex items-center justify-center gap-1"
                        >
                            <Plus size={14} /> Add Items
                        </button>
                    </div>
                )}

                {editCustomer && (
                    <div className="mb-3 p-3 bg-muted/20 rounded-xl space-y-2">
                        <input
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            placeholder="Customer name"
                            className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                        />
                        <input
                            value={customerPhone}
                            onChange={e => setCustomerPhone(e.target.value)}
                            placeholder="Phone number"
                            className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => updateCustomerMutation.mutate({ customerName, customerPhone })}
                                disabled={updateCustomerMutation.isPending}
                                className="flex-1 py-2 bg-primary text-primary-foreground font-bold text-sm rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-1"
                            >
                                <Save size={14} /> Save
                            </button>
                            <button
                                onClick={() => setEditCustomer(false)}
                                className="py-2 px-4 bg-muted text-muted-foreground text-sm rounded-lg hover:bg-muted/80"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {showAddItems && (
                    <div className="mb-3 border border-border rounded-xl overflow-hidden">
                        <div className="p-3 bg-muted/20 border-b border-border">
                            <input
                                value={menuSearch}
                                onChange={e => setMenuSearch(e.target.value)}
                                placeholder="Search menu items..."
                                className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm focus:outline-none focus:border-primary mb-2"
                            />
                            <div className="flex gap-1 overflow-x-auto">
                                <button
                                    onClick={() => setSelectedCategory('all')}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${selectedCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                                >
                                    All
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${selectedCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                            {filteredItems.map(item => (
                                <div key={item._id} className="flex items-center justify-between p-2 hover:bg-muted/30 rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">{item.price.toFixed(2)}</p>
                                    </div>
                                    <button
                                        onClick={() => handleAddItem(item)}
                                        className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        {addItemsCart.length > 0 && (
                            <div className="border-t border-border p-3">
                                <div className="space-y-1 mb-2">
                                    {addItemsCart.map(item => {
                                        const details = menuItems.find(m => m._id === item.menuItem);
                                        return (
                                            <div key={item.menuItem} className="flex items-center justify-between text-sm">
                                                <span className="font-medium">{details?.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleItemQty(item.menuItem, -1)}
                                                        className="p-0.5 hover:bg-muted rounded"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="font-bold w-4 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => handleItemQty(item.menuItem, 1)}
                                                        className="p-0.5 hover:bg-muted rounded"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => addItemsMutation.mutate(addItemsCart.map(i => ({ menuItem: i.menuItem, quantity: i.quantity })))}
                                    disabled={addItemsMutation.isPending}
                                    className="w-full py-2 bg-primary text-primary-foreground font-bold text-sm rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-1"
                                >
                                    <Plus size={14} /> Add to Order
                                </button>
                            </div>
                        )}
                    </div>
                )}

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
                            <span className="text-sm font-bold text-foreground">{item.currency || '$'}{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                <div className="border-t border-border mt-3 pt-3 space-y-1 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span>{(order.subtotal || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                        <span>Tax</span>
                        <span>{(order.tax || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-foreground text-base">
                        <span>Total</span>
                        <span>{(order.total || 0).toFixed(2)}</span>
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
