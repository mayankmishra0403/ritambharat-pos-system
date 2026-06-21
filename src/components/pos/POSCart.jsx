import { Minus, Plus, Trash2, Percent } from 'lucide-react';

const POSCart = ({ cartItems, onUpdateQty, onRemoveItem, discount, serviceCharge, onDiscountChange, onServiceChargeChange, taxRate = 0, currency = 'INR' }) => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = discount ? (subtotal * discount) / 100 : 0;
    const taxAmount = ((subtotal - discountAmount) * taxRate) / 100;
    const scAmount = serviceCharge ? (subtotal * serviceCharge) / 100 : 0;
    const total = subtotal - discountAmount + taxAmount + scAmount;

    const formatPrice = (val) => `${currency === 'INR' ? '₹' : '$'}${val.toFixed(2)}`;

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 min-h-0">
                {cartItems.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
                        <span className="text-2xl opacity-20">🛒</span>
                        <span className="text-xs font-medium">Cart is empty</span>
                        <span className="text-[10px] text-muted-foreground/60">Select items from menu</span>
                    </div>
                )}
                {cartItems.map((item, idx) => (
                    <div key={`${item.menuItem}-${idx}`} className="flex items-center gap-2 p-2.5 bg-card border border-border rounded-xl">
                        <div className="flex-1 min-w-0">
                            <span className="text-sm font-bold text-foreground block truncate">{item.name}</span>
                            <span className="text-xs font-medium text-primary">{formatPrice(item.price)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => onUpdateQty(idx, Math.max(1, item.quantity - 1))}
                                className="p-1 rounded-md bg-muted/50 text-muted-foreground hover:bg-muted transition-colors"
                            >
                                <Minus size={12} />
                            </button>
                            <span className="w-6 text-center text-sm font-bold font-mono">{item.quantity}</span>
                            <button
                                onClick={() => onUpdateQty(idx, item.quantity + 1)}
                                className="p-1 rounded-md bg-muted/50 text-muted-foreground hover:bg-muted transition-colors"
                            >
                                <Plus size={12} />
                            </button>
                        </div>
                        <button
                            onClick={() => onRemoveItem(idx)}
                            className="p-1.5 rounded-md text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>

            {cartItems.length > 0 && (
                <div className="border-t border-border pt-3 mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                        <Percent size={12} className="text-muted-foreground" />
                        <input
                            type="number"
                            placeholder="Discount %"
                            value={discount || ''}
                            onChange={(e) => onDiscountChange(Number(e.target.value) || 0)}
                            className="w-20 px-2 py-1 bg-muted/50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                            min="0"
                            max="100"
                        />
                        <span className="text-xs text-muted-foreground">SC %</span>
                        <input
                            type="number"
                            placeholder="Service charge %"
                            value={serviceCharge || ''}
                            onChange={(e) => onServiceChargeChange(Number(e.target.value) || 0)}
                            className="w-20 px-2 py-1 bg-muted/50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                            min="0"
                            max="100"
                        />
                    </div>

                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span className="font-mono">{formatPrice(subtotal)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-green-500">
                                <span>Discount ({discount}%)</span>
                                <span className="font-mono">-{formatPrice(discountAmount)}</span>
                            </div>
                        )}
                        {taxRate > 0 && (
                            <div className="flex justify-between text-muted-foreground">
                                <span>Tax ({taxRate}%)</span>
                                <span className="font-mono">{formatPrice(taxAmount)}</span>
                            </div>
                        )}
                        {serviceCharge > 0 && (
                            <div className="flex justify-between text-muted-foreground">
                                <span>Service Charge ({serviceCharge}%)</span>
                                <span className="font-mono">{formatPrice(scAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between pt-1.5 border-t border-border text-sm font-bold text-foreground">
                            <span>Total</span>
                            <span className="font-mono">{formatPrice(total)}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POSCart;
