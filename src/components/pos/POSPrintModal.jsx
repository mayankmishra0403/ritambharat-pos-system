import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Receipt, ArrowRight, ChefHat } from 'lucide-react';
import printInvoice from '../../utils/printInvoice';
import printKOT from '../../utils/printKOT';
import toast from 'react-hot-toast';

const POSPrintModal = ({ order, restaurant, settings, open, onClose, onProceedToPayment }) => {
    const [printing, setPrinting] = useState(null);

    if (!open || !order) return null;

    const handlePrintBill = () => {
        if (printing) return;
        setPrinting('bill');
        setTimeout(() => {
            try {
                const win = window.open('', '_blank');
                if (!win) {
                    toast.error('Popup blocked! Allow popups for this site.');
                    setPrinting(null);
                    return;
                }
                const html = printInvoice(order, restaurant, settings);
                win.document.write(html);
                win.document.close();
                toast.success('Bill sent to printer...');
            } catch (err) {
                toast.error('Failed to print bill');
            }
            setPrinting(null);
        }, 300);
    };

    const handlePrintKOT = () => {
        if (printing) return;
        setPrinting('kot');
        setTimeout(() => {
            try {
                const win = window.open('', '_blank');
                if (!win) {
                    toast.error('Popup blocked! Allow popups for this site.');
                    setPrinting(null);
                    return;
                }
                const html = printKOT(order, restaurant);
                win.document.write(html);
                win.document.close();
                toast.success('KOT sent to printer...');
            } catch (err) {
                toast.error('Failed to print KOT');
            }
            setPrinting(null);
        }, 300);
    };

    const itemCount = (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);

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
                    className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-bold text-lg text-foreground">Order Created</h3>
                            <p className="text-xs text-muted-foreground">#{order.orderNumber} · {itemCount} items · ₹{order.total?.toFixed(2)}</p>
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handlePrintBill}
                            disabled={printing !== null}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-[0.98]"
                        >
                            <Receipt size={16} />
                            {printing === 'bill' ? 'Printing Bill...' : 'Print Bill'}
                        </button>

                        <button
                            onClick={handlePrintKOT}
                            disabled={printing !== null}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-all active:scale-[0.98]"
                        >
                            <ChefHat size={16} />
                            {printing === 'kot' ? 'Printing KOT...' : 'Print KOT (Kitchen)'}
                        </button>

                        <div className="border-t border-border my-1" />

                        <button
                            onClick={() => {
                                onClose();
                                if (onProceedToPayment) {
                                    setTimeout(() => onProceedToPayment(order), 200);
                                }
                            }}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all active:scale-[0.98]"
                        >
                            <ArrowRight size={16} />
                            Proceed to Payment
                        </button>

                        <button
                            onClick={onClose}
                            className="flex items-center justify-center gap-2 w-full py-2.5 bg-muted/30 text-muted-foreground font-bold rounded-xl hover:bg-muted/50 transition-all text-sm"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default POSPrintModal;
