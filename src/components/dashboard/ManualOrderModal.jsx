import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    X, Plus, Minus, Search, ShoppingCart,
    Table as TableIcon, Utensils, Loader2,
    Clock, Check, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../config/api';
import toast from 'react-hot-toast';

const ManualOrderModal = ({ isOpen, onClose, restaurantId }) => {
    const queryClient = useQueryClient();
    const [step, setStep] = useState(1); // 1: Table, 2: Items, 3: Review, 4: Success
    const [selectedTable, setSelectedTable] = useState(null);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [placedOrder, setPlacedOrder] = useState(null);
    const [printing, setPrinting] = useState(false);

    useEffect(() => {
        if (!printing || !placedOrder) return;
        const timer = setTimeout(() => {
            const win = window.open('', '_blank');
            if (!win) { toast.error('Popup blocked! Allow popups for this site.'); setPrinting(false); return; }
            const order = placedOrder;
            const itemsHtml = order.items.map(item =>
                `<tr><td style="padding:4px 0;font-size:12px">${item.quantity}x ${item.name}</td><td style="padding:4px 0;font-size:12px;text-align:right;font-weight:bold">₹${(item.price * item.quantity).toFixed(2)}</td></tr>`
            ).join('');
            win.document.write(`
                <html><head>
                <style>
                    @page { margin: 0; size: auto; }
                    body { margin: 0; padding: 20px; font-family: monospace; color: black; background: white; }
                    .receipt { max-width: 320px; margin: 0 auto; }
                    .center { text-align: center; }
                    .bold { font-weight: bold; }
                    .border-t { border-top: 2px solid black; }
                    .border-b { border-bottom: 2px solid black; }
                    table { width: 100%; border-collapse: collapse; }
                    td { padding: 4px 0; font-size: 12px; }
                </style>
                </head><body>
                <div class="receipt">
                    <div class="center mb-4">
                        <h2 class="bold" style="font-size:18px">${order.restaurant?.name || 'Restaurant Name'}</h2>
                        ${order.restaurant?.address ? `<p style="font-size:10px">${typeof order.restaurant.address === 'string' ? order.restaurant.address : [order.restaurant.address.street, order.restaurant.address.city].filter(Boolean).join(', ')}</p>` : ''}
                        ${order.restaurant?.phone ? `<p style="font-size:10px">TEL: ${order.restaurant.phone}</p>` : ''}
                    </div>
                    <div class="border-t" style="margin-bottom:16px"></div>
                    <div class="center" style="margin-bottom:16px">
                        <p class="bold" style="font-size:18px">OFFICIAL INVOICE</p>
                        <p style="font-size:11px">DATE: ${new Date(order.createdAt).toLocaleDateString()} TIME: ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        <p class="bold" style="font-size:11px;margin-top:4px">INVOICE NO: ${(order.orderNumber?.split('-')[2] || order._id?.slice(-6).toUpperCase())}</p>
                    </div>
                    <div class="border-b" style="margin-bottom:16px"></div>
                    <p class="bold" style="font-size:12px;margin-bottom:16px">TABLE: ${order.table?.name || 'TAKEOUT'} &nbsp; ${order.orderSource || 'WEB'}</p>
                    <table>${itemsHtml}</table>
                    <div style="border-top:2px solid black;margin-top:16px;padding-top:8px">
                        <table>
                            <tr><td class="bold" style="font-size:12px">Subtotal</td><td style="text-align:right">₹${(order.total / 1.1).toFixed(2)}</td></tr>
                            <tr><td class="bold" style="font-size:12px">VAT (10%)</td><td style="text-align:right">₹${(order.total - order.total / 1.1).toFixed(2)}</td></tr>
                            <tr><td class="bold" style="font-size:24px;border-top:2px solid black;padding-top:8px">Grand Total</td><td class="bold" style="font-size:24px;border-top:2px solid black;padding-top:8px;text-align:right">₹${order.total.toFixed(2)}</td></tr>
                        </table>
                    </div>
                    <div class="center" style="margin-top:16px;border-top:1px solid #ccc;padding-top:16px">
                        <p class="bold" style="font-size:12px">Thank You</p>
                        <p style="font-size:10px">Please visit again</p>
                        <p style="font-size:9px;margin-top:16px">Powered by Ritam Bharat POS</p>
                    </div>
                </div>
                <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };</script>
                </body></html>
            `);
            win.document.close();
        }, 500);
        return () => clearTimeout(timer);
    }, [printing, placedOrder]);

    // Fetch Tables
    const { data: tables = [], isLoading: loadingTables } = useQuery({
        queryKey: ['tables', restaurantId],
        queryFn: async () => {
            const res = await api.get(`/tables/restaurant/${restaurantId}`);
            return res.data.data;
        },
        enabled: isOpen && !!restaurantId
    });

    // Fetch Menu
    const { data: menuItems = [], isLoading: loadingMenu } = useQuery({
        queryKey: ['menu', restaurantId],
        queryFn: async () => {
            const res = await api.get(`/menu/restaurant/${restaurantId}`);
            return res.data.data;
        },
        enabled: isOpen && !!restaurantId
    });

    const filteredMenu = useMemo(() => {
        return menuItems.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [menuItems, searchTerm]);

    const addToCart = (item) => {
        setCart(prev => {
            const existing = prev.find(i => i._id === item._id);
            if (existing) {
                return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
        toast.success(`Added ${item.name}`);
    };

    const removeFromCart = (itemId) => {
        setCart(prev => {
            const existing = prev.find(i => i._id === itemId);
            if (!existing) return prev;
            if (existing.quantity === 1) {
                return prev.filter(i => i._id !== itemId);
            }
            return prev.map(i => i._id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
        });
    };

    const cartTotal = useMemo(() => {
        return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    }, [cart]);

    const orderMutation = useMutation({
        mutationFn: async (orderData) => {
            return api.post('/orders', orderData);
        },
        onSuccess: (response) => {
            const newOrder = response.data.data;
            setPlacedOrder(newOrder);
            setStep(4);
            toast.success('Order placed successfully!');
            queryClient.invalidateQueries(['orders']);
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to place order');
        }
    });

    const handleSubmitOrder = () => {
        if (!selectedTable) return toast.error('Please select a table');
        if (cart.length === 0) return toast.error('Cart is empty');

        const orderData = {
            restaurant: restaurantId,
            table: selectedTable._id,
            items: cart.map(item => ({
                menuItem: item._id,
                quantity: item.quantity,
                price: item.price,
                name: item.name
            })),
            total: cartTotal,
            orderSource: 'POS',
            status: 'PENDING'
        };

        orderMutation.mutate(orderData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl bg-background rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-border"
            >
                {/* Header */}
                <div className="p-6 border-b border-border flex items-center justify-between bg-card">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            {step === 1 && <TableIcon className="text-primary" />}
                            {step === 2 && <Utensils className="text-primary" />}
                            {step === 3 && <ShoppingCart className="text-primary" />}
                            {step === 4 && <Check className="text-green-500" />}
                            {step === 1 ? 'Select Table' : step === 2 ? 'Add Items' : step === 3 ? 'Review Order' : 'Success'}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            {[1, 2, 3].map(s => (
                                <div
                                    key={s}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${step === s ? 'w-8 bg-primary' : step > s ? 'w-4 bg-primary/40' : 'w-4 bg-muted'}`}
                                />
                            ))}
                            {step === 4 && (
                                <div className="w-8 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* Step 1: Table Selection */}
                    {step === 1 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {loadingTables ? (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground">
                                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                    Loading Tables...
                                </div>
                            ) : tables.map(table => (
                                <button
                                    key={table._id}
                                    onClick={() => {
                                        setSelectedTable(table);
                                        setStep(2);
                                    }}
                                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${selectedTable?._id === table._id
                                        ? 'border-primary bg-primary/5 text-primary'
                                        : 'border-border hover:border-primary/50 bg-card hover:bg-muted/50'
                                        }`}
                                >
                                    <div className={`p-3 rounded-xl ${selectedTable?._id === table._id ? 'bg-primary/20' : 'bg-muted'}`}>
                                        <TableIcon size={24} />
                                    </div>
                                    <div className="font-bold text-lg">{table.name}</div>
                                    <div className="text-xs text-muted-foreground">{table.capacity} Seats</div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Step 2: Menu Selection */}
                    {step === 2 && (
                        <div className="flex flex-col h-full gap-6">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search menu items..."
                                    className="w-full bg-muted/50 border-none rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredMenu.map(item => (
                                    <div
                                        key={item._id}
                                        className="p-4 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-primary/40">
                                                        <Utensils size={24} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold">{item.name}</div>
                                                <div className="text-primary font-bold">${item.price.toFixed(2)}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => addToCart(item)}
                                            className="p-3 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Review */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/20 rounded-lg text-primary">
                                        <TableIcon size={20} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">Selected Table</div>
                                        <div className="font-bold text-lg">{selectedTable?.name}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setStep(1)}
                                    className="text-primary text-sm font-bold hover:underline"
                                >
                                    Change
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Order Items</div>
                                {cart.map(item => (
                                    <div key={item._id} className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl border border-border/50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-card flex items-center justify-center font-bold text-primary">
                                                {item.quantity}x
                                            </div>
                                            <div>
                                                <div className="font-bold">{item.name}</div>
                                                <div className="text-xs text-muted-foreground">${item.price.toFixed(2)} each</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="font-bold text-lg">${(item.price * item.quantity).toFixed(2)}</div>
                                            <div className="flex items-center bg-card rounded-xl border border-border overflow-hidden">
                                                <button onClick={() => removeFromCart(item._id)} className="p-2 hover:bg-muted text-muted-foreground"><Minus size={16} /></button>
                                                <button onClick={() => addToCart(item)} className="p-2 hover:bg-muted text-primary"><Plus size={16} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Success & Print */}
                    {step === 4 && placedOrder && (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center shadow-xl shadow-green-500/10 animate-bounce">
                                <Check size={48} strokeWidth={3} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-foreground antialiased tracking-tight mb-2">Order Confirmed!</h1>
                                <p className="text-muted-foreground max-w-xs mx-auto">
                                    Manual order <span className="text-primary font-bold">#{placedOrder.orderNumber.split('-')[2]}</span> has been placed successfully.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md pt-6">
                                <button
                                    onClick={() => setPrinting(true)}
                                    className="flex-1 bg-primary text-primary-foreground py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/30"
                                >
                                    <Printer size={18} />
                                    Print Receipt
                                </button>
                                <button
                                    onClick={() => {
                                        onClose();
                                        setStep(1);
                                        setSelectedTable(null);
                                        setCart([]);
                                        setPlacedOrder(null);
                                    }}
                                    className="flex-1 bg-muted text-muted-foreground py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-muted/80 transition-all"
                                >
                                    Done
                                </button>
                            </div>

                            {/* Print overlay - shows briefly while opening print window */}
                            {printing && (
                                <div style={{
                                    position: 'fixed', inset: 0, background: 'white', zIndex: 99999,
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16
                                }}>
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                                    <p className="text-sm text-muted-foreground">Opening print dialog...</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {step < 4 && (
                    <div className="p-6 border-t border-border bg-card flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            {cart.length > 0 && (
                                <div>
                                    <div className="text-xs text-muted-foreground uppercase font-black tracking-widest">Grand Total</div>
                                    <div className="text-2xl font-black text-foreground antialiased italic">${cartTotal.toFixed(2)}</div>
                                </div>
                            )}
                            {step > 1 && (
                                <button
                                    onClick={() => setStep(prev => prev - 1)}
                                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold transition-colors"
                                >
                                    <ArrowLeft size={18} />
                                    Back
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {step === 2 && cart.length > 0 && (
                                <button
                                    onClick={() => setStep(3)}
                                    className="bg-foreground text-background px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-foreground/90 transition-all flex items-center gap-2 shadow-xl shadow-black/10"
                                >
                                    <ShoppingCart size={18} />
                                    Review ({cart.length})
                                </button>
                            )}
                            {step === 3 && (
                                <button
                                    onClick={handleSubmitOrder}
                                    disabled={orderMutation.isPending}
                                    className="bg-primary text-primary-foreground px-10 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center gap-2 shadow-xl shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {orderMutation.isPending ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            Placing...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={18} strokeWidth={3} />
                                            Place Order
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

const ArrowLeft = ({ className, size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
);

export default ManualOrderModal;
