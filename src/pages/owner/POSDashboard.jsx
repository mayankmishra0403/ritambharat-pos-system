import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { Printer, Plus, X, RotateCcw, Trash2, Receipt, Split, LogOut } from 'lucide-react';

import POSTableGrid from '../../components/pos/POSTableGrid';
import POSMenuPanel from '../../components/pos/POSMenuPanel';
import POSCart from '../../components/pos/POSCart';
import POSPaymentModal from '../../components/pos/POSPaymentModal';
import POSSessionBar from '../../components/pos/POSSessionBar';
import POSSessionModal from '../../components/pos/POSSessionModal';

const POSDashboard = () => {
    const { user, logout } = useAuth();
    const queryClient = useQueryClient();
    const { socket } = useSocket();
    const [restaurantId, setRestaurantId] = useState(null);

    const [selectedTable, setSelectedTable] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const [discount, setDiscount] = useState(0);
    const [serviceCharge, setServiceCharge] = useState(0);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

    const [showSessionModal, setShowSessionModal] = useState(false);
    const [sessionModalInitiallyOpened, setSessionModalInitiallyOpened] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [payingOrder, setPayingOrder] = useState(null);
    const [showExistingOrders, setShowExistingOrders] = useState(false);

    useEffect(() => {
        if (user?.restaurant) {
            const id = typeof user.restaurant === 'object' ? user.restaurant._id : user.restaurant;
            setRestaurantId(id);
        }
    }, [user]);

    useEffect(() => {
        if (!socket || !restaurantId) return;
        const handler = () => {
            queryClient.invalidateQueries({ queryKey: ['pos-data', restaurantId] });
            queryClient.invalidateQueries({ queryKey: ['pos-session', restaurantId] });
        };
        socket.on('table:updated', handler);
        socket.on('order:created', handler);
        socket.on('order:paid', handler);
        return () => {
            socket.off('table:updated', handler);
            socket.off('order:created', handler);
            socket.off('order:paid', handler);
        };
    }, [socket, restaurantId, queryClient]);

    const { data: session, isFetched: sessionFetched } = useQuery({
        queryKey: ['pos-session', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return null;
            const res = await api.get(`/pos/session/current?restaurantId=${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId,
        refetchInterval: 30000
    });

    const { data: posData, isLoading } = useQuery({
        queryKey: ['pos-data', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return {};
            const res = await api.get(`/pos/data?restaurantId=${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId,
        refetchInterval: 15000
    });

    useEffect(() => {
        if (restaurantId && sessionFetched && !session && !sessionModalInitiallyOpened) {
            setShowSessionModal(true);
            setSessionModalInitiallyOpened(true);
        }
    }, [restaurantId, session, sessionFetched, sessionModalInitiallyOpened]);

    // Fetch active order for selected table
    const { data: tableOrders = [] } = useQuery({
        queryKey: ['table-orders', selectedTable?._id, restaurantId],
        queryFn: async () => {
            if (!selectedTable) return [];
            const res = await api.get(`/orders/restaurant/${restaurantId}`);
            return (res.data.data || []).filter(o =>
                o.table?._id === selectedTable._id &&
                o.paymentStatus !== 'PAID' &&
                o.status !== 'CANCELLED'
            );
        },
        enabled: !!selectedTable && !!restaurantId
    });

    const activeTableOrder = tableOrders[0];

    const openSessionMutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/pos/session', { ...data, restaurantId });
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pos-session', restaurantId] });
            setShowSessionModal(false);
            toast.success('Session opened');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to open session')
    });

    const closeSessionMutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.patch(`/pos/session/${session._id}/close`, data);
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pos-session', restaurantId] });
            setShowSessionModal(false);
            toast.success('Session closed');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to close session')
    });

    const createOrderMutation = useMutation({
        mutationFn: async (items) => {
            // If table has an active unpaid order, add items to it
            if (activeTableOrder) {
                const res = await api.post(`/pos/order/${activeTableOrder._id}/items`, {
                    items,
                    restaurantId
                });
                return { ...res.data.data, isUpdate: true };
            }
            const res = await api.post('/pos/order', {
                restaurantId,
                table: selectedTable?._id,
                items,
                customerName: !selectedTable ? customerName : undefined,
                customerPhone: !selectedTable ? customerPhone : undefined
            });
            return res.data.data;
        },
        onSuccess: (order) => {
            queryClient.invalidateQueries({ queryKey: ['pos-data', restaurantId] });
            queryClient.invalidateQueries({ queryKey: ['table-orders', selectedTable?._id, restaurantId] });
            setCartItems([]);
            setDiscount(0);
            setServiceCharge(0);
            if (order.isUpdate) {
                toast.success('Items added to order');
            } else {
                setCustomerName('');
                setCustomerPhone('');
                setPayingOrder(order);
                setShowPaymentModal(true);
                toast.success(`Order #${order.orderNumber} created`);
            }
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to create order')
    });

    const addItemsMutation = useMutation({
        mutationFn: async (orderId, items) => {
            const res = await api.post(`/pos/order/${orderId}/items`, { items, restaurantId });
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['table-orders', selectedTable?._id, restaurantId] });
            queryClient.invalidateQueries({ queryKey: ['pos-data', restaurantId] });
            setCartItems([]);
            toast.success('Items added');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to add items')
    });

    const cancelOrderMutation = useMutation({
        mutationFn: async (orderId) => {
            const res = await api.delete(`/orders/${orderId}`, {
                data: { reason: 'Cancelled from POS' }
            });
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pos-data', restaurantId] });
            queryClient.invalidateQueries({ queryKey: ['table-orders', selectedTable?._id, restaurantId] });
            toast.success('Order cancelled');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to cancel')
    });

    const paymentMutation = useMutation({
        mutationFn: async ({ orderId, paymentMethod, amountPaid }) => {
            const res = await api.post(`/pos/order/${orderId}/payment`, {
                paymentMethod, amountPaid, restaurantId
            });
            return res.data.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['pos-data', restaurantId] });
            queryClient.invalidateQueries({ queryKey: ['pos-session', restaurantId] });
            queryClient.invalidateQueries({ queryKey: ['table-orders', selectedTable?._id, restaurantId] });
            setShowPaymentModal(false);
            setPayingOrder(null);
            setSelectedTable(null);
            toast.success(`Payment received - ${data.changeDue ? `Change: ₹${data.changeDue.toFixed(2)}` : ''}`);
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Payment failed')
    });

    const handleSelectTable = useCallback((table) => {
        if (!session) {
            toast.error('Open a POS session first');
            return;
        }
        setSelectedTable(table);
        setCartItems([]);
        setShowExistingOrders(true);
    }, [session]);

    const handleAddItem = useCallback((item) => {
        if (!session) {
            toast.error('Open a POS session first');
            return;
        }
        setCartItems(prev => {
            const existing = prev.find(i => i.menuItem === item._id);
            if (existing) {
                return prev.map(i =>
                    i.menuItem === item._id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [...prev, {
                menuItem: item._id,
                name: item.name,
                price: item.price,
                quantity: 1
            }];
        });
    }, [session]);

    const handleUpdateQty = useCallback((idx, qty) => {
        setCartItems(prev => prev.map((item, i) => i === idx ? { ...item, quantity: qty } : item));
    }, []);

    const handleRemoveItem = useCallback((idx) => {
        setCartItems(prev => prev.filter((_, i) => i !== idx));
    }, []);

    const handlePlaceOrder = () => {
        if (cartItems.length === 0) {
            toast.error('Cart is empty');
            return;
        }
        if (!selectedTable && !restaurantId) {
            toast.error('Select a table or choose takeaway');
            return;
        }
        createOrderMutation.mutate(cartItems.map(i => ({
            menuItem: i.menuItem,
            quantity: i.quantity,
            specialInstructions: i.specialInstructions
        })));
    };

    const handlePayment = ({ orderId, paymentMethod, amountPaid }) => {
        paymentMutation.mutate({ orderId, paymentMethod, amountPaid });
    };

    const handleCancelOrder = () => {
        if (!activeTableOrder) return;
        if (!window.confirm(`Cancel order #${activeTableOrder.orderNumber}?`)) return;
        cancelOrderMutation.mutate(activeTableOrder._id);
    };

    const handleBillAndPay = () => {
        if (!activeTableOrder) return;
        setPayingOrder(activeTableOrder);
        setShowPaymentModal(true);
    };

    const subtotal = cartItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const discountAmount = discount ? (subtotal * discount) / 100 : 0;
    const taxRate = posData?.taxRate || 0;
    const taxAmount = ((subtotal - discountAmount) * taxRate) / 100;
    const scAmount = serviceCharge ? (subtotal * serviceCharge) / 100 : 0;
    const total = subtotal - discountAmount + taxAmount + scAmount;

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
            </div>
        );
    }

    return (
        <div className="h-screen bg-background flex flex-col overflow-hidden">
            <div className="p-3 border-b border-border bg-card">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="font-bold text-foreground">POS Billing</h1>
                    <div className="flex items-center gap-2">
                        {activeTableOrder && (
                            <button
                                onClick={handleBillAndPay}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition-colors"
                            >
                                <Receipt size={14} />
                                Bill & Pay
                            </button>
                        )}
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                        >
                            <Printer size={14} />
                            Print
                        </button>
                        {(user?.role === 'OWNER' || user?.role === 'ADMIN') && (
                            <button
                                onClick={() => window.location.href = '/dashboard'}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-foreground/10 text-foreground rounded-lg hover:bg-foreground/20 transition-colors"
                            >
                                <RotateCcw size={14} />
                                Back to Panel
                            </button>
                        )}
                        <button
                            onClick={() => { logout(); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                            <LogOut size={14} />
                            Logout
                        </button>
                    </div>
                </div>
                <POSSessionBar
                    session={session}
                    onOpen={() => setShowSessionModal(true)}
                    onClose={() => setShowSessionModal(true)}
                />
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-[280px] lg:w-[320px] flex-shrink-0 border-r border-border p-3 overflow-y-auto">
                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Tables</h2>
                    <POSTableGrid
                        tables={posData?.tables || []}
                        selectedTableId={selectedTable?._id}
                        onSelectTable={handleSelectTable}
                        activeOrders={posData?.activeOrders || []}
                    />
                    <button
                        onClick={() => { setSelectedTable(null); setShowExistingOrders(false); }}
                        className={`w-full mt-2 p-2.5 rounded-xl text-xs font-bold transition-all border-2 text-center ${
                            !selectedTable
                                ? 'bg-primary/10 border-primary text-primary'
                                : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/50'
                        }`}
                    >
                        Takeaway
                    </button>
                </div>

                <div className="flex-1 p-3 overflow-y-auto min-w-0">
                    {activeTableOrder ? (
                        <div className="space-y-3">
                            <div className="bg-card border border-border rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h3 className="font-bold text-foreground">Order #{activeTableOrder.orderNumber}</h3>
                                        <p className="text-[10px] text-muted-foreground">
                                            {activeTableOrder.orderType} · {activeTableOrder.status} · {new Date(activeTableOrder.createdAt).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={handleCancelOrder}
                                            disabled={cancelOrderMutation.isPending}
                                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 text-red-500 rounded-lg text-[10px] font-bold hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                                        >
                                            <Trash2 size={10} />
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    {activeTableOrder.items?.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">
                                                <span className="font-bold text-foreground">{item.quantity}x</span> {item.name}
                                            </span>
                                            <span className="font-mono font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-border mt-2 pt-2 flex justify-between font-bold text-sm">
                                    <span>Total</span>
                                    <span className="font-mono text-primary">₹{activeTableOrder.total?.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-xl p-3">
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Add Items</h4>
                                <POSMenuPanel
                                    menuItems={posData?.menuItems || []}
                                    categories={posData?.categories || []}
                                    onAddItem={handleAddItem}
                                />
                            </div>
                        </div>
                    ) : (
                        <POSMenuPanel
                            menuItems={posData?.menuItems || []}
                            categories={posData?.categories || []}
                            onAddItem={handleAddItem}
                        />
                    )}
                </div>

                <div className="w-[320px] lg:w-[360px] flex-shrink-0 border-l border-border p-3 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cart</h2>
                        {selectedTable && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                {selectedTable.name}
                            </span>
                        )}
                        {!selectedTable && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                Takeaway
                            </span>
                        )}
                    </div>

                    {!selectedTable && (
                        <div className="mb-3 space-y-2">
                            <input
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                                placeholder="Customer name"
                                className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                            />
                            <input
                                value={customerPhone}
                                onChange={e => setCustomerPhone(e.target.value)}
                                placeholder="Phone number"
                                className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                            />
                        </div>
                    )}

                    <POSCart
                        cartItems={cartItems}
                        onUpdateQty={handleUpdateQty}
                        onRemoveItem={handleRemoveItem}
                        discount={discount}
                        serviceCharge={serviceCharge}
                        onDiscountChange={setDiscount}
                        onServiceChargeChange={setServiceCharge}
                        taxRate={taxRate}
                        currency={posData?.currency || 'INR'}
                    />

                    {cartItems.length > 0 && (
                        <button
                            onClick={handlePlaceOrder}
                            disabled={createOrderMutation.isPending}
                            className="w-full mt-3 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <Plus size={16} />
                            {createOrderMutation.isPending
                                ? 'Processing...'
                                : activeTableOrder
                                    ? `Add to Order - ₹${total.toFixed(2)}`
                                    : `Place Order - ₹${total.toFixed(2)}`
                            }
                        </button>
                    )}
                </div>
            </div>

            <POSSessionModal
                session={session}
                open={showSessionModal}
                onClose={() => setShowSessionModal(false)}
                onOpen={openSessionMutation.mutate}
                onCloseSession={closeSessionMutation.mutate}
                loading={openSessionMutation.isPending || closeSessionMutation.isPending}
            />

            {payingOrder && (
                <POSPaymentModal
                    order={payingOrder}
                    open={showPaymentModal}
                    onClose={() => { setShowPaymentModal(false); setPayingOrder(null); }}
                    onPayment={handlePayment}
                    loading={paymentMutation.isPending}
                />
            )}
        </div>
    );
};

export default POSDashboard;
