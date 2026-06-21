import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { X, Plus, Minus, Search, ShoppingBag } from 'lucide-react';

const TakeawayForm = ({ restaurantId, onClose, onSuccess }) => {
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [orderType, setOrderType] = useState('TAKEAWAY');
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const { data: menuData } = useQuery({
        queryKey: ['takeaway-menu', restaurantId],
        queryFn: async () => {
            const res = await api.get(`/menu/restaurant/${restaurantId}/active`);
            return res.data.data;
        },
        enabled: !!restaurantId
    });

    const menuItems = menuData || [];
    const categories = ['all', ...new Set(menuItems.map(i => i.category))];

    const filteredItems = menuItems.filter(item => {
        if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
        if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    const addItem = (menuItem) => {
        setSelectedItems(prev => {
            const existing = prev.find(i => i.menuItem === menuItem._id);
            if (existing) {
                return prev.map(i =>
                    i.menuItem === menuItem._id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [...prev, { menuItem: menuItem._id, name: menuItem.name, price: menuItem.price, quantity: 1 }];
        });
    };

    const updateQty = (menuItemId, delta) => {
        setSelectedItems(prev => {
            const updated = prev.map(i =>
                i.menuItem === menuItemId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i
            ).filter(i => i.quantity > 0);
            return updated;
        });
    };

    const subtotal = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const createMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post('/takeaway/order', {
                restaurantId,
                items: selectedItems.map(i => ({ menuItem: i.menuItem, quantity: i.quantity })),
                customerName,
                customerPhone,
                specialInstructions,
                orderType
            });
            return res.data.data;
        },
        onSuccess: (order) => {
            toast.success(`Order #${order.orderNumber} created`);
            onSuccess?.();
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to create order')
    });

    const handleSubmit = () => {
        if (!customerName.trim()) { toast.error('Customer name is required'); return; }
        if (!customerPhone.trim()) { toast.error('Customer phone is required'); return; }
        if (selectedItems.length === 0) { toast.error('Add at least one item'); return; }
        createMutation.mutate();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="font-bold text-foreground text-lg">New Takeaway Order</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Left: Customer Info + Menu */}
                    <div className="space-y-4">
                        {/* Customer Info */}
                        <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                            <h3 className="font-bold text-sm text-foreground">Customer Details</h3>
                            <div>
                                <label className="text-xs text-muted-foreground font-medium block mb-1">Name *</label>
                                <input
                                    value={customerName}
                                    onChange={e => setCustomerName(e.target.value)}
                                    placeholder="Customer name"
                                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground font-medium block mb-1">Phone *</label>
                                <input
                                    value={customerPhone}
                                    onChange={e => setCustomerPhone(e.target.value)}
                                    placeholder="Phone number"
                                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground font-medium block mb-1">Order Type</label>
                                <div className="flex gap-2">
                                    {['TAKEAWAY', 'DELIVERY'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setOrderType(type)}
                                            className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                                                orderType === type
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                            }`}
                                        >
                                            {type === 'TAKEAWAY' ? 'Takeaway' : 'Delivery'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground font-medium block mb-1">Instructions</label>
                                <textarea
                                    value={specialInstructions}
                                    onChange={e => setSpecialInstructions(e.target.value)}
                                    placeholder="Any special instructions..."
                                    rows={2}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
                                />
                            </div>
                        </div>

                        {/* Menu Browser */}
                        <div>
                            <div className="relative mb-3">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Search menu..."
                                    className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary"
                                />
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                                            selectedCategory === cat
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                                        }`}
                                    >
                                        {cat === 'all' ? 'All' : cat}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                                {filteredItems.map(item => (
                                    <button
                                        key={item._id}
                                        onClick={() => addItem(item)}
                                        disabled={!item.isAvailable}
                                        className="bg-card border border-border rounded-xl p-3 text-left hover:border-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <p className="font-bold text-xs text-foreground truncate">{item.name}</p>
                                        <p className="font-mono text-xs text-primary mt-0.5">₹{item.price}</p>
                                    </button>
                                ))}
                                {filteredItems.length === 0 && (
                                    <div className="col-span-2 text-center py-8 text-sm text-muted-foreground">
                                        No items found
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Order Summary */}
                    <div className="flex flex-col">
                        <h3 className="font-bold text-sm text-foreground mb-3 flex items-center gap-1.5">
                            <ShoppingBag size={14} />
                            Order Summary ({selectedItems.reduce((s, i) => s + i.quantity, 0)} items)
                        </h3>

                        <div className="flex-1 space-y-2 mb-4 max-h-[400px] overflow-y-auto">
                            {selectedItems.length === 0 ? (
                                <div className="text-center py-12 text-sm text-muted-foreground">
                                    No items added yet
                                </div>
                            ) : (
                                selectedItems.map(item => (
                                    <div key={item.menuItem} className="flex items-center justify-between bg-muted/20 rounded-xl p-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-xs text-foreground truncate">{item.name}</p>
                                            <p className="font-mono text-[10px] text-muted-foreground">₹{item.price} each</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => updateQty(item.menuItem, -1)}
                                                className="p-1 hover:bg-muted rounded-lg transition-colors"
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <span className="font-bold text-sm w-6 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQty(item.menuItem, 1)}
                                                className="p-1 hover:bg-muted rounded-lg transition-colors"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Totals */}
                        <div className="border-t border-border pt-3 space-y-1.5">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Subtotal</span>
                                <span className="font-mono">₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Tax</span>
                                <span className="font-mono">Calculated on order</span>
                            </div>
                            <div className="flex justify-between font-bold text-foreground pt-1.5 border-t border-border">
                                <span>Est. Total</span>
                                <span className="font-mono">₹{subtotal.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={createMutation.isPending}
                            className="w-full mt-4 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-[0.98]"
                        >
                            {createMutation.isPending ? 'Creating...' : `Place ${orderType === 'TAKEAWAY' ? 'Takeaway' : 'Delivery'} Order`}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default TakeawayForm;
