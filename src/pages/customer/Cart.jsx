import { useState } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ArrowLeft, MessageSquare, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import CartUpsell from '../../components/customer/CartUpsell';
import toast from 'react-hot-toast';

const Cart = () => {
    const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
    const { restaurant, tableId } = useOutletContext();
    const navigate = useNavigate();
    const [orderNote, setOrderNote] = useState("");
    const [isNoteOpen, setIsNoteOpen] = useState(false);

    // Save note to local storage or context if needed globaly (omitted for now, passing via logic later or assumed context handles it if updated)
    // For this UI demo, strictly local state but in real app should sync with context.

    if (cart.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <ShoppingBag size={48} className="text-white/20" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Your cart is empty</h2>
                <p className="text-secondary mb-8 max-w-xs mx-auto">Looks like you haven't made your choice yet. Explore our bestsellers!</p>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full bg-primary text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                    >
                        Browse Menu
                    </button>
                </div>

                {/* Popular items could go here even in empty state */}
                {restaurant?._id && <div className="mt-12 w-full"><CartUpsell restaurantId={restaurant._id} /></div>}
            </div>
        );
    }

    return (
        <div className="pb-40 px-4 md:px-0">
            <header className="flex items-center justify-between mb-6 pt-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold">Your Order</h1>
                </div>


            </header>

            <div className="space-y-4">
                <AnimatePresence mode='popLayout'>
                    {cart.map((item, index) => (
                        <CartItem
                            key={`${item._id}-${index}-${item.specialInstructions}`}
                            item={item}
                            updateQuantity={updateQuantity}
                            removeFromCart={removeFromCart}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {/* Order Note */}
            <div className="mt-6">
                <button
                    onClick={() => setIsNoteOpen(!isNoteOpen)}
                    className="flex items-center gap-2 text-primary font-medium text-sm hover:underline mb-2"
                >
                    <MessageSquare size={16} />
                    {isNoteOpen ? "Close Note" : "Add a note for the kitchen?"}
                </button>
                <AnimatePresence>
                    {isNoteOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <textarea
                                value={orderNote}
                                onChange={(e) => setOrderNote(e.target.value)}
                                placeholder="Extra napkins, allergies, cutlery..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/50 min-h-[100px] resize-none"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Upsell Section */}
            {restaurant?._id && <CartUpsell restaurantId={restaurant._id} />}

            {/* Summary & Checkout Actions */}
            <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#1a1a1a]/90 backdrop-blur-xl border-t border-white/10 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <div className="p-6 max-w-3xl mx-auto">
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-gray-400 text-sm">
                            <span>Subtotal</span>
                            <span>{cartTotal.toFixed(2)}</span>
                        </div>
                        {restaurant?.taxRate > 0 && (
                            <div className="flex justify-between text-gray-400 text-sm">
                                <span>Tax ({restaurant.taxRate}%)</span>
                                <span>{(cartTotal * restaurant.taxRate / 100).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-white/10">
                            <span>Total</span>
                            <span className="text-primary">{((cartTotal * (1 + (restaurant?.taxRate || 0) / 100))).toFixed(2)}</span>
                        </div>
                    </div>

                    <Link
                        to={{
                            pathname: `/menu/${restaurant?._id}/checkout`,
                            search: tableId ? `?table=${tableId}` : "",
                            state: { orderNote }
                        }}
                        className="w-full bg-primary text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
                    >
                        Proceed to Checkout <ArrowRight size={20} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

// Swipeable Item Component
const CartItem = ({ item, updateQuantity, removeFromCart }) => {
    const x = useMotionValue(0);
    const opacity = useTransform(x, [-100, -50, 0], [0, 1, 1]);
    const background = useTransform(x, [-100, 0], ["rgba(239, 68, 68, 0.2)", "rgba(255, 255, 255, 0.05)"]);

    const handleDragEnd = (event, info) => {
        if (info.offset.x < -100) {
            removeFromCart(item._id, item.specialInstructions);
            toast.error("Item removed", { duration: 1500 });
        }
    };

    return (
        <motion.div
            style={{ x, opacity, background }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.5, right: 0 }} // Only allow left drag
            onDragEnd={handleDragEnd}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="rounded-xl p-3 flex gap-4 border border-white/5 relative overflow-hidden group touch-pan-y"
        >
            {/* Visual Indicator for Swipe Delete */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 opacity-0 group-active:opacity-100 transition-opacity font-bold text-xs flex items-center gap-1 pointer-events-none">
                Release to delete <Trash2 size={14} />
            </div>

            <div className="w-20 h-20 rounded-lg bg-white/10 overflow-hidden flex-shrink-0 z-10">
                {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gray-800" />
                )}
            </div>

            <div className="flex-1 z-10">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-base leading-tight">{item.name}</h3>
                    <span className="font-bold text-primary">{(item.price * item.quantity).toFixed(2)}</span>
                </div>
                {item.specialInstructions && (
                    <p className="text-xs text-gray-400 italic mb-2 line-clamp-1">"{item.specialInstructions}"</p>
                )}

                <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-3 bg-white/10 rounded-lg p-1">
                        <button
                            onClick={() => updateQuantity(item._id, item.specialInstructions, -1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded text-white"
                        >
                            <Minus size={14} />
                        </button>
                        <span className="font-mono w-6 text-center text-sm font-bold">{item.quantity}</span>
                        <button
                            onClick={() => updateQuantity(item._id, item.specialInstructions, 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded text-white"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default Cart;
