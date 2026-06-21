import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const GstSlabForm = ({ slab, open, onClose, onSave, loading }) => {
    const [form, setForm] = useState({
        name: slab?.name || '',
        rate: slab?.rate || 0,
        cgstRate: slab?.cgstRate || 0,
        sgstRate: slab?.sgstRate || 0,
        igstRate: slab?.igstRate || 0,
        isDefault: slab?.isDefault || false,
        isInterState: slab?.isInterState || false
    });

    if (!open) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onSave(form);
    };

    return (
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
                    <h3 className="font-bold text-lg text-foreground">
                        {slab ? 'Edit Tax Slab' : 'Add Tax Slab'}
                    </h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-muted-foreground mb-1 block">Name</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-muted-foreground mb-1 block">Total Rate (%)</label>
                            <input
                                type="number"
                                value={form.rate}
                                onChange={(e) => setForm({ ...form, rate: Number(e.target.value) || 0 })}
                                className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                min="0" max="100" step="0.1"
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                            <input
                                type="checkbox"
                                id="isDefault"
                                checked={form.isDefault}
                                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                                className="rounded border-border"
                            />
                            <label htmlFor="isDefault" className="text-xs font-medium text-muted-foreground">Set as default</label>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs font-bold text-muted-foreground mb-1 block">CGST (%)</label>
                            <input
                                type="number"
                                value={form.cgstRate}
                                onChange={(e) => setForm({ ...form, cgstRate: Number(e.target.value) || 0 })}
                                className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                min="0" max="100" step="0.1"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-muted-foreground mb-1 block">SGST (%)</label>
                            <input
                                type="number"
                                value={form.sgstRate}
                                onChange={(e) => setForm({ ...form, sgstRate: Number(e.target.value) || 0 })}
                                className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                min="0" max="100" step="0.1"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-muted-foreground mb-1 block">IGST (%)</label>
                            <input
                                type="number"
                                value={form.igstRate}
                                onChange={(e) => setForm({ ...form, igstRate: Number(e.target.value) || 0 })}
                                className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                min="0" max="100" step="0.1"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isInterState"
                            checked={form.isInterState}
                            onChange={(e) => setForm({ ...form, isInterState: e.target.checked })}
                            className="rounded border-border"
                        />
                        <label htmlFor="isInterState" className="text-xs font-medium text-muted-foreground">Inter-state (IGST instead of CGST+SGST)</label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all"
                    >
                        {loading ? 'Saving...' : slab ? 'Update Slab' : 'Create Slab'}
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default GstSlabForm;
