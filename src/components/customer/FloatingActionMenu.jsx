import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Bell, Receipt, X, Send, Bot, ChefHat } from 'lucide-react';
import { Link, useOutletContext, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';
import api from '../../config/api';

const FloatingActionMenu = ({ restaurant, tableId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isCallingWaiter, setIsCallingWaiter] = useState(false);

    const { cart } = useCart();
    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    const location = useLocation();

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const handleCallWaiter = async () => {
        const orderId = localStorage.getItem('ritam_bharat_pos_last_order_id');
        if (!orderId) {
            toast.error("Please place an order first to call a waiter.");
            return;
        }

        if (!tableId || !restaurant?._id) {
            toast.error('Table information not available');
            return;
        }

        setIsCallingWaiter(true);
        try {
            await api.post('/service/request', {
                restaurant: restaurant._id,
                table: tableId,
                type: 'CALL_WAITER',
                comment: 'Customer called for assistance'
            });
            toast.success("Waiter notified! They'll be with you shortly.", {
                icon: '🔔',
            });
            setIsOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to call waiter');
        } finally {
            setIsCallingWaiter(false);
        }
    };

    const handleRequestBill = async () => {
        const orderId = localStorage.getItem('ritam_bharat_pos_last_order_id');
        if (!orderId) {
            toast.error("Please place an order first to request the bill.");
            return;
        }

        if (!tableId || !restaurant?._id) {
            toast.error('Table information not available');
            return;
        }

        try {
            await api.post('/service/request', {
                restaurant: restaurant._id,
                table: tableId,
                type: 'REQUEST_BILL',
                comment: 'Customer requested bill'
            });
            toast.success("Bill requested! A waiter will bring it shortly.", {
                icon: '🧾',
            });
            setIsOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to request bill');
        }
    };

    return (
        <>
            {/* Main FAB + Speed Dial */}
            <motion.div
                drag
                dragConstraints={{ left: -400, right: 50, top: -700, bottom: 50 }}
                dragElastic={0.15}
                dragMomentum={true}
                dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
                whileDrag={{ scale: 1.05 }}
                className="fixed bottom-28 sm:bottom-6 right-4 z-50 flex flex-col-reverse items-end gap-3 touch-none"
            >
                {/* Speed Dial Actions */}
                <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsOpen(false)}
                                className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
                            />

                            {/* Action Buttons */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col gap-3 items-end"
                            >
                                {/* View Cart */}
                                <motion.div
                                    initial={{ scale: 0, x: 20 }}
                                    animate={{ scale: 1, x: 0 }}
                                    exit={{ scale: 0, x: 20 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <Link
                                        to={`/menu/${restaurant?._id}/cart${tableId ? `?table=${tableId}` : ''}`}
                                        className="bg-white text-black px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 active:scale-95 transition-all font-semibold text-sm min-h-[48px] whitespace-nowrap"
                                    >
                                        View Cart <ShoppingBag size={18} className="text-primary" />
                                    </Link>
                                </motion.div>

                                {/* Call Waiter */}
                                {tableId && (
                                    <motion.div
                                        initial={{ scale: 0, x: 20 }}
                                        animate={{ scale: 1, x: 0 }}
                                        exit={{ scale: 0, x: 20 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <button
                                            onClick={handleCallWaiter}
                                            disabled={isCallingWaiter}
                                            className="bg-white text-black px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 active:scale-95 transition-all font-semibold text-sm min-h-[48px] whitespace-nowrap disabled:opacity-50"
                                        >
                                            Call Waiter <Bell size={18} className="text-orange-500" />
                                        </button>
                                    </motion.div>
                                )}

                                {/* Request Bill */}
                                {tableId && (
                                    <motion.div
                                        initial={{ scale: 0, x: 20 }}
                                        animate={{ scale: 1, x: 0 }}
                                        exit={{ scale: 0, x: 20 }}
                                        transition={{ delay: 0.25 }}
                                    >
                                        <button
                                            onClick={handleRequestBill}
                                            className="bg-white text-black px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 active:scale-95 transition-all font-semibold text-sm min-h-[48px] whitespace-nowrap"
                                        >
                                            Request Bill <Receipt size={18} className="text-green-600" />
                                        </button>
                                    </motion.div>
                                )}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Main FAB Button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleMenu}
                    className={`relative min-w-[56px] min-h-[56px] w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-xl flex items-center justify-center transition-all ${isOpen
                        ? 'bg-primary text-black shadow-primary/30'
                        : cartCount > 0
                            ? 'bg-primary text-black shadow-primary/30'
                            : 'bg-white text-black'
                        }`}
                    aria-label={isOpen ? 'Close menu' : 'Open actions menu'}
                >
                    {isOpen ? <X size={24} /> : <ShoppingBag size={24} />}
                    {!isOpen && cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[24px] h-6 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold text-white border-2 border-black px-1.5">
                            {cartCount > 99 ? '99+' : cartCount}
                        </span>
                    )}
                </motion.button>
            </motion.div>
        </>
    );
};

export default FloatingActionMenu;
