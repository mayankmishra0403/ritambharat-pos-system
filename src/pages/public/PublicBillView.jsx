import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Receipt, Download, ArrowLeft, Loader2 } from 'lucide-react';
import api from '../../config/api';
import printToPdf from '../../utils/printToPdf';
import toast from 'react-hot-toast';

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

    const { data: restaurant } = useQuery({
        queryKey: ['public-bill-restaurant', order?.restaurant?._id],
        queryFn: async () => {
            const res = await api.get(`/restaurant/${order.restaurant._id}`);
            return res.data.data;
        },
        enabled: !!order?.restaurant?._id
    });

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

    const restaurantName = restaurant?.name || order.restaurant?.name || 'Restaurant';
    const currency = '₹';
    const subtotal = order.subtotal || order.total;
    const tax = order.tax || 0;
    const total = order.total || 0;

    const handleDownload = () => {
        if (printRef.current) {
            printToPdf(printRef.current, `bill-${order.orderNumber || order._id.slice(-6)}.pdf`);
        } else {
            toast.error('Could not generate PDF');
        }
    };

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

                <div
                    ref={printRef}
                    className="bg-white text-black rounded-3xl p-6 shadow-2xl"
                >
                    <div className="text-center mb-6 pt-2">
                        <h2 className="text-2xl font-black uppercase tracking-wider mb-1">{restaurantName}</h2>
                        <p className="text-gray-500 text-sm font-mono">
                            {order.orderNumber ? `#${order.orderNumber}` : `Order #${order._id.slice(-6).toUpperCase()}`}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {order.table?.name && (
                            <p className="text-gray-500 text-xs mt-0.5">Table: {order.table.name}</p>
                        )}
                    </div>

                    <div className="border-b-2 border-dashed border-gray-200 mb-5"></div>

                    <div className="space-y-3 mb-5 font-mono text-sm">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start">
                                <div className="flex gap-2 flex-1">
                                    <span className="font-bold w-8 shrink-0">{item.quantity}x</span>
                                    <span className="flex-1">{item.name || item.menuItem?.name}</span>
                                </div>
                                <span className="font-bold shrink-0 ml-4">{currency}{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-b-2 border-dashed border-gray-200 mb-5"></div>

                    <div className="space-y-1.5 font-mono text-sm mb-6">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>{currency}{subtotal.toFixed(2)}</span>
                        </div>
                        {tax > 0 && (
                            <div className="flex justify-between text-gray-600">
                                <span>Tax</span>
                                <span>{currency}{tax.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xl font-bold mt-4 pt-4 border-t-2 border-black">
                            <span>TOTAL</span>
                            <span>{currency}{total.toFixed(2)}</span>
                        </div>
                        {order.paymentStatus === 'PAID' && (
                            <div className="text-center mt-3 text-green-600 font-bold text-xs uppercase tracking-wider">
                                Paid
                            </div>
                        )}
                    </div>

                    <div className="text-center text-xs text-gray-500 font-mono border-t-2 border-dashed border-gray-200 pt-5">
                        <p className="font-bold text-sm text-black mb-1">Thank you for dining with us!</p>
                        <p>{restaurantName}</p>
                    </div>
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
