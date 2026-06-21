import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import {
    Receipt, Search, Filter, Download, Printer,
    Calendar, Table, DollarSign, ChevronRight,
    ArrowLeft, MoreVertical, CheckCircle, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import ReceiptTemplate from '../../components/common/ReceiptTemplate';
import ManualBillModal from '../../components/billing/ManualBillModal';
import toast from 'react-hot-toast';

const Billing = () => {
    const { user } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('today'); // today, week, month, all
    const [selectedBill, setSelectedBill] = useState(null);
    const [printing, setPrinting] = useState(false);
    const [showManualBillModal, setShowManualBillModal] = useState(false);

    const restaurantId = useMemo(() => {
        if (!user?.restaurant) return null;
        return typeof user.restaurant === 'object' ? user.restaurant._id : user.restaurant;
    }, [user]);

    // Fetch Completed/Paid Orders
    const { data: bills = [], isLoading } = useQuery({
        queryKey: ['bills', restaurantId, dateFilter],
        queryFn: async () => {
            if (!restaurantId) return [];
            // We fetch all orders but filter for those that are paid or served
            const res = await api.get(`/orders/restaurant/${restaurantId}`);
            return res.data.data.filter(order =>
                order.paymentStatus === 'PAID' || order.status === 'SERVED'
            );
        },
        enabled: !!restaurantId
    });

    const filteredBills = useMemo(() => {
        return bills.filter(bill => {
            const matchesSearch =
                bill.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                bill.table?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                bill.customerName?.toLowerCase().includes(searchTerm.toLowerCase());

            // Date filtering
            const billDate = new Date(bill.createdAt);
            const now = new Date();
            let matchesDate = true;

            if (dateFilter === 'today') {
                matchesDate = billDate.toDateString() === now.toDateString();
            } else if (dateFilter === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                matchesDate = billDate >= weekAgo;
            } else if (dateFilter === 'month') {
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                matchesDate = billDate >= monthAgo;
            }

            return matchesSearch && matchesDate;
        });
    }, [bills, searchTerm, dateFilter]);

    const handleMarkPaid = async (bill) => {
        try {
            await api.patch(`/orders/${bill._id}/payment`, { paymentStatus: 'PAID' });
            queryClient.invalidateQueries(['bills']);
            setSelectedBill(null);
            toast.success('Payment marked as done');
        } catch (error) {
            toast.error('Failed to update payment status');
        }
    };

    const handleCancelOrder = async (bill) => {
        if (!window.confirm('Are you sure you want to cancel this order?')) return;
        try {
            await api.patch(`/orders/${bill._id}/status`, { status: 'CANCELLED' });
            queryClient.invalidateQueries(['bills']);
            setSelectedBill(null);
            toast.success('Order cancelled');
        } catch (error) {
            toast.error('Failed to cancel order');
        }
    };

    useEffect(() => {
        if (!printing) return;
        const timer = setTimeout(() => window.print(), 300);
        const handleAfterPrint = () => setPrinting(false);
        window.addEventListener('afterprint', handleAfterPrint);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, [printing]);

    const handlePrint = (bill) => {
        setSelectedBill(bill);
        setPrinting(true);
        toast.success(`Preparing Receipt for Order #${bill.orderNumber.split('-')[2]}...`);
    };

    const exportToCSV = () => {
        if (filteredBills.length === 0) {
            toast.error('No bills to export');
            return;
        }

        const headers = ['Order Number', 'Date', 'Table', 'Items Count', 'Payment Status', 'Total'];
        const rows = filteredBills.map(bill => [
            bill.orderNumber,
            new Date(bill.createdAt).toLocaleString(),
            bill.table?.name || 'Takeout',
            bill.items.reduce((acc, current) => acc + current.quantity, 0),
            bill.paymentStatus,
            bill.total.toFixed(2)
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `bills_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Bills exported successfully!');
    };

    const queryClient = useQueryClient();

    // Fetch Pending Bill Requests
    const { data: billRequests = [] } = useQuery({
        queryKey: ['billRequests', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return [];
            const res = await api.get(`/service?status=PENDING&restaurant=${restaurantId}`);
            return res.data.data.filter(req => req.type === 'REQUEST_BILL');
        },
        enabled: !!restaurantId,
        refetchInterval: 10000
    });

    const updateRequestMutation = useMutation({
        mutationFn: ({ id, status }) => api.patch(`/service/${id}`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries(['billRequests']);
            toast.success('Request updated');
        }
    });

    // ... existing bills query ...

    // ... existing filteredBills useMemo ...

    // ... existing handlePrint ...

    // ... existing exportToCSV ...

    if (isLoading) return (
        <div className="flex bg-background min-h-screen">
            <Sidebar className={mobileMenuOpen ? "flex fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-2xl" : "hidden lg:flex"} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header onMobileMenuClick={() => setMobileMenuOpen(true)} />
                <div className="flex-1 flex items-center justify-center text-foreground">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    <span className="ml-3">Loading Bills...</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex bg-background min-h-screen text-foreground">
            <Sidebar open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header onMobileMenuClick={() => setMobileMenuOpen(true)} className="print:hidden" />

                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 print:p-0">
                    <div className="max-w-7xl mx-auto space-y-6 print:hidden">

                        {/* Pending Bill Requests Alert Section */}
                        <AnimatePresence>
                            {billRequests.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 mb-6"
                                >
                                    <h3 className="text-emerald-500 font-bold mb-4 flex items-center gap-2">
                                        <Receipt className="animate-bounce" />
                                        Pending Bill Requests ({billRequests.length})
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {billRequests.map(req => (
                                            <div key={req._id} className="bg-card p-4 rounded-xl border border-border flex justify-between items-center shadow-sm">
                                                <div>
                                                    <p className="font-bold text-lg">{req.table?.name || 'Unknown Table'}</p>
                                                    <p className="text-xs text-muted-foreground">{new Date(req.createdAt).toLocaleTimeString()}</p>
                                                </div>
                                                <button
                                                    onClick={() => updateRequestMutation.mutate({ id: req._id, status: 'COMPLETED' })}
                                                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                                                >
                                                    Mark Done
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Page Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                                    <Receipt className="text-primary w-8 h-8" />
                                    Billing Management
                                </h1>
                                <p className="text-muted-foreground mt-1">Manage, view and print customer receipts</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowManualBillModal(true)}
                                    className="btn-primary px-4 py-2 flex items-center gap-2 text-sm"
                                >
                                    <Receipt size={18} />
                                    Manual Bill
                                </button>
                                <button
                                    onClick={exportToCSV}
                                    className="btn-secondary px-4 py-2 flex items-center gap-2 text-sm"
                                >
                                    <Download size={18} />
                                    Export CSV
                                </button>
                            </div>
                        </div>

                        {/* Stats Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
                            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Receipt size={20} />
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground">Today's Revenue</span>
                                </div>
                                <div className="text-2xl font-black">
                                    {bills.filter(b => b.paymentStatus === 'PAID' && new Date(b.createdAt).toDateString() === new Date().toDateString())
                                        .reduce((acc, curr) => acc + curr.total, 0).toFixed(2)}
                                </div>
                            </div>

                            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        <Receipt size={20} />
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground">Today's Orders</span>
                                </div>
                                <div className="text-2xl font-black">
                                    {bills.filter(b => new Date(b.createdAt).toDateString() === new Date().toDateString()).length}
                                </div>
                            </div>

                            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                        <Calendar size={20} />
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground">Month to Date</span>
                                </div>
                                <div className="text-2xl font-black">
                                    {bills.filter(b => b.paymentStatus === 'PAID' && new Date(b.createdAt).getMonth() === new Date().getMonth())
                                        .reduce((acc, curr) => acc + curr.total, 0).toLocaleString()}
                                </div>
                            </div>

                            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                        <CheckCircle size={20} />
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground">Paid Percentage</span>
                                </div>
                                <div className="text-2xl font-black">
                                    {bills.length > 0 ? ((bills.filter(b => b.paymentStatus === 'PAID').length / bills.length) * 100).toFixed(0) : 0}%
                                </div>
                            </div>
                        </div>

                        {/* Filters Bar */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm print:hidden">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by Order #, Table, or Customer..."
                                    className="w-full bg-muted/50 border-none rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Calendar size={18} className="text-primary" />
                                <select
                                    className="flex-1 bg-muted/50 border-none rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                >
                                    <option value="today">Today</option>
                                    <option value="week">Past 7 Days</option>
                                    <option value="month">Past 30 Days</option>
                                    <option value="all">All Time</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-4 px-2">
                                <div className="flex-1 text-sm text-muted-foreground">
                                    Showing <span className="text-foreground font-bold">{filteredBills.length}</span> bills
                                </div>
                                <Filter size={18} className="text-muted-foreground" />
                            </div>
                        </div>

                        {/* Bills List */}
                        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden print:hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-muted/30 border-b border-border text-xs uppercase text-muted-foreground font-bold tracking-wider">
                                            <th className="p-4">Order Details</th>
                                            <th className="p-4">Table</th>
                                            <th className="p-4">Items</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4">Total</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        <AnimatePresence mode='popLayout'>
                                            {filteredBills.map((bill) => (
                                                <motion.tr
                                                    key={bill._id}
                                                    layout
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="group hover:bg-muted/20 transition-colors relative"
                                                >
                                                    <td className="p-4">
                                                        <div className="font-mono text-primary font-bold">
                                                            #{bill.orderNumber.split('-')[1]}
                                                            <span className="text-foreground/80">-{bill.orderNumber.split('-')[2]}</span>
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground mt-0.5">
                                                            {new Date(bill.createdAt).toLocaleString()}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                                <Table size={14} />
                                                            </div>
                                                            <span className="font-medium">{bill.table?.name || 'Takeout'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="text-sm font-medium">
                                                            {bill.items[0]?.name} {bill.items.length > 1 && `+ ${bill.items.length - 1} more`}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground">
                                                            {bill.items.reduce((acc, current) => acc + current.quantity, 0)} items total
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${bill.paymentStatus === 'PAID'
                                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                            : 'bg-primary/10 text-primary border-primary/20'
                                                            }`}>
                                                            {bill.paymentStatus === 'PAID' ? 'PAID' : 'PENDING'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="font-black text-lg">
                                                            {bill.total.toFixed(2)}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right relative">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handlePrint(bill)}
                                                                className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                                                                title="Print Bill"
                                                            >
                                                                <Printer size={18} />
                                                            </button>

                                                            <div className="relative">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedBill(selectedBill?._id === bill._id ? null : bill);
                                                                    }}
                                                                    className="p-2 hover:bg-muted text-muted-foreground rounded-lg transition-colors"
                                                                >
                                                                    <MoreVertical size={18} />
                                                                </button>

                                                                {selectedBill?._id === bill._id && (
                                                                    <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden flex flex-col text-left">
                                                                        <button
                                                                            onClick={() => handlePrint(bill)}
                                                                            className="px-4 py-3 hover:bg-muted/50 text-sm font-medium text-foreground flex items-center gap-2 transition-colors border-b border-border/50"
                                                                        >
                                                                            <Printer size={16} className="text-primary" /> Print Receipt
                                                                        </button>

                                                                        {bill.paymentStatus !== 'PAID' && (
                                                                            <button
                                                                                onClick={() => handleMarkPaid(bill)}
                                                                                className="px-4 py-3 hover:bg-emerald-500/10 text-sm font-medium text-emerald-500 flex items-center gap-2 transition-colors border-b border-border/50"
                                                                            >
                                                                                <CheckCircle size={16} /> Mark as Paid
                                                                            </button>
                                                                        )}

                                                                        {bill.status !== 'CANCELLED' && (
                                                                            <button
                                                                                onClick={() => handleCancelOrder(bill)}
                                                                                className="px-4 py-3 hover:bg-red-500/10 text-sm font-medium text-red-500 flex items-center gap-2 transition-colors"
                                                                            >
                                                                                <X size={16} /> Cancel Order
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {/* Backdrop to close menu */}
                                                        {selectedBill?._id === bill._id && (
                                                            <div
                                                                className="fixed inset-0 z-40"
                                                                onClick={() => setSelectedBill(null)}
                                                            ></div>
                                                        )}
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                        {filteredBills.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="p-20 text-center">
                                                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                                        <Receipt size={48} className="opacity-10" />
                                                        <div className="text-lg font-medium opacity-50">No bills found for this criteria</div>
                                                        <button
                                                            onClick={() => { setSearchTerm(''); setDateFilter('all'); }}
                                                            className="text-primary hover:underline text-sm"
                                                        >
                                                            Clear all filters
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Print Overlay - visible only during browser print */}
                        {printing && selectedBill && (
                            <div id="print-overlay" style={{
                                position: 'fixed', inset: 0, background: 'white', zIndex: 9999,
                                display: 'flex', justifyContent: 'center', paddingTop: 20
                            }}>
                                <style>{`
                                    @media print {
                                        body > *:not(#print-overlay) { display: none !important; }
                                        #print-overlay { display: flex !important; position: fixed !important; inset: 0 !important; background: white !important; z-index: 9999 !important; }
                                        #print-overlay #thermal-receipt { display: block !important; }
                                    }
                                `}</style>
                                <div style={{ width: 320 }}>
                                    <ReceiptTemplate order={selectedBill} />
                                </div>
                            </div>
                        )}

                        {/* Manual Bill Modal */}
                        {showManualBillModal && (
                            <ManualBillModal
                                restaurantId={restaurantId}
                                onClose={() => setShowManualBillModal(false)}
                                onSuccess={(bill) => {
                                    setSelectedBill(bill);
                                    setPrinting(true);
                                    setShowManualBillModal(false);
                                    toast.success('Manual bill created!');
                                }}
                            />
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Billing;
