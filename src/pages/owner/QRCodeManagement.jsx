import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    QrCode, Download, Trash2, Plus,
    Search, Table as TableIcon, MapPin,
    Users, RefreshCw, ChevronRight,
    ExternalLink, DownloadCloud
} from 'lucide-react';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';

const QRCodeManagement = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const restaurantId = user?.restaurant?._id || user?.restaurant;

    // Fetch Tables (which contain QR data)
    const { data: tables, isLoading, refetch } = useQuery({
        queryKey: ['tables', restaurantId],
        queryFn: async () => {
            const res = await api.get(`/tables?restaurant=${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId
    });

    const deleteTableMutation = useMutation({
        mutationFn: (id) => api.delete(`/tables/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['tables', restaurantId]);
            toast.success('Table removed');
        },
        onError: () => toast.error('Failed to remove table')
    });

    const downloadQR = (qrUrl, tableName) => {
        if (!qrUrl) return toast.error('QR code not available');

        const link = document.createElement('a');
        link.href = qrUrl;
        link.download = `table-${tableName}-qr.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Downloading QR for Table ${tableName}`);
    };

    const filteredTables = tables?.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.location?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="flex bg-background min-h-screen text-foreground font-sans selection:bg-primary/30">
            <Sidebar open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header onMobileMenuClick={() => setMobileMenuOpen(true)} />

                <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h1 className="text-3xl font-black italic uppercase mb-1 tracking-tight flex items-center gap-3">
                                <QrCode className="text-primary" size={32} />
                                QR Code Management
                            </h1>
                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">
                                Manage and download QR codes for your tables
                            </p>
                        </motion.div>

                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search tables..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-card border-2 border-border/50 focus:border-primary/50 rounded-2xl py-3 pl-12 pr-4 outline-none transition-all text-sm font-bold uppercase tracking-wider"
                                />
                            </div>
                            <button
                                onClick={() => refetch()}
                                className="p-3 bg-muted hover:bg-border rounded-2xl transition-all"
                            >
                                <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
                            </button>
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {[
                            { label: 'Total QR Codes', value: tables?.length || 0, icon: QrCode, color: 'text-primary' },
                            { label: 'Active Tables', value: tables?.filter(t => t.status === 'AVAILABLE').length || 0, icon: TableIcon, color: 'text-emerald-500' },
                            { label: 'Occupied', value: tables?.filter(t => t.status === 'OCCUPIED').length || 0, icon: Users, color: 'text-amber-500' },
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-card border-2 border-border/50 rounded-[2rem] p-6 shadow-xl shadow-black/5"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
                                        <h3 className="text-3xl font-black italic uppercase">{stat.value}</h3>
                                    </div>
                                    <div className={`p-4 rounded-2xl bg-muted/50 ${stat.color}`}>
                                        <stat.icon size={24} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* QR Management Grid */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="bg-card h-80 rounded-[2rem] border-2 border-border/50" />
                            ))}
                        </div>
                    ) : filteredTables.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredTables.map((table, i) => (
                                <motion.div
                                    key={table._id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="group bg-card border-2 border-border/50 rounded-[2.5rem] p-6 shadow-xl hover:shadow-2xl hover:border-primary/30 transition-all flex flex-col items-center text-center relative overflow-hidden"
                                >
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button
                                            onClick={() => {
                                                if (confirm('Are you sure? This will delete the table and its QR code.')) {
                                                    deleteTableMutation.mutate(table._id);
                                                }
                                            }}
                                            className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="mb-6 p-4 bg-white rounded-3xl shadow-lg border-4 border-muted group-hover:border-primary/20 transition-all">
                                        <img
                                            src={table.qrCodeImage}
                                            alt={`QR Table ${table.name}`}
                                            className="w-32 h-32 object-contain"
                                            loading="lazy"
                                        />
                                    </div>

                                    <div className="mb-6 flex-1">
                                        <h3 className="text-xl font-black italic uppercase mb-1">Table {table.name}</h3>
                                        <div className="flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                                            <MapPin size={12} />
                                            {table.location || 'Main Area'}
                                        </div>
                                        <div className="flex items-center justify-center gap-4">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Capacity</span>
                                                <span className="text-sm font-black italic">{table.capacity} Pax</span>
                                            </div>
                                            <div className="w-[1px] h-8 bg-border" />
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</span>
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${table.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                                    }`}>
                                                    {table.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full flex gap-3">
                                        <button
                                            onClick={() => downloadQR(table.qrCodeImage, table.name)}
                                            className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                                        >
                                            <DownloadCloud size={16} strokeWidth={3} />
                                            Download
                                        </button>
                                        <a
                                            href={`/menu/${restaurantId}/${table._id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-4 bg-muted hover:bg-border rounded-2xl transition-all"
                                            title="External Link to Menu"
                                        >
                                            <ExternalLink size={18} />
                                        </a>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-32 h-32 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                                <QrCode size={64} className="text-muted-foreground/30" />
                            </div>
                            <h3 className="text-2xl font-black italic uppercase mb-2">
                                {tables?.length > 0 ? 'No Tables Match Search' : 'No Tables Found'}
                            </h3>
                            <p className="text-muted-foreground font-medium mb-8">
                                {tables?.length > 0
                                    ? 'Try a different search term or clear the filter.'
                                    : 'Generate your first table in Table Management to get a QR code.'
                                }
                            </p>
                            {tables?.length === 0 && (
                                <button
                                    onClick={() => navigate('/tables')}
                                    className="px-8 py-4 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                                >
                                    <Plus size={18} strokeWidth={3} />
                                    Create New Table
                                </button>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default QRCodeManagement;
