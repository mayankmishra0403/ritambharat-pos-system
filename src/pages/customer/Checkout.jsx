import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, ChevronDown, ChevronUp, CheckCircle, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useOfflineSync } from '../../context/OfflineSyncContext';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const Checkout = () => {
    const { cart, cartTotal, clearCart } = useCart();
    const { isOnline, addToQueue } = useOfflineSync();
    const { restaurant, tableId } = useOutletContext();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState(true);

    // Simplified Calculations
    const taxRate = restaurant?.taxRate || 0;
    const subtotal = cartTotal;
    const tax = subtotal * (taxRate / 100);
    const finalTotal = subtotal + tax;

    const handleSubmit = async () => {
        if (!tableId) {
            toast.error("Table ID is missing. Please scan the QR code again.");
            return;
        }

        const securityToken = searchParams.get('token') || localStorage.getItem('ritam_bharat_pos_security_token');

        const orderData = {
            restaurant: restaurant._id,
            table: tableId,
            securityToken, // Include token for server-side validation
            items: cart.map(item => ({
                menuItem: item._id,
                quantity: item.quantity,
                specialInstructions: item.specialInstructions
            })),
            customerName: "Guest", // Default name
            customerPhone: "0000000000", // Default phone
            totalAmount: finalTotal,
            notes: "Placed via Simplified Checkout"
        };

        if (!isOnline) {
            addToQueue(orderData);
            clearCart();
            navigate(`/menu/${restaurant._id}/order-tracking`); // Tracking page handles queue/history
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/orders', orderData);

            if (res.data.success) {
                clearCart();
                localStorage.setItem('ritam_bharat_pos_last_order_id', res.data.data._id);
                toast.success("Order placed successfully!");
                navigate(`/menu/${restaurant._id}/order-tracking/${res.data.data._id}`);
            }
        } catch (error) {
            console.error('Order error:', error);
            toast.error(error.response?.data?.message || "Failed to place order");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (cart.length === 0) {
            navigate(`/menu/${restaurant?._id}/cart`);
        }
    }, [cart.length, navigate]);

    if (cart.length === 0) {
        return null;
    }

    return (
        <div className="pb-40 px-4 md:px-0 max-w-xl mx-auto">
            {/* Header */}
            <div className="pt-6 mb-6 text-center">
                <h1 className="text-3xl font-bold mb-2">Confirm Order</h1>
                <p className="text-gray-400 text-sm">Review your items and send to kitchen.</p>
            </div>

            <div className="space-y-6">

                {/* Restaurant Info Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-white">{restaurant?.name}</h3>
                        <p className="text-xs text-gray-400">Table attached</p>
                    </div>
                    <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold">
                        Dine-in
                    </div>
                </div>

                {/* Order Summary Accordion */}
                <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setIsOrderSummaryOpen(!isOrderSummaryOpen)}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                    >
                        <span className="font-semibold flex items-center gap-2">
                            <span className="bg-primary text-black text-xs font-bold px-2 py-0.5 rounded-full">{cart.reduce((acc, i) => acc + i.quantity, 0)}</span>
                            Order Summary
                        </span>
                        {isOrderSummaryOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>

                    <AnimatePresence initial={false}>
                        {isOrderSummaryOpen && (
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="p-4 pt-0 space-y-3 border-t border-white/10">
                                    {cart.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm py-2 border-b border-white/5 last:border-0">
                                            <div className="text-gray-300">
                                                <span className="font-bold text-primary mr-2">{item.quantity}x</span>
                                                {item.name}
                                                {item.specialInstructions && (
                                                    <p className="text-xs text-gray-500 mt-0.5 italic">Note: {item.specialInstructions}</p>
                                                )}
                                            </div>
                                            <div className="font-mono text-gray-400">{(item.price * item.quantity).toFixed(2)}</div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Total Breakdown */}
                <div className="bg-white/5 rounded-2xl border border-white/10 p-4 space-y-2">
                    <div className="flex justify-between text-gray-400 text-sm">
                        <span>Subtotal</span>
                        <span>{subtotal.toFixed(2)}</span>
                    </div>
                    {taxRate > 0 && (
                        <div className="flex justify-between text-gray-400 text-sm">
                            <span>Tax ({taxRate}%)</span>
                            <span>{tax.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-white/10 mt-2">
                        <span>Total</span>
                        <span className="text-primary">{finalTotal.toFixed(2)}</span>
                    </div>
                </div>

                {/* Place Order Button */}
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-primary text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
                >
                    {loading ? <Loader2 className="animate-spin" /> : (
                        <>
                            Check Out <ArrowRight size={20} />
                        </>
                    )}
                </button>

                <p className="text-center text-xs text-gray-500">
                    By placing this order, you agree to pay the total amount shown above.
                </p>

            </div>
        </div>
    );
};

export default Checkout;
