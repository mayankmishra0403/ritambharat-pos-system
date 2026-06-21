import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../config/api';
import { Printer, Download } from 'lucide-react';
import GstInvoiceTemplate from '../../components/common/GstInvoiceTemplate';
import printToPdf from '../../utils/printToPdf';

const GstBill = () => {
    const { orderId } = useParams();
    const [searchParams] = useSearchParams();
    const oid = orderId || searchParams.get('orderId');
    const printRef = useRef();

    const { data: invoice, isLoading } = useQuery({
        queryKey: ['gst-invoice', oid],
        queryFn: async () => {
            const res = await api.get(`/gst/invoice/${oid}`);
            return res.data.data;
        },
        enabled: !!oid
    });

    const { data: restaurant } = useQuery({
        queryKey: ['restaurant', invoice?.restaurant],
        queryFn: async () => {
            const res = await api.get(`/restaurant/${invoice.restaurant}`);
            return res.data.data;
        },
        enabled: !!invoice?.restaurant
    });

    const handlePrint = () => {
        if (printRef.current) {
            printToPdf(printRef.current, `gst-bill-${invoice?.invoiceNo || 'invoice'}.pdf`);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
                <span className="text-4xl opacity-20">📄</span>
                <p className="font-medium">Invoice not found</p>
                <button
                    onClick={async () => {
                        try {
                            const res = await api.post(`/gst/invoice/${oid}`);
                            if (res.data.success) window.location.reload();
                        } catch (e) {
                            console.error(e);
                        }
                    }}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold"
                >
                    Generate Invoice
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 print:p-0 print:bg-white">
            <div className="max-w-sm mx-auto print:max-w-full print:mx-0">
                <div className="flex items-center justify-between mb-4 print:hidden">
                    <h1 className="font-bold text-lg">Bill #{invoice.invoiceNo}</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-1.5 px-4 py-2 bg-card border border-border rounded-xl text-sm font-bold hover:bg-muted transition-colors"
                        >
                            <Printer size={14} />
                            Print
                        </button>
                    </div>
                </div>

                <div ref={printRef} className="bg-white rounded-2xl shadow-xl overflow-hidden print:shadow-none print:rounded-none">
                    <GstInvoiceTemplate invoice={invoice} restaurant={restaurant} />
                </div>
            </div>
        </div>
    );
};

export default GstBill;
