import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Clock, Utensils, ChefHat, RefreshCw, Star, Users, GlassWater, HelpCircle, UtensilsCrossed, PartyPopper, Banknote, Loader2, Share2, ArrowUpRight } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../hooks/useSocket';

const OrderTracking = () => {
    const params = useParams();
    const { socket } = useSocket();
    const [storedOrderId, setStoredOrderId] = useState(() => localStorage.getItem('ritam_bharat_pos_last_order_id'));
    const orderId = params.orderId || storedOrderId;

    const [showSplitter, setShowSplitter] = useState(false);
    const [splitCount, setSplitCount] = useState(2);
    const [luckyPayer, setLuckyPayer] = useState(null);
    const [isRequesting, setIsRequesting] = useState(false);

    // Poll every 5 seconds
    const { data: order, isLoading, refetch } = useQuery({
        queryKey: ['order', orderId],
        queryFn: async () => {
            if (!orderId) return null;
            const res = await api.get(`/orders/${orderId}`);
            return res.data.data;
        },
        refetchInterval: 5000,
        enabled: !!orderId
    });

    // Socket listeners for service request notifications
    useEffect(() => {
        if (socket && order?.table?._id) {
            socket.emit('join', `table:${order.table._id}`);

            socket.on('service:completed', (data) => {
                toast.success(data.message || 'Your request has been completed!', {
                    icon: '✅',
                    duration: 4000
                });
            });

            socket.on('service:cancelled', (data) => {
                toast.error(data.message || 'Your request was cancelled.', {
                    icon: '❌',
                    duration: 4000
                });
            });

            socket.on('order:updated', (updatedOrder) => {
                if (updatedOrder._id === orderId) {
                    refetch();
                    if (updatedOrder.status === 'CANCELLED') {
                        toast.error('Order status: CANCELLED', { icon: '🚫' });
                    }
                }
            });

            socket.on('order:payment-updated', (data) => {
                if (data.orderId === orderId && data.paymentStatus === 'PAID') {
                    refetch();
                    toast.success('Payment confirmed! Thank you.', { icon: '💰' });
                }
            });

            return () => {
                socket.off('service:completed');
                socket.off('service:cancelled');
                socket.off('order:updated');
                socket.off('order:payment-updated');
            };
        }
    }, [socket, order?.table?._id]);

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400 animate-pulse">Tracking your order...</p>
        </div>
    );

    if (!order) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <UtensilsCrossed size={32} className="text-gray-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">No Active Order</h2>
            <p className="text-gray-400 mb-6">Looks like you haven't placed an order yet.</p>
            <Link
                to={`/menu/${localStorage.getItem('ritam_bharat_pos_restaurant_id') || ''}${localStorage.getItem('ritam_bharat_pos_table_id') ? `/${localStorage.getItem('ritam_bharat_pos_table_id')}` : ''}`}
                className="bg-primary text-black font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
            >
                Browse Menu
            </Link>
        </div>
    );

    const steps = [
        { status: 'PENDING', label: 'Order Sent', message: 'Wait for confirmation...', icon: Clock },
        { status: 'ACCEPTED', label: 'Confirmed', message: 'Kitchen received your order!', icon: CheckCircle },
        { status: 'PREPARING', label: 'Cooking', message: 'Chef is working their magic!', icon: ChefHat },
        { status: 'READY', label: 'Ready', message: 'Plating your masterpiece!', icon: Utensils },
        { status: 'SERVED', label: 'Served', message: 'Bon Appétit!', icon: PartyPopper }
    ];

    const currentStepIndex = steps.findIndex(s => s.status === order.status);
    const currentStep = steps[currentStepIndex] || steps[0];

    const handleServiceRequest = async (type, label) => {
        if (isRequesting) return;
        setIsRequesting(true);
        try {
            await api.post('/service/request', {
                restaurant: order.restaurant?._id || order.restaurant,
                table: order.table?._id || order.table,
                type: type, // Now uses the passed type!
                comment: `${label} requested for table`
            });
            toast.success(`${label} request sent!`);
        } catch (error) {
            console.error(error);
            const message = error.response?.data?.message || "Failed to send request.";
            toast.error(message);
        } finally {
            setIsRequesting(false);
        }
    };

    const handleRequestBill = async () => {
        if (isRequesting) return;
        setIsRequesting(true);
        try {
            await api.post('/service/request', {
                restaurant: order.restaurant?._id || order.restaurant,
                table: order.table?._id || order.table,
                type: 'REQUEST_BILL',
                comment: `Bill requested for order #${(orderId || '').slice(-6)}`
            });
            toast.success("Bill requested! A waiter is on the way.");
        } catch (error) {
            console.error(error);
            const message = error.response?.data?.message || "Failed to request bill.";
            toast.error(message);
        } finally {
            setIsRequesting(false);
        }
    };

    const spinTheWheel = () => {
        setLuckyPayer(null);
        let count = 0;
        const interval = setInterval(() => {
            const random = Math.floor(Math.random() * splitCount) + 1;
            setLuckyPayer(`Person ${random}`);
            count++;
            if (count > 10) {
                clearInterval(interval);
                toast.success(`Person ${random} is the lucky one!`);
            }
        }, 100);
    };

    return (
        <div className="pb-40 max-w-lg mx-auto px-4">

            {/* Gamified Header */}
            <div className="text-center py-8 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />

                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    key={currentStep.status}
                    className="mb-4 inline-flex p-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-lg shadow-primary/20"
                >
                    <currentStep.icon size={48} className="text-primary animate-pulse" />
                </motion.div>

                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                    {currentStep.message}
                </h1>
                <div className="flex flex-col items-center gap-2">
                    <p className="text-secondary text-sm font-mono">Order #${(orderId || '').slice(-6).toUpperCase()}</p>

                </div>

                {/* Review Prompt for Served Orders */}
                {order.status === 'SERVED' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 px-6"
                    >
                        <Link
                            to={`/reviews?restaurant=${order.restaurant?._id || order.restaurant}&order=${order._id}`}
                            className="flex items-center justify-between p-4 bg-primary text-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-black/10 rounded-xl group-hover:bg-black/20 transition-colors">
                                    <Star size={20} className="fill-black" />
                                </div>
                                <div className="text-left">
                                    <p className="font-black uppercase text-[10px] tracking-widest leading-none mb-1">Satisfied?</p>
                                    <p className="font-bold text-sm">Share your experience</p>
                                </div>
                            </div>
                            <ArrowUpRight size={20} strokeWidth={3} />
                        </Link>
                    </motion.div>
                )}

                {/* Social Share Floating Button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                        if (navigator.share) {
                            navigator.share({
                                title: `Eating at ${order.restaurant?.name}`,
                                text: `Check out our order at ${order.restaurant?.name}!`,
                                url: window.location.href
                            }).catch(console.error);
                        } else {
                            navigator.clipboard.writeText(window.location.href);
                            toast.success("Link copied to clipboard!");
                        }
                    }}
                    className="fixed bottom-32 right-6 w-14 h-14 bg-white text-black rounded-full shadow-2xl shadow-white/20 flex items-center justify-center z-40 group"
                >
                    <Share2 size={24} strokeWidth={2.5} />
                    <span className="absolute -top-10 right-0 bg-black/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10">Share Table</span>
                </motion.button>
            </div>

            {/* Timeline (Compact) */}
            <div className="flex justify-between items-center px-2 mb-10 relative">
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-white/10 -z-10" />
                {steps.map((step, index) => {
                    const isCompleted = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;

                    return (
                        <div key={step.status} className="flex flex-col items-center gap-2 bg-[#121212] px-1 z-10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500
                                ${isCompleted ? 'bg-primary border-primary text-black' : 'bg-black border-white/20 text-gray-500'}
                                ${isCurrent ? 'scale-125 ring-4 ring-primary/20' : ''}
                            `}>
                                <step.icon size={14} />
                            </div>
                            {isCurrent && (
                                <span className="absolute -bottom-6 text-[10px] font-bold text-primary uppercase tracking-wider">
                                    {step.label}

                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* "Forgot Something?" Upsell (Only if early stage) */}
            {(order.status === 'PENDING' || order.status === 'ACCEPTED') && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-gradient-to-r from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-xl p-4 mb-8 flex items-center justify-between"
                >
                    <div>
                        <h3 className="font-bold text-orange-400">Forgot anything?</h3>
                        <p className="text-xs text-gray-400">Drinks or sides can still be added quickly!</p>
                    </div>
                    <Link to={`/menu/${order.restaurant?._id || order.restaurant}/${order.table?._id || order.table}`} className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 px-4 py-2 rounded-lg text-sm font-bold">
                        Add Items
                    </Link>
                </motion.div>
            )}

            {/* Order Details Card */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/5 mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold flex items-center gap-2 text-white">
                        <Utensils size={18} className="text-primary" /> Your Feast
                    </h3>
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-gray-400 font-mono">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>

                <div className="space-y-4 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-3">
                                <span className="bg-white/10 px-2 py-0.5 rounded text-xs font-bold text-primary min-w-[24px] text-center">{item.quantity}x</span>
                                <span className="font-medium text-gray-200">{item.name || item.menuItem?.name || 'Item'}</span>
                            </div>
                            <span className="text-gray-400 font-mono">{((item.price || 0) * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                <div className="border-t border-white/10 mt-4 pt-4 flex justify-between items-center">
                    <span className="text-gray-400 font-medium text-sm">Total Amount</span>
                    <span className="text-xl font-bold text-white">{order.total?.toFixed(2)}</span>
                </div>
            </div>

            {/* Action Grid */}
            <h3 className="font-bold mb-4 px-2">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3 mb-8">
                <button
                    onClick={() => handleServiceRequest('WATER', 'Water Refill')}
                    disabled={isRequesting}
                    className={`p-4 rounded-xl border border-white/5 flex flex-col items-center gap-2 transition-colors ${isRequesting ? 'bg-white/5 opacity-50 cursor-not-allowed' : 'bg-white/5 hover:bg-white/10'}`}
                >
                    <GlassWater className="text-blue-400" />
                    <span className="text-sm font-medium">Water Refill</span>
                </button>
                <button
                    onClick={() => handleServiceRequest('CUTLERY', 'Cutlery')}
                    disabled={isRequesting}
                    className={`p-4 rounded-xl border border-white/5 flex flex-col items-center gap-2 transition-colors ${isRequesting ? 'bg-white/5 opacity-50 cursor-not-allowed' : 'bg-white/5 hover:bg-white/10'}`}
                >
                    <UtensilsCrossed className="text-gray-400" />
                    <span className="text-sm font-medium">Need Cutlery</span>
                </button>
                <button
                    onClick={() => handleServiceRequest('CALL_WAITER', 'Server Assistance')}
                    disabled={isRequesting}
                    className={`p-4 rounded-xl border border-white/5 flex flex-col items-center gap-2 transition-colors ${isRequesting ? 'bg-white/5 opacity-50 cursor-not-allowed' : 'bg-white/5 hover:bg-white/10'}`}
                >
                    <HelpCircle className="text-yellow-400" />
                    <span className="text-sm font-medium">Call Server</span>
                </button>
                <button
                    onClick={() => setShowSplitter(true)}
                    disabled={isRequesting}
                    className={`p-4 rounded-xl border border-white/5 flex flex-col items-center gap-2 transition-colors ${isRequesting ? 'bg-white/5 opacity-50 cursor-not-allowed' : 'bg-white/5 hover:bg-white/10'}`}
                >
                    <Users className="text-purple-400" />
                    <span className="text-sm font-medium">Split Bill</span>
                </button>
            </div>

            {/* Bill / Reviews */}
            <div className="space-y-3">
                {order.orderSource !== 'MANUAL' && (
                    <Link
                        to={`/bill/${orderId}`}
                        className="w-full font-bold py-4 rounded-2xl flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 transition-all text-base border border-white/10"
                    >
                        <Banknote size={20} />
                        View Bill
                    </Link>
                )}
                {(order.status === 'READY' || order.status === 'SERVED') && (
                    <motion.button
                        layout
                        disabled={isRequesting}
                        whileHover={!isRequesting ? { scale: 1.02 } : {}}
                        whileTap={!isRequesting ? { scale: 0.98 } : {}}
                        onClick={handleRequestBill}
                        className={`w-full font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl text-lg border-2 ${isRequesting ? 'bg-primary/50 border-primary/50 text-black/50 cursor-not-allowed' : 'bg-primary text-black border-primary shadow-primary/20'}`}
                    >
                        {isRequesting ? <Loader2 size={24} className="animate-spin" /> : <Banknote size={24} />}
                        {isRequesting ? 'Requesting...' : 'Request Bill'}
                    </motion.button>
                )}
            </div>

            {/* Bill Splitter Modal */}
            <AnimatePresence>
                {showSplitter && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#1a1a1a] p-6 rounded-2xl w-full max-w-sm border border-white/10"
                        >
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Users className="text-purple-400" /> Split the Bill
                            </h3>

                            <div className="flex items-center justify-between mb-6 bg-white/5 p-4 rounded-xl">
                                <button onClick={() => setSplitCount(Math.max(2, splitCount - 1))} className="w-10 h-10 bg-white/10 rounded-full hover:bg-white/20 text-xl font-bold">-</button>
                                <div className="text-center">
                                    <span className="block text-2xl font-bold">{splitCount}</span>
                                    <span className="text-xs text-gray-400">People</span>
                                </div>
                                <button onClick={() => setSplitCount(Math.min(10, splitCount + 1))} className="w-10 h-10 bg-white/10 rounded-full hover:bg-white/20 text-xl font-bold">+</button>
                            </div>

                            <div className="text-center mb-6">
                                <p className="text-gray-400 text-sm mb-1">Each person pays:</p>
                                <p className="text-3xl font-bold text-primary">{(order.total / splitCount).toFixed(2)}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={spinTheWheel}
                                    className="bg-purple-500/20 text-purple-300 py-3 rounded-xl font-bold hover:bg-purple-500/30 transition-colors"
                                >
                                    🎲 Spin Wheel
                                </button>
                                <button
                                    onClick={() => setShowSplitter(false)}
                                    className="bg-white/10 text-white py-3 rounded-xl font-bold hover:bg-white/20 transition-colors"
                                >
                                    Close
                                </button>
                            </div>

                            {luckyPayer && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="mt-4 p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-center font-bold text-white shadow-lg"
                                >
                                    🎉 {luckyPayer} should pay!
                                </motion.div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default OrderTracking;
