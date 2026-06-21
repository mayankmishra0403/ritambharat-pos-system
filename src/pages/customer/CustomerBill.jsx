import { useState } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Receipt, Banknote, ArrowLeft, Loader2, Download } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import InvoiceRenderer from '../../components/billing/InvoiceRenderer';
import { useInvoiceSettings } from '../../hooks/useInvoiceSettings';

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
            if (tableId) {
                try {
                    const res = await api.get(`/orders/session/active/${tableId}`);
                    if (res.data.data) return res.data.data;
                } catch (e) {
                    console.error("Session bill fetch failed, falling back to single order", e);
                }
            }
            if (!orderId) return null;
            const res = await api.get(`/orders/${orderId}`);
            return res.data.data;
        },
        enabled: !!(orderId || tableId)
    });

    const restaurantId = order?.restaurant?._id || order?.restaurant;
    const { restaurant, settings } = useInvoiceSettings(restaurantId);

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
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { margin: 5mm; }
                    html, body { background: white !important; }
                    body > *:not(#bill-receipt-container) { display: none !important; }
                    #bill-receipt-container { display: block !important; }
                    #bill-receipt-container * { visibility: visible !important; }
                    .no-print { display: none !important; }
                }
            `}} />

            <div className="flex items-center gap-4 py-6 no-print">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold">Your Bill</h1>
            </div>

            <div id="bill-receipt-container">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white text-black rounded-3xl p-6 shadow-2xl"
                >
                    <InvoiceRenderer
                        order={order}
                        restaurant={restaurant}
                        settings={settings}
                        type="display"
                    />
                </motion.div>
            </div>

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
