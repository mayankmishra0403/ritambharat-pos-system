import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Banknote, CreditCard, Smartphone, Check, Plus, Split } from 'lucide-react';

const PAYMENT_METHODS = [
    { id: 'CASH', label: 'Cash', icon: Banknote, color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20' },
    { id: 'CARD', label: 'Card', icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
    { id: 'UPI', label: 'UPI', icon: Smartphone, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20' },
];

const POSPaymentModal = ({ order, open, onClose, onPayment, loading }) => {
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [amountPaid, setAmountPaid] = useState(order?.total || 0);
    const [splitMode, setSplitMode] = useState(false);
    const [splitPayments, setSplitPayments] = useState([]);

    if (!open || !order) return null;

    const remaining = splitMode
        ? order.total - splitPayments.reduce((sum, s) => sum + (s.amount || 0), 0)
        : 0;

    const handleSinglePayment = async () => {
        await onPayment({
            orderId: order._id,
            paymentMethod,
            amountPaid: paymentMethod === 'CASH' ? amountPaid : order.total
        });
    };

    const handleSplitPayment = async () => {
        for (const split of splitPayments) {
            if (split.amount > 0 && split.method) {
                await onPayment({
                    orderId: order._id,
                    paymentMethod: split.method,
                    amountPaid: split.amount
                });
            }
        }
    };

    const addSplit = () => {
        setSplitPayments([...splitPayments, { method: 'CASH', amount: 0 }]);
    };

    const updateSplit = (idx, field, value) => {
        setSplitPayments(prev => prev.map((s, i) =>
            i === idx ? { ...s, [field]: value } : s
        ));
    };

    const removeSplit = (idx) => {
        setSplitPayments(prev => prev.filter((_, i) => i !== idx));
    };

    const renderChange = () => {
        if (paymentMethod !== 'CASH' || splitMode) return null;
        const change = amountPaid - order.total;
        if (change > 0) {
            return (
                <div className="mt-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <p className="text-xs text-green-500 font-bold text-center">
                        Change Due: ₹{change.toFixed(2)}
                    </p>
                </div>
            );
        }
        return null;
    };

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
                        <div>
                            <h3 className="font-bold text-lg text-foreground">Process Payment</h3>
                            <p className="text-xs text-muted-foreground">Order #{order.orderNumber}</p>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => { setSplitMode(!splitMode); setSplitPayments([]); }}
                                className={`p-1.5 rounded-lg transition-colors ${splitMode ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
                                title="Split payment"
                            >
                                <Split size={16} />
                            </button>
                            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="mb-6 text-center">
                        <p className="text-2xl font-black text-foreground font-mono">
                            ₹{order.total?.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {splitMode ? `Remaining: ₹${remaining.toFixed(2)}` : 'Total Amount'}
                        </p>
                    </div>

                    {splitMode ? (
                        <div className="space-y-3 mb-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-muted-foreground">Split Payments</span>
                                <button
                                    onClick={addSplit}
                                    className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-bold hover:bg-primary/20 transition-colors"
                                >
                                    <Plus size={10} />
                                    Add
                                </button>
                            </div>
                            {splitPayments.map((split, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <select
                                        value={split.method}
                                        onChange={e => updateSplit(idx, 'method', e.target.value)}
                                        className="bg-muted/30 border border-border rounded-lg px-2 py-2 text-xs font-bold"
                                    >
                                        {PAYMENT_METHODS.map(m => (
                                            <option key={m.id} value={m.id}>{m.label}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        value={split.amount || ''}
                                        onChange={e => updateSplit(idx, 'amount', Number(e.target.value) || 0)}
                                        placeholder="Amount"
                                        className="flex-1 px-3 py-2 bg-muted/30 border border-border rounded-lg text-xs font-bold text-center"
                                        min={0}
                                        max={remaining + (split.amount || 0)}
                                    />
                                    <button
                                        onClick={() => removeSplit(idx)}
                                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            {splitPayments.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-4">
                                    Add payment splits (e.g. pay ₹500 cash + ₹800 card)
                                </p>
                            )}
                            {Math.abs(remaining) < 0.01 && splitPayments.length > 0 && (
                                <div className="p-2 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                                    <p className="text-xs text-green-500 font-bold">Total matched</p>
                                </div>
                            )}
                            <button
                                onClick={handleSplitPayment}
                                disabled={loading || splitPayments.length === 0 || Math.abs(remaining) > 0.01}
                                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                            >
                                {loading ? 'Processing...' : `Process Split Payments`}
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                {PAYMENT_METHODS.map((method) => {
                                    const Icon = method.icon;
                                    const isSelected = paymentMethod === method.id;
                                    return (
                                        <button
                                            key={method.id}
                                            onClick={() => setPaymentMethod(method.id)}
                                            className={`
                                                p-4 rounded-xl border-2 text-center transition-all
                                                ${isSelected
                                                    ? `${method.bg} ${method.color} shadow-md`
                                                    : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/50'
                                                }
                                            `}
                                        >
                                            <Icon size={24} className="mx-auto mb-1.5" />
                                            <span className="text-xs font-bold block">{method.label}</span>
                                            {isSelected && <Check size={14} className="mx-auto mt-1" />}
                                        </button>
                                    );
                                })}
                            </div>

                            {paymentMethod === 'CASH' && (
                                <div className="mb-4">
                                    <label className="text-xs font-bold text-muted-foreground mb-1 block">Amount Received</label>
                                    <input
                                        type="number"
                                        value={amountPaid}
                                        onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                                        className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        min={order.total}
                                        step="0.01"
                                        autoFocus
                                    />
                                    {renderChange()}
                                </div>
                            )}

                            <button
                                onClick={handleSinglePayment}
                                disabled={loading || (paymentMethod === 'CASH' && amountPaid < order.total)}
                                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                            >
                                {loading ? 'Processing...' : `Pay ₹${order.total?.toFixed(2)}`}
                            </button>
                        </>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default POSPaymentModal;
