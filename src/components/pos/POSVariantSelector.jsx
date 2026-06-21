import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const POSVariantSelector = ({ item, open, onClose }) => {
    if (!open || !item) return null;

    const variants = item.variants || [];
    const addOns = item.addOns || [];

    if (variants.length === 0 && addOns.length === 0) {
        onClose();
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-foreground">{item.name}</h3>
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {variants.length > 0 && (
                        <div className="mb-4">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Variants</h4>
                            <div className="flex flex-wrap gap-2">
                                {variants.map((v, idx) => (
                                    <button
                                        key={idx}
                                        className="px-3 py-1.5 bg-muted/50 border border-border rounded-lg text-xs font-medium hover:border-primary/30 hover:bg-primary/5 transition-colors"
                                    >
                                        {v.name}
                                        {v.price && <span className="ml-1 text-primary">+₹{v.price}</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {addOns.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Add-ons</h4>
                            <div className="flex flex-wrap gap-2">
                                {addOns.map((a, idx) => (
                                    <button
                                        key={idx}
                                        className="px-3 py-1.5 bg-muted/50 border border-border rounded-lg text-xs font-medium hover:border-primary/30 hover:bg-primary/5 transition-colors"
                                    >
                                        {a.name} <span className="text-primary">+₹{a.price}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default POSVariantSelector;
