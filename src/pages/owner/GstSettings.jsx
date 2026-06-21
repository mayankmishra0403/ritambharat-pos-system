import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { Plus, Percent, Star, Trash2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import GstSlabForm from '../../components/owner/GstSlabForm';

const GstSettings = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [restaurantId, setRestaurantId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingSlab, setEditingSlab] = useState(null);

    useEffect(() => {
        if (user?.restaurant) {
            setRestaurantId(typeof user.restaurant === 'object' ? user.restaurant._id : user.restaurant);
        }
    }, [user]);

    const { data: slabs = [], isLoading } = useQuery({
        queryKey: ['gst-slabs', restaurantId],
        queryFn: async () => {
            const res = await api.get(`/gst/slabs?restaurantId=${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId
    });

    const createMutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/gst/slabs', { ...data, restaurantId });
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gst-slabs', restaurantId] });
            setShowForm(false);
            toast.success('Tax slab created');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to create slab')
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, ...data }) => {
            const res = await api.patch(`/gst/slabs/${id}`, data);
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gst-slabs', restaurantId] });
            setShowForm(false);
            setEditingSlab(null);
            toast.success('Tax slab updated');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to update slab')
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            await api.delete(`/gst/slabs/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gst-slabs', restaurantId] });
            toast.success('Tax slab deleted');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete slab')
    });

    const setDefaultMutation = useMutation({
        mutationFn: async (id) => {
            const res = await api.patch(`/gst/slabs/${id}/default`);
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gst-slabs', restaurantId] });
            toast.success('Default slab updated');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to set default')
    });

    const initDefaultsMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post('/gst/init-defaults', { restaurantId });
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gst-slabs', restaurantId] });
            toast.success('Default tax slabs created');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to init defaults')
    });

    const handleSave = (data) => {
        if (editingSlab) {
            updateMutation.mutate({ id: editingSlab._id, ...data });
        } else {
            createMutation.mutate(data);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
            </div>
        );
    }

    return (
        <div className="flex bg-background min-h-screen text-foreground font-sans selection:bg-primary/30 transition-colors duration-300">
            <Sidebar
                open={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
            />

            {mobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header onMobileMenuClick={() => setMobileMenuOpen(true)} />

                <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-8 custom-scrollbar">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">GST / Tax Settings</h1>
                                <p className="text-sm text-muted-foreground">Manage tax slabs for GST-compliant invoicing</p>
                            </div>
                <div className="flex gap-2">
                    {slabs.length === 0 && (
                        <button
                            onClick={() => initDefaultsMutation.mutate()}
                            className="flex items-center gap-1.5 px-4 py-2 bg-muted/50 rounded-xl text-sm font-bold hover:bg-muted transition-colors"
                        >
                            <RefreshCw size={14} />
                            Init Defaults
                        </button>
                    )}
                    <button
                        onClick={() => { setEditingSlab(null); setShowForm(true); }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
                    >
                        <Plus size={14} />
                        Add Slab
                    </button>
                </div>
            </div>

            {slabs.length === 0 && (
                <div className="text-center py-16 bg-card border border-border rounded-2xl">
                    <Percent size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                    <h3 className="font-bold text-lg text-foreground mb-1">No Tax Slabs</h3>
                    <p className="text-sm text-muted-foreground mb-4">Add tax slabs or initialize defaults (5%, 12%, 18%, 28%)</p>
                    <button
                        onClick={() => initDefaultsMutation.mutate()}
                        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm"
                    >
                        Initialize Default Slabs
                    </button>
                </div>
            )}

            <div className="grid gap-3">
                {slabs.map((slab) => (
                    <div key={slab._id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <span className="text-lg font-black text-primary">{slab.rate}%</span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-foreground">{slab.name}</span>
                                    {slab.isDefault && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 flex items-center gap-0.5">
                                            <Star size={8} /> Default
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-3 mt-0.5 text-[11px] text-muted-foreground">
                                    {slab.cgstRate > 0 && <span>CGST: {slab.cgstRate}%</span>}
                                    {slab.sgstRate > 0 && <span>SGST: {slab.sgstRate}%</span>}
                                    {slab.igstRate > 0 && <span>IGST: {slab.igstRate}%</span>}
                                    {slab.cgstRate === 0 && slab.sgstRate === 0 && slab.igstRate === 0 && <span>No tax breakdown</span>}
                                    {slab.isInterState && <span className="text-blue-500">Inter-state</span>}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {!slab.isDefault && (
                                <button
                                    onClick={() => setDefaultMutation.mutate(slab._id)}
                                    className="p-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                                    title="Set as default"
                                >
                                    <Star size={14} />
                                </button>
                            )}
                            <button
                                onClick={() => { setEditingSlab(slab); setShowForm(true); }}
                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                            >
                                <Percent size={14} />
                            </button>
                            <button
                                onClick={() => deleteMutation.mutate(slab._id)}
                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

                    <GstSlabForm
                        slab={editingSlab}
                        open={showForm}
                        onClose={() => { setShowForm(false); setEditingSlab(null); }}
                        onSave={handleSave}
                        loading={createMutation.isPending || updateMutation.isPending}
                    />
                </div>
            </main>
        </div>
    </div>
    );
};

export default GstSettings;
