import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, TrendingUp } from 'lucide-react';

const POSSessionModal = ({ session, open, onClose, onOpen, onCloseSession, loading }) => {
    const [openingBalance, setOpeningBalance] = useState(0);
    const [closingBalance, setClosingBalance] = useState(0);
    const [notes, setNotes] = useState('');

    const isCloseMode = session?.status === 'OPEN';

    const handleSubmit = async () => {
        if (isCloseMode) {
            await onCloseSession({ closingBalance, notes });
        } else {
            await onOpen({ openingBalance, notes });
        }
    };

    return (
        <AnimatePresence>
            {open && (
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
                        <div className="flex items-center gap-2">
                            {isCloseMode ? <TrendingUp size={20} className="text-orange-500" /> : <Wallet size={20} className="text-green-500" />}
                            <h3 className="font-bold text-lg text-foreground">
                                {isCloseMode ? 'Close Session' : 'Open Session'}
                            </h3>
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {!isCloseMode && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground mb-1 block">
                                    Opening Balance (₹)
                                </label>
                                <input
                                    type="number"
                                    value={openingBalance}
                                    onChange={(e) => setOpeningBalance(Number(e.target.value) || 0)}
                                    className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    min="0"
                                    step="0.01"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground mb-1 block">
                                    Notes (optional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                    rows={2}
                                />
                            </div>
                        </div>
                    )}

                    {isCloseMode && (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted/30 rounded-xl space-y-2 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Opening Balance</span>
                                    <span className="font-bold font-mono">₹{session.openingBalance?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Total Sales</span>
                                    <span className="font-bold font-mono text-green-500">₹{session.totalSales?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Orders Processed</span>
                                    <span className="font-bold">{session.orderCount || 0}</span>
                                </div>
                                <div className="flex justify-between text-sm pt-2 border-t border-border">
                                    <span className="font-bold">Expected Balance</span>
                                    <span className="font-bold font-mono">₹{(session.openingBalance + session.totalSales)?.toFixed(2)}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground mb-1 block">
                                    Closing Balance (₹)
                                </label>
                                <input
                                    type="number"
                                    value={closingBalance}
                                    onChange={(e) => setClosingBalance(Number(e.target.value) || 0)}
                                    className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    min="0"
                                    step="0.01"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground mb-1 block">
                                    Notes (optional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                    rows={2}
                                />
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full py-3 mt-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                    >
                        {loading ? 'Processing...' : isCloseMode ? 'Close Session' : 'Open Session'}
                    </button>
                </motion.div>
            </motion.div>
            )}
        </AnimatePresence>
    );
};

export default POSSessionModal;
