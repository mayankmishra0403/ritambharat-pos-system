import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, AlertTriangle, CheckCircle, Search, RefreshCw, XCircle, X, Plus, Filter, TrendingDown, TrendingUp, Package, DollarSign, Truck, Trash2, Edit2, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';

const InventoryManagement = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const queryClient = useQueryClient();
    const restaurantId = user?.restaurant?._id || user?.restaurant;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [filterCategory, setFilterCategory] = useState('All');

    // Modal States
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [stockAdjustment, setStockAdjustment] = useState({ type: 'restock', quantity: 0, reason: '' });

    const [newItem, setNewItem] = useState({
        name: '',
        category: 'Produce',
        stockQuantity: 0,
        lowStockThreshold: 10,
        maxStock: 100,
        unit: 'kg',
        costPrice: 0,
        supplier: '',
        image: ''
    });

    // Constants
    const CATEGORIES = ['Produce', 'Meat', 'Dairy', 'Dry Goods', 'Beverages', 'Spices', 'Packaging', 'Other'];

    // Fetch Inventory
    const { data: inventory, isLoading } = useQuery({
        queryKey: ['inventory', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return [];
            const res = await api.get(`/inventory/${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId
    });

    // Fetch Menu Items to compute recipe usage counts
    const { data: menuItems } = useQuery({
        queryKey: ['menu-items', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return [];
            const res = await api.get(`/menu/restaurant/${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId
    });

    // Compute recipe usage count per inventory item
    const recipeUsageMap = useMemo(() => {
        const map = {};
        if (!menuItems) return map;
        menuItems.forEach(item => {
            if (item.ingredients && item.ingredients.length > 0) {
                item.ingredients.forEach(ing => {
                    const id = ing.inventoryItem?._id || ing.inventoryItem;
                    if (id) {
                        map[id] = (map[id] || 0) + 1;
                    }
                });
            }
        });
        return map;
    }, [menuItems]);

    // Add Item Mutation
    const addItemMutation = useMutation({
        mutationFn: (data) => api.post('/inventory', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory', restaurantId] });
            toast.success('Item added to inventory');
            setShowAddItemModal(false);
            resetNewItem();
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to add item')
    });

    // Edit Item Mutation
    const editItemMutation = useMutation({
        mutationFn: (data) => api.put(`/inventory/${data._id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory', restaurantId] });
            toast.success('Item updated successfully');
            setShowAddItemModal(false);
            resetNewItem();
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to update item')
    });

    // Delete Item Mutation (Optimistic)
    const deleteItemMutation = useMutation({
        mutationFn: (id) => api.delete(`/inventory/${id}`),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['inventory', restaurantId] });
            const previousInventory = queryClient.getQueryData(['inventory', restaurantId]);
            queryClient.setQueryData(['inventory', restaurantId], (old) => {
                if (!old) return [];
                return old.filter(item => item._id !== id);
            });
            return { previousInventory };
        },
        onError: (err, variables, context) => {
            queryClient.setQueryData(['inventory', restaurantId], context.previousInventory);
            toast.error('Failed to remove item');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory', restaurantId] });
        },
        onSuccess: () => {
            toast.success('Item removed from inventory');
        }
    });

    // Update Stock Mutation (Optimistic)
    const updateStockMutation = useMutation({
        mutationFn: ({ id, quantity, reason }) => api.patch(`/inventory/${id}`, { quantity, reason }),
        onMutate: async ({ id, quantity }) => {
            await queryClient.cancelQueries({ queryKey: ['inventory', restaurantId] });
            const previousInventory = queryClient.getQueryData(['inventory', restaurantId]);
            queryClient.setQueryData(['inventory', restaurantId], (old) => {
                if (!old) return [];
                return old.map(item =>
                    item._id === id ? { ...item, stockQuantity: quantity, isLowStock: quantity <= item.lowStockThreshold } : item
                );
            });
            return { previousInventory };
        },
        onError: (err, variables, context) => {
            queryClient.setQueryData(['inventory', restaurantId], context.previousInventory);
            toast.error('Failed to update stock');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory', restaurantId] });
        },
        onSuccess: () => {
            toast.success('Stock updated successfully');
            setShowStockModal(false);
            setStockAdjustment({ type: 'restock', quantity: 0, reason: '' });
        }
    });

    const handleStockSubmit = (e) => {
        e.preventDefault();
        if (!selectedItem) return;

        let newQuantity = selectedItem.stockQuantity;
        const adjustmentQty = parseInt(stockAdjustment.quantity);

        if (stockAdjustment.type === 'restock') {
            newQuantity += adjustmentQty;
        } else {
            newQuantity -= adjustmentQty;
        }

        if (newQuantity < 0) {
            toast.error('Cannot reduce stock below zero');
            return;
        }

        updateStockMutation.mutate({
            id: selectedItem._id,
            quantity: newQuantity,
            reason: stockAdjustment.reason
        });
    };

    const handleAddItem = (e) => {
        e.preventDefault();
        if (newItem._id) {
            editItemMutation.mutate(newItem);
        } else {
            addItemMutation.mutate(newItem);
        }
    };

    const handleDeleteItem = () => {
        if (selectedItem) {
            deleteItemMutation.mutate(selectedItem._id);
            setShowDeleteModal(false);
            setSelectedItem(null);
        }
    };

    const openDeleteModal = (item) => {
        setSelectedItem(item);
        setShowDeleteModal(true);
    };

    const resetNewItem = () => {
        setNewItem({
            name: '',
            category: 'Produce',
            stockQuantity: 0,
            lowStockThreshold: 10,
            maxStock: 100,
            unit: 'kg',
            costPrice: 0,
            supplier: '',
            image: ''
        });
    };

    const openEditModal = (item) => {
        setNewItem(item);
        setShowAddItemModal(true);
    };

    const openStockModal = (item, type = 'restock') => {
        setSelectedItem(item);
        setStockAdjustment({ type, quantity: 0, reason: '' });
        setShowStockModal(true);
    };

    // Filter items
    const filteredItems = inventory?.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    // Stats
    const stats = {
        totalItems: inventory?.length || 0,
        lowStock: inventory?.filter(i => i.stockQuantity <= i.lowStockThreshold).length || 0,
        totalValue: Math.round(inventory?.reduce((acc, item) => acc + (item.stockQuantity * (item.costPrice || 0)), 0) || 0),
        outOfStock: inventory?.filter(i => i.stockQuantity === 0).length || 0
    };

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

                <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
                    {/* Header & Actions */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h1 className="text-3xl font-display font-bold text-foreground mb-1">
                                Inventory Management
                            </h1>
                            <p className="text-muted-foreground">
                                Track stock, manage suppliers, and monitor waste
                            </p>
                        </motion.div>
                        <button
                            onClick={() => setShowAddItemModal(true)}
                            className="btn-primary shadow-lg shadow-primary/20 gap-2"
                        >
                            <Plus size={20} /> Add Item
                        </button>
                    </div>

                    {/* Stats Carousel */}
                    <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory carousel-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-4 lg:pb-0 mb-8">
                        {[
                            { label: 'Total Items', value: stats.totalItems, icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                            { label: 'Low Stock', value: stats.lowStock, icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                            { label: 'Out of Stock', value: stats.outOfStock, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
                            { label: 'Est. Value', value: `₹${stats.totalValue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                        ].map((stat, i) => (
                            <div key={i} className="min-w-[240px] lg:min-w-0 snap-center bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl p-5 flex items-center gap-5 shadow-sm transition-all hover:shadow-md">
                                <div className={`p-4 rounded-xl ${stat.bg} ${stat.color} shadow-inner`}>
                                    <stat.icon size={22} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <p className="text-3xl font-black text-foreground tracking-tight">{stat.value}</p>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Filters & Search */}
                    <div className="flex flex-col gap-4 mb-8 bg-card border-4 border-border p-5 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                            <input
                                type="text"
                                placeholder="Search inventory..."
                                className="input pl-12 w-full bg-muted/30 border-none shadow-inner py-4 font-bold text-foreground placeholder:text-muted-foreground/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory carousel-scrollbar touch-pan-x -mx-2 px-2 relative">
                            {['All', ...CATEGORIES].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setFilterCategory(cat)}
                                    className={`px-7 py-3 rounded-2xl text-[10px] whitespace-nowrap transition-all font-black uppercase tracking-widest snap-center border-4 ${filterCategory === cat
                                        ? 'bg-primary text-primary-foreground border-primary shadow-[0_10px_25px_-5px_rgba(234,179,8,0.4)]'
                                        : 'bg-muted/50 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Inventory Items */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="h-48 rounded-2xl bg-muted/20 animate-pulse"></div>
                            ))}
                        </div>
                    ) : filteredItems?.length === 0 ? (
                        <div className="text-center py-20 bg-muted/10 rounded-2xl border border-dashed border-border">
                            <Package size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-xl font-bold text-foreground mb-2">No Items Found</h3>
                            <p className="text-muted-foreground mb-6">Adjust filters or add a new inventory item.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <AnimatePresence>
                                {filteredItems?.map((item) => (
                                    <motion.div
                                        key={item._id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className={`relative group rounded-[2.5rem] p-8 border-4 lg:border-[10px] shadow-2xl transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden ${item.stockQuantity === 0 ? 'bg-red-500/5 border-red-500/60' :
                                            item.isLowStock ? 'bg-yellow-500/5 border-yellow-500/60' :
                                                'bg-card border-border hover:border-primary'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-6 relative z-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center overflow-hidden border-2 border-border/50 shadow-inner">
                                                    {item.image ? (
                                                        <img src={item.image} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package size={28} className="text-muted-foreground/40" />
                                                    )}
                                                </div>
                                                    <div>
                                                        <h3 className="font-black text-xl text-foreground tracking-tight">{item.name}</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{item.category}</span>
                                                            {recipeUsageMap[item._id] > 0 && (
                                                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                                                                    Used in {recipeUsageMap[item._id]} recipe{recipeUsageMap[item._id] > 1 ? 's' : ''}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-lg font-black text-foreground">₹{(item.costPrice || 0).toFixed(2)}</span>
                                                <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Unit Cost</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4 relative z-10">
                                            <div className="flex justify-between items-center bg-background/40 backdrop-blur-md p-3 rounded-2xl border border-border/30">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Stock Status</span>
                                                <div className="flex items-center gap-2">
                                                    {item.isLowStock && <AlertTriangle size={14} className="text-yellow-500" />}
                                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${item.stockQuantity === 0 ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' :
                                                        item.isLowStock ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' :
                                                            'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                                        }`}>
                                                        {item.stockQuantity === 0 ? 'Out of Stock' : item.isLowStock ? 'Low Stock' : 'In Stock'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="bg-foreground/5 p-4 rounded-2xl border border-border/10 space-y-3">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Availability</span>
                                                    <span className="text-sm font-black text-foreground">{item.stockQuantity} / {item.maxStock || 100} {item.unit || 'Units'}</span>
                                                </div>
                                                <div className="w-full h-3 bg-muted/50 rounded-full overflow-hidden border border-border/20">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min((item.stockQuantity / (item.maxStock || 100)) * 100, 100)}%` }}
                                                        transition={{ duration: 1, ease: "easeOut" }}
                                                        className={`h-full rounded-full ${item.stockQuantity === 0 ? 'bg-red-500' :
                                                            item.isLowStock ? 'bg-yellow-500' : 'bg-emerald-500'
                                                            }`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-2xl border border-border/10">
                                                <Truck size={14} className="text-muted-foreground" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Supplier: {item.supplier || 'Not Assigned'}</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="mt-6 pt-6 border-t border-border/30 grid grid-cols-2 gap-3 relative z-10">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openStockModal(item, 'restock');
                                                }}
                                                className="py-3 bg-emerald-500/10 text-emerald-600 font-black text-[10px] uppercase tracking-widest border-2 border-emerald-500/20 rounded-2xl hover:bg-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 group/btn"
                                            >
                                                <TrendingUp size={14} strokeWidth={3} className="group-hover/btn:scale-110 transition-transform" /> Restock
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openStockModal(item, 'waste');
                                                }}
                                                className="py-3 bg-red-500/10 text-red-600 font-black text-[10px] uppercase tracking-widest border-2 border-red-500/20 rounded-2xl hover:bg-red-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 group/btn"
                                            >
                                                <TrendingDown size={14} strokeWidth={3} className="group-hover/btn:scale-110 transition-transform" /> Waste
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEditModal(item);
                                                }}
                                                className="py-3 bg-muted/30 text-muted-foreground/60 font-black text-[9px] uppercase tracking-widest border-2 border-transparent rounded-2xl hover:text-foreground hover:border-border transition-all active:scale-95 mt-2"
                                            >
                                                Edit Item Details
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openDeleteModal(item);
                                                }}
                                                className="py-3 bg-red-500/5 text-red-500/40 font-black text-[9px] uppercase tracking-widest border-2 border-transparent rounded-2xl hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-95 mt-2"
                                            >
                                                Delete Item
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </main>
            </div>

            {/* Stock Adjustment Modal */}
            <AnimatePresence>
                {showStockModal && selectedItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, y: "100%" }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="bg-card w-full max-w-lg h-full sm:h-auto sm:rounded-3xl shadow-2xl overflow-hidden border border-border/50 flex flex-col"
                        >
                            <div className="p-6 border-b border-border/50 flex justify-between items-center bg-card/80 backdrop-blur-md">
                                <div>
                                    <h3 className="text-2xl font-black text-foreground tracking-tight">
                                        {stockAdjustment.type === 'restock' ? 'Restock Item' : 'Record Waste'}
                                    </h3>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                        {selectedItem.name}
                                    </p>
                                </div>
                                <button onClick={() => setShowStockModal(false)} className="bg-muted/50 text-foreground hover:bg-muted p-2.5 rounded-2xl transition-all active:scale-90">
                                    <X size={24} strokeWidth={2.5} />
                                </button>
                            </div>

                            <form onSubmit={handleStockSubmit} className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Quantity ({selectedItem.unit || 'Units'})</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={stockAdjustment.quantity}
                                        onChange={(e) => setStockAdjustment({ ...stockAdjustment, quantity: e.target.value })}
                                        className="input w-full bg-muted/30 border-2 border-transparent focus:border-primary/50 transition-all font-bold py-4 text-lg"
                                        placeholder="0"
                                        autoFocus
                                        required
                                    />
                                </div>

                                {stockAdjustment.type === 'waste' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Reason for Waste</label>
                                        <div className="relative group">
                                            <select
                                                value={stockAdjustment.reason}
                                                onChange={(e) => setStockAdjustment({ ...stockAdjustment, reason: e.target.value })}
                                                className="input w-full bg-muted/30 border-2 border-border focus:border-primary transition-all font-bold py-4 px-6 text-foreground appearance-none rounded-2xl cursor-pointer"
                                                required
                                            >
                                                <option value="" className="bg-card text-foreground">Select Reason</option>
                                                <option value="Spoilage" className="bg-card text-foreground">Spoilage</option>
                                                <option value="Damage" className="bg-card text-foreground">Damage</option>
                                                <option value="Theft" className="bg-card text-foreground">Theft</option>
                                                <option value="Mistake" className="bg-card text-foreground">Kitchen Mistake</option>
                                                <option value="Other" className="bg-card text-foreground">Other</option>
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-primary group-focus-within:rotate-180 transition-transform">
                                                <Plus size={20} className="rotate-45" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-6 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowStockModal(false)}
                                        className="flex-1 py-4 bg-muted/50 text-foreground font-black uppercase tracking-widest rounded-2xl border-2 border-border/50 hover:bg-muted transition-all active:scale-95"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className={`flex-[2] py-4 font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 ${stockAdjustment.type === 'restock'
                                            ? 'bg-primary text-primary-foreground shadow-primary/20 hover:brightness-110'
                                            : 'bg-red-500 text-white shadow-red-500/20 hover:bg-red-600'
                                            }`}
                                    >
                                        {stockAdjustment.type === 'restock' ? 'Update Inventory' : 'Confirm Waste'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Item Modal */}
            <AnimatePresence>
                {showAddItemModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, y: "100%" }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="bg-card w-full max-w-2xl h-full sm:h-auto sm:max-h-[90vh] sm:rounded-3xl shadow-2xl overflow-hidden border border-border/50 flex flex-col"
                        >
                            <div className="p-6 border-b border-border/50 flex justify-between items-center bg-card/80 backdrop-blur-md">
                                <div>
                                    <h3 className="text-2xl font-black text-foreground tracking-tight">
                                        {newItem._id ? 'Edit Item' : 'Add New Item'}
                                    </h3>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                        {newItem._id ? `Updating ${newItem.name}` : 'Update your stock supplies'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowAddItemModal(false);
                                        resetNewItem();
                                    }}
                                    className="bg-muted/50 text-foreground hover:bg-muted p-2.5 rounded-2xl transition-all active:scale-90"
                                >
                                    <XCircle size={24} strokeWidth={2.5} />
                                </button>
                            </div>

                            <form onSubmit={handleAddItem} className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Item Name</label>
                                        <input
                                            type="text"
                                            value={newItem.name}
                                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                            className="input w-full bg-muted/30 border-2 border-transparent focus:border-primary/50 transition-all font-bold py-4"
                                            placeholder="e.g. Fresh Tomatoes"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">SKU / Code</label>
                                        <input
                                            type="text"
                                            value={newItem.sku}
                                            onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                                            className="input w-full bg-muted/30 border-2 border-transparent focus:border-primary/50 transition-all font-bold py-4"
                                            placeholder="SKU-001"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Category</label>
                                        <select
                                            value={newItem.category}
                                            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                            className="input w-full bg-muted/30 border-2 border-border focus:border-primary font-bold py-4 px-6 text-foreground appearance-none rounded-2xl"
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat} value={cat} className="bg-card text-foreground">{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Unit</label>
                                        <select
                                            value={newItem.unit}
                                            onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                                            className="input w-full bg-muted/30 border-2 border-border focus:border-primary font-bold py-4 px-6 text-foreground appearance-none rounded-2xl"
                                        >
                                            <option value="kg" className="bg-card text-foreground">Kg</option>
                                            <option value="gram" className="bg-card text-foreground">Gram</option>
                                            <option value="liter" className="bg-card text-foreground">Liter</option>
                                            <option value="ml" className="bg-card text-foreground">ml</option>
                                            <option value="piece" className="bg-card text-foreground">Piece</option>
                                            <option value="box" className="bg-card text-foreground">Box</option>
                                            <option value="dozen" className="bg-card text-foreground">Dozen</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Current Stock</label>
                                        <input
                                            type="number"
                                            value={newItem.stockQuantity}
                                            onChange={(e) => setNewItem({ ...newItem, stockQuantity: parseInt(e.target.value) })}
                                            className="input w-full bg-muted/30 border-2 border-transparent focus:border-primary/50 transition-all font-bold py-4"
                                            placeholder="0"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Low Stock Alert at (Optional)</label>
                                        <input
                                            type="number"
                                            value={newItem.lowStockThreshold}
                                            onChange={(e) => setNewItem({ ...newItem, lowStockThreshold: parseInt(e.target.value) || 10 })}
                                            className="input w-full bg-muted/30 border-2 border-transparent focus:border-primary/50 transition-all font-bold py-4"
                                            placeholder="10"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cost Price (₹) (Optional)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={newItem.costPrice}
                                            onChange={(e) => setNewItem({ ...newItem, costPrice: parseFloat(e.target.value) || 0 })}
                                            className="input w-full bg-muted/30 border-2 border-transparent focus:border-primary/50 transition-all font-bold py-4"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Supplier (Optional)</label>
                                        <input
                                            type="text"
                                            value={newItem.supplier}
                                            onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                                            className="input w-full bg-muted/30 border-2 border-transparent focus:border-primary/50 transition-all font-bold py-4"
                                            placeholder="Supplier Name"
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-border/50 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddItemModal(false);
                                            resetNewItem();
                                        }}
                                        className="flex-1 py-4 bg-muted/50 text-foreground font-black uppercase tracking-widest rounded-2xl border-2 border-border/50 hover:bg-muted transition-all active:scale-95"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={addItemMutation.isPending || editItemMutation.isPending}
                                        className="flex-[2] py-4 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {addItemMutation.isPending || editItemMutation.isPending ? 'Saving...' : newItem._id ? 'Update Item' : 'Add to Inventory'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && selectedItem && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-card border-4 border-border w-full max-w-md sm:rounded-[3rem] p-8 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden text-center"
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none" />
                            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-red-500/20 shadow-inner">
                                <Trash2 size={40} className="text-red-500 animate-pulse" />
                            </div>
                            <h3 className="text-3xl font-black text-foreground mb-2 tracking-tight">Are you sure?</h3>
                            <p className="text-muted-foreground font-medium mb-8 leading-relaxed">
                                You are about to permanently remove <span className="text-foreground font-black underline decoration-red-500 decoration-4 underline-offset-4">{selectedItem.name}</span> from your inventory. This action cannot be undone.
                            </p>
                            {recipeUsageMap[selectedItem._id] > 0 && (
                                <div className="bg-yellow-500/10 border-2 border-yellow-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
                                    <AlertTriangle size={20} className="text-yellow-500 flex-shrink-0" />
                                    <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest text-left">
                                        This item is used in {recipeUsageMap[selectedItem._id]} menu recipe{recipeUsageMap[selectedItem._id] > 1 ? 's' : ''}. Deleting it will break those recipes.
                                    </p>
                                </div>
                            )}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setSelectedItem(null);
                                    }}
                                    className="flex-1 py-4 bg-muted/50 text-muted-foreground font-black uppercase tracking-widest rounded-2xl border-4 border-transparent hover:bg-muted hover:text-foreground transition-all active:scale-95"
                                >
                                    No, Keep it
                                </button>
                                <button
                                    onClick={handleDeleteItem}
                                    disabled={deleteItemMutation.isPending}
                                    className="flex-1 py-4 bg-red-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_20px_40px_-10px_rgba(239,68,68,0.3)] hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {deleteItemMutation.isPending ? 'Removing...' : 'Yes, Delete'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InventoryManagement;
