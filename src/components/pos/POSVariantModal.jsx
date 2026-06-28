import { useState } from 'react';
import { X, Plus, Check, Minus } from 'lucide-react';

const POSVariantModal = ({ item, onConfirm, onClose }) => {
    const hasVariants = item.variants && item.variants.length > 0;
    const hasModifiers = item.modifiers && item.modifiers.length > 0;

    const defaultVariant = hasVariants
        ? item.variants.find(v => v.isDefault) || item.variants[0]
        : null;

    const [selectedVariant, setSelectedVariant] = useState(defaultVariant);
    const [selectedModifiers, setSelectedModifiers] = useState([]);
    const [quantity, setQuantity] = useState(1);

    const basePrice = selectedVariant ? selectedVariant.price : item.price;
    const modTotal = selectedModifiers.reduce((sum, m) => sum + m.price, 0);
    const unitPrice = basePrice + modTotal;
    const totalPrice = unitPrice * quantity;

    const toggleModifier = (mod) => {
        setSelectedModifiers(prev => {
            const exists = prev.find(m => m.name === mod.name);
            if (exists) {
                return prev.filter(m => m.name !== mod.name);
            }
            if (prev.length >= mod.maxSelect) {
                return [...prev.slice(1), { name: mod.name, price: mod.price }];
            }
            return [...prev, { name: mod.name, price: mod.price }];
        });
    };

    const handleConfirm = () => {
        onConfirm({
            menuItem: item._id,
            name: item.name,
            price: unitPrice,
            quantity,
            variant: selectedVariant ? { name: selectedVariant.name, price: selectedVariant.price } : null,
            modifiers: selectedModifiers.length > 0 ? selectedModifiers : null,
            specialInstructions: ''
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card border border-border rounded-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="font-bold text-foreground text-sm">{item.name}</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
                        <X size={16} className="text-muted-foreground" />
                    </button>
                </div>

                <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">

                    {hasVariants && (
                        <div>
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Variant</h4>
                            <div className="space-y-1">
                                {item.variants.map(v => (
                                    <button
                                        key={v.name}
                                        onClick={() => setSelectedVariant(v)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                                            selectedVariant?.name === v.name
                                                ? 'border-primary bg-primary/5 text-primary'
                                                : 'border-border bg-card hover:border-primary/30'
                                        }`}
                                    >
                                        <span className="text-sm font-bold">{v.name}</span>
                                        <span className="text-sm font-mono font-bold">₹{v.price}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {hasModifiers && (
                        <div>
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                Add-ons
                                {item.modifiers.some(m => m.maxSelect > 1) && (
                                    <span className="ml-1 text-[10px] font-normal text-muted-foreground/60">
                                        (multi-select)
                                    </span>
                                )}
                            </h4>
                            <div className="space-y-1">
                                {item.modifiers.map(mod => {
                                    const isSelected = selectedModifiers.find(m => m.name === mod.name);
                                    return (
                                        <button
                                            key={mod.name}
                                            onClick={() => toggleModifier(mod)}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                                                isSelected
                                                    ? 'border-green-500 bg-green-500/5 text-green-600'
                                                    : 'border-border bg-card hover:border-primary/30'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                                    isSelected ? 'bg-green-500 border-green-500 text-white' : 'border-border'
                                                }`}>
                                                    {isSelected && <Check size={10} />}
                                                </div>
                                                <span className="text-sm font-medium">{mod.name}</span>
                                            </div>
                                            {mod.price > 0 && (
                                                <span className="text-xs font-mono text-muted-foreground">+₹{mod.price}</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div>
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Quantity</h4>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted transition-colors"
                            >
                                <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-lg font-bold font-mono">{quantity}</span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted transition-colors"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>

                </div>

                <div className="p-4 border-t border-border">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-muted-foreground">Total</span>
                        <span className="text-lg font-bold font-mono text-primary">₹{totalPrice.toFixed(2)}</span>
                    </div>
                    <button
                        onClick={handleConfirm}
                        className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <Plus size={16} />
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
};

export default POSVariantModal;