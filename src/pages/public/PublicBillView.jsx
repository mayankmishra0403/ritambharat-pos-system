import { useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Receipt, Download, ArrowLeft, Loader2 } from 'lucide-react';
import api from '../../config/api';
import printToPdf from '../../utils/printToPdf';
import toast from 'react-hot-toast';
import InvoiceRenderer from '../../components/billing/InvoiceRenderer';
import { useInvoiceSettings } from '../../hooks/useInvoiceSettings';

const PublicBillView = () => {
    const { orderId } = useParams();
    const printRef = useRef(null);

    const { data: order, isLoading } = useQuery({
        queryKey: ['public-bill', orderId],
        queryFn: async () => {
            const res = await api.get(`/orders/${orderId}`);
            return res.data.data;
        },
        enabled: !!orderId
    });

    const restaurantId = order?.restaurant?._id || order?.restaurant;
    const { restaurant, settings } = useInvoiceSettings(restaurantId);

    const handleDownload = () => {
        if (printRef.current) {
            printToPdf(printRef.current, `bill-${order.orderNumber || order._id.slice(-6)}.pdf`);
        } else {
            toast.error('Could not generate PDF');
        }
    };

    if (isLoading) return (
        <div className="min-h-screen bg-[#121212] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    if (!order) return (
        <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center px-6 text-center">
            <Receipt size={48} className="text-gray-600 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Bill Not Found</h2>
            <p className="text-gray-400 mb-6">This bill link is invalid or the order has been removed.</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#121212] px-4 py-8">
            <style>{`
                @media print {
                    body { background: white !important; }
                    .no-print { display: none !important; }
                }
            `}</style>

            <div className="max-w-md mx-auto">
                <div className="flex items-center justify-between mb-6 no-print">
                    <button onClick={() => window.history.back()} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-white" />
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-all text-sm"
                    >
                        <Download size={16} />
                        Download PDF
                    </button>
                </div>

                <div ref={printRef} className="bg-white text-black rounded-3xl p-6 shadow-2xl">
                    <InvoiceRenderer
                        order={order}
                        restaurant={restaurant}
                        settings={settings}
                        type="display"
                    />
                </div>

                <div className="text-center mt-8 no-print">
                    <p className="text-gray-600 text-xs">
                        Powered by <span className="text-primary font-bold">Ritam Bharat POS</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PublicBillView;
