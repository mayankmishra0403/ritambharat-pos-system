import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';

const WaiterCart = ({ items, menuItems, onUpdateQuantity, onRemoveItem, onPlaceOrder, loading, restaurant }) => {
    const getItemDetails = (menuItemId) => {
        return menuItems.find(m => m._id === menuItemId);
    };

    const subtotal = items.reduce((sum, item) => {
        const details = getItemDetails(item.menuItem);
        return sum + (details?.price || 0) * item.quantity;
    }, 0);

    const tax = (subtotal * (restaurant?.taxRate || 0)) / 100;
    const total = subtotal + tax;

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-3">
                <ShoppingCart size={16} className="text-primary" />
                <span className="font-bold text-sm text-foreground">Cart</span>
                <span className="ml-auto bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                    {items.length} items
                </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
                <AnimatePresence mode="popLayout">
                    {items.map((item, idx) => {
                        const details = getItemDetails(item.menuItem);

                        return (
                            <motion.div
                                key={item.menuItem}
                                layout
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex items-center gap-2 p-2.5 bg-card border border-border rounded-xl"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-foreground truncate">{details?.name || item.name}</p>
                                    <p className="text-xs text-muted-foreground">₹{(details?.price || 0).toFixed(2)} each</p>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => onUpdateQuantity(item.menuItem, -1)}
                                        className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground"
                                        disabled={item.quantity <= 1}
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                                    <button
                                        onClick={() => onUpdateQuantity(item.menuItem, 1)}
                                        className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>

                                <button
                                    onClick={() => onRemoveItem(item.menuItem)}
                                    className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {items.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/50">
                        <ShoppingCart size={32} className="opacity-20 mb-2" />
                        <p className="text-xs font-medium">Cart is empty</p>
                    </div>
                )}
            </div>

            {items.length > 0 && (
                <div className="border-t border-border pt-3 mt-3 space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Subtotal</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Tax ({(restaurant?.taxRate || 0)}%)</span>
                        <span>₹{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-foreground">
                        <span>Total</span>
                        <span>₹{total.toFixed(2)}</span>
                    </div>

                    <button
                        onClick={onPlaceOrder}
                        disabled={loading}
                        className="w-full py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Placing Order...' : 'Place Order'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default WaiterCart;
