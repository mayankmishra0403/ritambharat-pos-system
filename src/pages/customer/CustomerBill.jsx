import { useState } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Receipt, Banknote, ArrowLeft, Loader2, Share2, Download } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';


const CustomerBill = () => {
    const params = useParams();
    const navigate = useNavigate();
    const { tableId: contextTableId } = useOutletContext() || {};
    const [storedOrderId] = useState(() => localStorage.getItem('ritam_bharat_pos_last_order_id'));
    const orderId = params.orderId || storedOrderId;
    const tableId = contextTableId || localStorage.getItem('ritam_bharat_pos_table_id');

    const { data: order, isLoading } = useQuery({
        queryKey: ['order-bill', orderId, tableId],
        queryFn: async () => {
            // Priority 1: Session bill for the current table
            if (tableId) {
                try {
                    const res = await api.get(`/orders/session/active/${tableId}`);
                    if (res.data.data) return res.data.data;
                } catch (e) {
                    console.error("Session bill fetch failed, falling back to single order", e);
                }
            }

            // Priority 2: Single specific order
            if (!orderId) return null;
            const res = await api.get(`/orders/${orderId}`);
            return res.data.data;
        },
        enabled: !!(orderId || tableId)
    });

    const [isRequesting, setIsRequesting] = useState(false);

    const handleRequestBill = async () => {
        if (isRequesting) return;
        setIsRequesting(true);
        try {
            await api.post('/service/request', {
                restaurant: order.restaurant._id,
                table: order.table._id,
                type: 'REQUEST_BILL',
                comment: `Bill requested for Table Session: ${order.sessionId?.slice(-6) || order._id?.slice(-6) || 'Unknown'}`
            });
            toast.success("Bill requested! Waiter is on the way.");
        } catch (error) {
            console.error(error);
            const message = error.response?.data?.message || "Failed to request bill";
            toast.error(message);
        } finally {
            setIsRequesting(false);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Bill from ${order.restaurant?.name}`,
                    text: `Hey, here is our bill from ${order.restaurant?.name}. Total: $${(order.total || 0).toFixed(2)}`,
                    url: window.location.href
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied to clipboard!");
        }
    };

    const handleDownload = () => {
        window.print();
    };

    if (isLoading) return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    if (!order) return (
        <div className="text-center py-20 px-4">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Receipt size={32} className="text-gray-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">No Bill Found</h2>
            <p className="text-gray-400 mb-6">Access your bill after placing an order.</p>
            <Link
                to={`/menu/${localStorage.getItem('ritam_bharat_pos_restaurant_id') || ''}${localStorage.getItem('ritam_bharat_pos_table_id') ? `/${localStorage.getItem('ritam_bharat_pos_table_id')}` : ''}`}
                className="text-primary font-bold hover:underline"
            >
                Back to Menu
            </Link>
        </div>
    );

    return (
        <div className="pb-40 px-4 md:px-0 max-w-lg mx-auto">
            {/* Print Only Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { margin: 10mm; }
                    html, body { background: white !important; }
                    body > *:not(#bill-receipt-container) { display: none !important; }
                    #bill-receipt-container { display: block !important; }
                    #bill-receipt {
                        background: white !important;
                        color: black !important;
                        padding: 20px !important;
                        width: 100% !important;
                        max-width: 400px !important;
                        margin: 0 auto !important;
                        font-family: 'Courier New', Courier, monospace !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                    }
                    #bill-receipt * {
                        visibility: visible !important;
                        color: black !important;
                        background: transparent !important;
                    }
                    .no-print { display: none !important; }
                }
            `}} />

            {/* Header */}
            <div className="flex items-center gap-4 py-6 no-print">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold">Your Bill</h1>
            </div>

            {/* Receipt Card */}
            <div id="bill-receipt-container">
            <motion.div
                id="bill-receipt"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white text-black rounded-3xl p-6 shadow-2xl relative overflow-hidden"
            >
                {/* Torn Paper Effect Top */}
                <div className="absolute top-0 left-0 right-0 h-4 bg-[#121212] no-print" style={{ clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)' }}></div>

                <div className="text-center mb-6 pt-4">
                    <h2 className="text-2xl font-black uppercase tracking-wider mb-1">{order.restaurant?.name || 'Restaurant'}</h2>
                    <p className="text-gray-500 text-sm font-mono">
                        {order.sessionId ? `Session #${order.sessionId.slice(-6).toUpperCase()}` : `Order #${(order._id || '').slice(-6).toUpperCase()}`}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                </div>

                <div className="border-b-2 border-dashed border-gray-200 mb-6"></div>

                {/* Items */}
                <div className="space-y-3 mb-6 font-mono text-sm">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start">
                            <div className="flex gap-2">
                                <span className="font-bold">{item.quantity}x</span>
                                <span>{item.name || item.menuItem?.name}</span>
                            </div>
                            <span className="font-bold">{((item.price || 0) * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                <div className="border-b-2 border-dashed border-gray-200 mb-6"></div>

                {/* Totals */}
                <div className="space-y-2 font-mono text-sm mb-6">
                    <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>{((order.total || 0) / 1.1).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                        <span>Tax (10%)</span>
                        <span>{((order.total || 0) - ((order.total || 0) / 1.1)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold mt-4 pt-4 border-t-2 border-black">
                        <span>TOTAL</span>
                        <span>{(order.total || 0).toFixed(2)}</span>
                    </div>
                </div>

                {/* Footer Message */}
                <div className="text-center text-xs text-gray-500 font-mono">
                    <p>Thank you for dining with us!</p>
                    <p>Please pay the waiter.</p>
                </div>

                {/* Torn Paper Effect Bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-[#121212] no-print" style={{ clipPath: 'polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)' }}></div>
            </motion.div>
            </div>

            {/* Actions */}
            <div className="mt-8 space-y-4 no-print">
                <button
                    onClick={handleRequestBill}
                    disabled={isRequesting}
                    className="w-full bg-primary text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isRequesting ? <Loader2 size={20} className="animate-spin" /> : <Banknote size={20} />}
                    {isRequesting ? 'Requesting...' : 'Request Bill & Pay'}
                </button>

                <button
                    onClick={handleDownload}
                    className="w-full py-4 bg-white/5 rounded-xl text-base font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2 border border-white/5"
                >
                    <Download size={20} /> Download PDF Receipt
                </button>
            </div>
        </div>
    );
};

export default CustomerBill;
