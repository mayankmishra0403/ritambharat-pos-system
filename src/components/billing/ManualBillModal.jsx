import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../config/api';
import { X, Plus, Minus, Search, ShoppingCart, Printer, Receipt } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const ManualBillModal = ({ restaurantId, onClose, onSuccess }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [cart, setCart] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Fetch menu items
    const { data: menuItems = [], isLoading } = useQuery({
        queryKey: ['menuItems', restaurantId],
        queryFn: async () => {
            const res = await api.get(`/menu/restaurant/${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId
    });

    const { data: restaurant } = useQuery({
        queryKey: ['restaurant', restaurantId],
        queryFn: async () => {
            const res = await api.get(`/restaurant/${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId
    });

    const taxRate = restaurant?.taxRate || 0;

    // Get unique categories
    const categories = useMemo(() => {
        const cats = ['all', ...new Set(menuItems.map(item => item.category))];
        return cats;
    }, [menuItems]);

    // Filter menu items
    const filteredItems = useMemo(() => {
        return menuItems.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
            return matchesSearch && matchesCategory && item.isAvailable;
        });
    }, [menuItems, searchTerm, selectedCategory]);

    // Cart operations
    const addToCart = (item) => {
        setCart(prev => {
            const existing = prev.find(i => i._id === item._id);
            if (existing) {
                return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const removeFromCart = (itemId) => {
        setCart(prev => {
            const item = prev.find(i => i._id === itemId);
            if (item && item.quantity > 1) {
                return prev.map(i => i._id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
            }
            return prev.filter(i => i._id !== itemId);
        });
    };

    const clearCart = () => setCart([]);

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    // Generate manual bill
    const handleGenerateBill = async () => {
        if (cart.length === 0) {
            toast.error('Please add items to the cart');
            return;
        }

        setIsProcessing(true);
        try {
            const billData = {
                restaurantId,
                items: cart.map(item => ({
                    menuItem: item._id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                })),
                subtotal,
                tax,
                total,
                customerName: customerName || undefined,
                customerPhone: customerPhone || undefined,
                paymentMethod: 'CASH',
                paymentStatus: 'PAID'
            };

            const res = await api.post('/payments/manual-bill', billData);
            const createdBill = res.data.data;

            toast.success('Bill created successfully!');
            clearCart();

            // Pass the bill to parent for printing
            onSuccess(createdBill);

        } catch (error) {
            console.error('Failed to create manual bill:', error);
            toast.error(error.response?.data?.message || 'Failed to create bill');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-background border border-border rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <ShoppingCart className="text-primary" />
                            Manual Bill Creation
                        </h2>
                        <p className="text-muted-foreground text-sm mt-1">Select items and generate a bill</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex">
                    {/* Left: Menu Items */}
                    <div className="flex-1 flex flex-col border-r border-border">
                        {/* Search and Filters */}
                        <div className="p-4 border-b border-border space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search menu items..."
                                    className="w-full bg-muted/50 border-none rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                            }`}
                                    >
                                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Menu Items Grid */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                                </div>
                            ) : filteredItems.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    No items found
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                    {filteredItems.map(item => (
                                        <motion.div
                                            key={item._id}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => addToCart(item)}
                                            className="bg-card border border-border rounded-xl p-3 cursor-pointer hover:border-primary/50 transition-all"
                                        >
                                            <h4 className="font-semibold text-sm mb-1 line-clamp-1">{item.name}</h4>
                                            <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{item.description}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-primary">{item.price.toFixed(2)}</span>
                                                <Plus size={16} className="text-primary" />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Cart */}
                    <div className="w-96 flex flex-col">
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <h3 className="font-bold text-lg">Cart ({cart.length})</h3>
                            {cart.length > 0 && (
                                <button
                                    onClick={clearCart}
                                    className="text-xs text-destructive hover:underline"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                    <ShoppingCart size={48} className="mb-3 opacity-20" />
                                    <p className="text-sm">Cart is empty</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div
                                        key={item._id}
                                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                                    >
                                        <div className="flex-1 min-w-0 pr-3">
                                            <p className="font-medium text-sm truncate">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.price.toFixed(2)} x {item.quantity}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 bg-background rounded-lg p-1">
                                                <button
                                                    onClick={() => removeFromCart(item._id)}
                                                    className="p-1 hover:bg-muted rounded transition-colors"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => addToCart(item)}
                                                    className="p-1 hover:bg-muted rounded transition-colors"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <span className="font-bold text-sm min-w-[60px] text-right">
                                                {(item.price * item.quantity).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Customer Details */}
                        <div className="p-4 border-t border-border space-y-2">
                            <input
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                                placeholder="Customer name (optional)"
                                className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                            />
                            <input
                                value={customerPhone}
                                onChange={e => setCustomerPhone(e.target.value)}
                                placeholder="Phone number (optional)"
                                className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                            />
                        </div>

                        {/* Totals */}
                        <div className="p-4 border-t border-border bg-muted/20 space-y-3">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-medium">{subtotal.toFixed(2)}</span>
                                </div>
                                {taxRate > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                                        <span className="font-medium">{tax.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                                    <span>Total</span>
                                    <span className="text-primary">{total.toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleGenerateBill}
                                disabled={cart.length === 0 || isProcessing}
                                className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Printer size={18} />
                                        Generate & Print Bill
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ManualBillModal;
