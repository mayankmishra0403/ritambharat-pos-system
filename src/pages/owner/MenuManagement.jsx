import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Box, AlertTriangle, CheckCircle, XCircle, Upload, Clock, Flame, Utensils, Info, ChefHat, DollarSign, Package, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';

const MenuManagement = () => {
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [editingItem, setEditingItem] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('details');
    const queryClient = useQueryClient();
    const restaurantId = user?.restaurant?._id || user?.restaurant;

    // Recipe state
    const [recipeIngredients, setRecipeIngredients] = useState([]);
    const [inventorySearch, setInventorySearch] = useState('');

    // Fetch Menu Items
    const { data: menuItems, isLoading } = useQuery({
        queryKey: ['menuItems', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return [];
            const res = await api.get(`/menu?restaurant=${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId
    });

    // Fetch Inventory Items for recipe picker
    const { data: inventoryItems = [] } = useQuery({
        queryKey: ['inventory', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return [];
            const res = await api.get(`/inventory/${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data) => api.post('/menu', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['menuItems']);
            setIsModalOpen(false);
            if (editingItem) setEditingItem(null);
            toast.success('Menu item saved successfully');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to save item')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.patch(`/menu/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['menuItems']);
            setIsModalOpen(false);
            setEditingItem(null);
            toast.success('Menu item updated');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to update item')
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/menu/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['menuItems']);
            toast.success('Menu item deleted');
        }
    });

    const toggleAvailabilityMutation = useMutation({
        mutationFn: (id) => api.patch(`/menu/${id}/availability`),
        onSuccess: () => {
            queryClient.invalidateQueries(['menuItems']);
            toast.success('Availability updated');
        }
    });

    const saveRecipeMutation = useMutation({
        mutationFn: ({ id, ingredients }) => api.put(`/menu/${id}/ingredients`, { ingredients }),
        onSuccess: () => {
            queryClient.invalidateQueries(['menuItems']);
            toast.success('Recipe saved successfully');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to save recipe')
    });

    const filteredInventory = useMemo(() => {
        if (!inventorySearch) return inventoryItems;
        const term = inventorySearch.toLowerCase();
        return inventoryItems.filter(item =>
            item.name.toLowerCase().includes(term) || item.category?.toLowerCase().includes(term)
        );
    }, [inventoryItems, inventorySearch]);

    const recipeCostBreakdown = useMemo(() => {
        if (!recipeIngredients.length) return { items: [], totalCost: 0, profitMargin: 0, profitPercentage: 0 };
        const items = recipeIngredients.map(ing => {
            const invItem = inventoryItems.find(i => i._id === ing.inventoryItem);
            const costPerUnit = invItem?.costPrice || 0;
            const lineCost = costPerUnit * ing.quantity;
            return {
                ...ing,
                name: invItem?.name || 'Unknown',
                costPerUnit,
                lineCost
            };
        });
        const totalCost = items.reduce((s, i) => s + i.lineCost, 0);
        const price = editingItem?.price || 0;
        return {
            items,
            totalCost,
            profitMargin: price - totalCost,
            profitPercentage: price > 0 ? ((price - totalCost) / price) * 100 : 0
        };
    }, [recipeIngredients, inventoryItems, editingItem?.price]);

    const addIngredient = (inventoryItem) => {
        if (recipeIngredients.some(i => i.inventoryItem === inventoryItem._id)) {
            toast.error('Ingredient already added');
            return;
        }
        setRecipeIngredients(prev => [...prev, {
            inventoryItem: inventoryItem._id,
            quantity: 100,
            unit: inventoryItem.unit || 'g'
        }]);
        setInventorySearch('');
    };

    const removeIngredient = (index) => {
        setRecipeIngredients(prev => prev.filter((_, i) => i !== index));
    };

    const updateIngredient = (index, field, value) => {
        setRecipeIngredients(prev => prev.map((ing, i) =>
            i === index ? { ...ing, [field]: value } : ing
        ));
    };

    // Form Handler
    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const data = {
            restaurant: restaurantId,
            name: formData.get('name'),
            description: formData.get('description'),
            price: Number(formData.get('price')),
            category: formData.get('category'),
            stockQuantity: Number(formData.get('stockQuantity')),
            images: uploadedImages,
            image: uploadedImages[0] || "",
            prepTime: Number(formData.get('prepTime')) || 0,
            nutritionalInfo: {
                calories: Number(formData.get('calories')) || 0
            }
        };

        if (editingItem) {
            updateMutation.mutate({ id: editingItem._id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setActiveTab('details');
        setUploadedImages(item.images?.length > 0 ? item.images : item.image ? [item.image] : []);
        setRecipeIngredients((item.ingredients || []).map(i => ({
            inventoryItem: typeof i.inventoryItem === 'object' ? i.inventoryItem._id : i.inventoryItem,
            quantity: i.quantity,
            unit: i.unit
        })));
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleSaveRecipe = () => {
        if (!editingItem) {
            toast.error('Save the menu item first, then add a recipe');
            return;
        }
        saveRecipeMutation.mutate({
            id: editingItem._id,
            ingredients: recipeIngredients.map(i => ({
                inventoryItem: i.inventoryItem,
                quantity: Number(i.quantity),
                unit: i.unit
            }))
        });
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        if (uploadedImages.length + files.length > 4) {
            toast.error("Maximum 4 images allowed");
            return;
        }

        setUploading(true);
        const toastId = toast.loading("Uploading images...");

        try {
            const uploadPromises = files.map(async (file) => {
                const formDataUpload = new FormData();
                formDataUpload.append('image', file);
                const res = await api.post('/upload/image', formDataUpload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                return res.data.data.url;
            });

            const urls = await Promise.all(uploadPromises);
            setUploadedImages(prev => [...prev, ...urls]);
            toast.success('Upload complete', { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Upload failed', { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index) => {
        setUploadedImages(prev => prev.filter((_, i) => i !== index));
    };

    // Filtering
    const categories = ['All', 'Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Salad', 'Soup', 'Side Dish', 'Special'];

    const filteredItems = menuItems?.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setActiveTab('details');
        setRecipeIngredients([]);
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
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h1 className="text-3xl font-display font-bold text-foreground mb-1">
                                Menu Management
                            </h1>
                            <p className="text-muted-foreground">
                                Manage items, stock, pricing, and details
                            </p>
                        </motion.div>
                        <button
                            onClick={() => { setEditingItem(null); setActiveTab('details'); setIsModalOpen(true); }}
                            className="btn-primary shadow-lg shadow-primary/20 gap-2"
                        >
                            <Plus size={20} /> Add New Item
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col gap-4 mb-8 bg-card border-4 border-border p-5 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                            <input
                                type="text"
                                placeholder="Search menu favorites..."
                                className="input pl-12 w-full bg-muted/40 border-none shadow-inner py-4 font-bold text-foreground placeholder:text-muted-foreground/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory carousel-scrollbar touch-pan-x -mx-2 px-2 relative">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-7 py-3 rounded-2xl text-[10px] whitespace-nowrap transition-all font-black uppercase tracking-widest snap-center border-4 ${selectedCategory === cat
                                        ? 'bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20'
                                        : 'bg-muted/20 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="h-96 rounded-2xl bg-muted/20 animate-pulse"></div>
                            ))}
                        </div>
                    ) : (
                        <motion.div
                            layout
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            <AnimatePresence>
                                {filteredItems?.map((item) => (
                                    <motion.div
                                        key={item._id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="group bg-card border-4 lg:border-[10px] border-border hover:border-primary/60 rounded-[3rem] overflow-hidden shadow-2xl hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] transition-all duration-700 flex flex-col relative"
                                    >
                                        <div className="relative h-56 bg-muted overflow-hidden">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" onError={(e) => { e.target.style.display = 'none'; }} />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-muted-foreground/30">
                                                    <Box size={48} strokeWidth={1.5} />
                                                </div>
                                            )}

                                            {/* Status Badge Overlays */}
                                            <div className="absolute top-3 left-3 flex flex-wrap gap-2 max-w-[80%]">
                                                {item.hasRecipe && (
                                                    <span className="bg-emerald-500/90 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-lg flex items-center gap-1 ring-2 ring-white/20">
                                                        <ChefHat size={10} /> Recipe
                                                    </span>
                                                )}
                                                {item.isLowStock && (
                                                    <span className="bg-red-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 uppercase tracking-tighter ring-2 ring-white/20">
                                                        <AlertTriangle size={10} /> Urgent: Low Stock
                                                    </span>
                                                )}
                                                <div className="flex gap-1.5">
                                                    {item.model3D?.glb && (
                                                        <span className="bg-purple-600/90 backdrop-blur-md text-white px-2 py-0.5 rounded-full font-black text-[9px] border border-white/20 uppercase">3D View</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                                                <div className="flex justify-between items-end gap-2">
                                                    <h3 className="font-black text-xl text-white leading-tight tracking-tight drop-shadow-lg truncate">{item.name}</h3>
                                                    <span className="text-primary-foreground bg-primary px-3 py-1 rounded-xl font-black text-xs shadow-xl ring-2 ring-primary/20 flex-shrink-0">${parseFloat(item.price).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-5 flex-1 flex flex-col gap-4">
                                            <p className="text-sm font-medium text-muted-foreground/80 line-clamp-2 leading-relaxed min-h-[2.8em]">{item.description || 'No description provided.'}</p>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="flex items-center gap-2 bg-muted/20 p-2 rounded-xl border border-border/20">
                                                    <Clock size={14} className="text-blue-500" />
                                                    <span className="text-[11px] font-black text-foreground uppercase tracking-tighter">{item.prepTime || 15}m Prep</span>
                                                </div>
                                                <div className="flex items-center gap-2 bg-muted/20 p-2 rounded-xl border border-border/20">
                                                    <Flame size={14} className="text-orange-500" />
                                                    <span className="text-[11px] font-black text-foreground uppercase tracking-tighter">{item.nutritionalInfo?.calories || 0} kcal</span>
                                                </div>
                                            </div>

                                            {/* Recipe cost row */}
                                            {item.costPrice > 0 && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="flex items-center gap-2 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                                                        <DollarSign size={14} className="text-emerald-500" />
                                                        <span className="text-[11px] font-black text-foreground uppercase tracking-tighter">Cost ${item.costPrice.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-blue-500/10 p-2 rounded-xl border border-blue-500/20">
                                                        <Info size={14} className="text-blue-500" />
                                                        <span className="text-[11px] font-black text-foreground uppercase tracking-tighter">{item.profitPercentage?.toFixed(0) || 0}% Margin</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center bg-foreground/5 p-3 rounded-xl text-xs font-black uppercase tracking-widest mt-auto border border-border/10">
                                                <span className="text-muted-foreground/60">Stock Level</span>
                                                <span className={`${item.stockQuantity === 0 ? 'text-red-500' :
                                                    item.isLowStock ? 'text-yellow-500' : 'text-emerald-500'
                                                    }`}>
                                                    {item.stockQuantity} Units
                                                </span>
                                            </div>
                                        </div>

                                        <div className="px-5 py-4 border-t border-border/30 flex justify-between items-center bg-muted/5 gap-4">
                                            <button
                                                onClick={() => toggleAvailabilityMutation.mutate(item._id)}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border-2 ${item.isAvailable
                                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
                                                    : 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20'
                                                    }`}
                                            >
                                                {item.isAvailable ? <><CheckCircle size={14} strokeWidth={3} /> Active</> : <><XCircle size={14} strokeWidth={3} /> Hidden</>}
                                            </button>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="p-2.5 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-2 border-blue-500/20 rounded-xl transition-all active:scale-90"
                                                    title="Edit"
                                                >
                                                    <Edit size={18} strokeWidth={2.5} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item._id)}
                                                    className="p-2.5 bg-red-500/10 text-red-600 hover:bg-red-500/20 border-2 border-red-500/20 rounded-xl transition-all active:scale-90"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {/* Empty State */}
                    {!isLoading && filteredItems?.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="bg-muted p-6 rounded-full mb-4">
                                <Utensils size={48} className="text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">No menu items found</h3>
                            <p className="text-muted-foreground mb-6 max-w-md">
                                {searchTerm ? `No items match "${searchTerm}"` : 'Get started by adding your first menu item.'}
                            </p>
                            <button
                                onClick={() => { setEditingItem(null); setSearchTerm(''); setIsModalOpen(true); }}
                                className="btn-primary"
                            >
                                <Plus size={18} className="mr-2" /> Add Item
                            </button>
                        </div>
                    )}

                    {/* Modal */}
                    <AnimatePresence>
                        {isModalOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
                                <motion.div
                                    initial={{ opacity: 0, y: "100%" }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: "100%" }}
                                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                    className="bg-card w-full max-w-4xl h-full sm:h-auto sm:max-h-[90vh] sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-border/50"
                                >
                                    <div className="p-6 border-b border-border/50 flex justify-between items-center bg-card/80 backdrop-blur-md z-11">
                                        <div>
                                            <h3 className="text-2xl font-black text-foreground tracking-tight">{editingItem ? 'Edit Item' : 'New Creation'}</h3>
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{editingItem ? 'Refine your menu details' : 'Add another masterpiece'}</p>
                                        </div>
                                        <button onClick={handleCloseModal} className="bg-muted/50 text-foreground hover:bg-muted p-2.5 rounded-2xl transition-all active:scale-90">
                                            <XCircle size={24} strokeWidth={2.5} />
                                        </button>
                                    </div>

                                    {/* Tab Headers */}
                                    <div className="flex border-b border-border/50 bg-muted/10">
                                        <button
                                            onClick={() => setActiveTab('details')}
                                            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'details'
                                                ? 'border-primary text-primary bg-primary/5'
                                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                                }`}
                                        >
                                            <Utensils size={16} className="inline mr-2" /> Details
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('recipe')}
                                            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'recipe'
                                                ? 'border-primary text-primary bg-primary/5'
                                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                                }`}
                                        >
                                            <ChefHat size={16} className="inline mr-2" /> Recipe & Costing
                                        </button>
                                    </div>

                                    {activeTab === 'details' && (
                                        <>
                                            <form id="menu-form" onSubmit={handleSubmit} className="p-6 md:p-10 space-y-12 overflow-y-auto custom-scrollbar flex-1 pb-32 sm:pb-10">
                                                {/* Professional Basics */}
                                                <div className="space-y-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                                            <Utensils size={22} strokeWidth={2.5} />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-lg font-black text-foreground tracking-tight">Essential Details</h4>
                                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">General information for guests</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <div className="space-y-3">
                                                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Product Name</label>
                                                            <input name="name" defaultValue={editingItem?.name} required className="input w-full bg-muted/40 border-2 border-transparent focus:border-primary/50 transition-all font-bold py-4 text-lg rounded-2xl" placeholder="e.g. Wagyu Beef Slider" />
                                                        </div>

                                                        <div className="space-y-3">
                                                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Menu Category</label>
                                                            <div className="relative group">
                                                                <select
                                                                    name="category"
                                                                    defaultValue={editingItem?.category || 'Main Course'}
                                                                    className="input w-full bg-muted/40 border-2 border-transparent focus:border-primary/50 transition-all font-bold py-4 px-6 text-foreground appearance-none rounded-2xl cursor-pointer"
                                                                >
                                                                    {categories.filter(c => c !== 'All').map(c => (
                                                                        <option key={c} value={c} className="bg-card text-foreground py-4">
                                                                            {c}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-primary group-focus-within:rotate-180 transition-transform">
                                                                    <Plus size={20} className="rotate-45" />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="md:col-span-2 space-y-3">
                                                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Detailed Description</label>
                                                            <textarea name="description" defaultValue={editingItem?.description} className="input w-full h-32 resize-none bg-muted/40 border-2 border-transparent focus:border-primary/50 transition-all font-medium leading-relaxed rounded-2xl p-4" placeholder="Describe the flavors, texture, and origin..." />
                                                        </div>

                                                        <div className="space-y-3">
                                                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Listed Price</label>
                                                            <div className="relative">
                                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-lg">$</span>
                                                                <input type="number" name="price" defaultValue={editingItem?.price} required min="0" step="0.01" className="input w-full pl-12 bg-muted/40 border-2 border-transparent focus:border-primary/50 transition-all font-bold py-4 text-lg rounded-2xl" placeholder="0.00" />
                                                            </div>
                                                        </div>

                                                        <div className="md:col-span-2 space-y-4">
                                                            <div className="flex justify-between items-end">
                                                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Upload Images (Max 4)</label>
                                                                <span className="text-[10px] font-black text-muted-foreground mr-1">{uploadedImages.length}/4</span>
                                                            </div>
                                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                                <AnimatePresence>
                                                                    {uploadedImages.map((url, idx) => (
                                                                        <motion.div
                                                                            key={url}
                                                                            initial={{ opacity: 0, scale: 0.8 }}
                                                                            animate={{ opacity: 1, scale: 1 }}
                                                                            exit={{ opacity: 0, scale: 0.8 }}
                                                                            className="relative aspect-square rounded-2xl overflow-hidden border-4 border-border group"
                                                                        >
                                                                            <img src={url} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => removeImage(idx)}
                                                                                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                                                            >
                                                                                <XCircle size={16} strokeWidth={3} />
                                                                            </button>
                                                                        </motion.div>
                                                                    ))}
                                                                </AnimatePresence>

                                                                {uploadedImages.length < 4 && (
                                                                    <label className="aspect-square rounded-2xl border-4 border-dashed border-border flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group">
                                                                        <div className="p-3 bg-muted rounded-xl group-hover:bg-primary/10 transition-colors">
                                                                            <Upload size={24} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                                                        </div>
                                                                        <span className="text-[10px] font-black uppercase text-muted-foreground">Add Image</span>
                                                                        <input type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*" />
                                                                    </label>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Service Metrics */}
                                                <div className="space-y-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                                                            <Clock size={22} strokeWidth={2.5} />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-lg font-black text-foreground tracking-tight">Service & Stock</h4>
                                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Backend operational controls</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                                                        <div className="space-y-3">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Prep Time (Mins)</label>
                                                            <input type="number" name="prepTime" defaultValue={editingItem?.prepTime ?? 15} required min="0" className="input w-full bg-blue-500/5 border-2 border-transparent focus:border-blue-500/30 transition-all font-black py-4 text-center rounded-2xl text-lg" />
                                                        </div>
                                                        <div className="space-y-3">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Calories (Kcal)</label>
                                                            <input type="number" name="calories" defaultValue={editingItem?.nutritionalInfo?.calories ?? 450} required min="0" className="input w-full bg-orange-500/5 border-2 border-transparent focus:border-orange-500/30 transition-all font-black py-4 text-center rounded-2xl text-lg" />
                                                        </div>
                                                        <div className="space-y-3">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Units In Stock</label>
                                                            <input type="number" name="stockQuantity" defaultValue={editingItem?.stockQuantity ?? 100} required min="0" className="input w-full bg-emerald-500/5 border-2 border-transparent focus:border-emerald-500/30 transition-all font-black py-4 text-center rounded-2xl text-lg" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </form>

                                            <div className="fixed bottom-0 left-0 right-0 p-8 bg-card/80 backdrop-blur-2xl border-t border-border/50 sm:relative sm:bg-transparent sm:border-t-0 flex gap-6 z-20">
                                                <button type="button" onClick={handleCloseModal} className="flex-1 py-5 bg-muted/50 text-foreground font-black uppercase tracking-widest rounded-[2rem] border-4 border-border/50 hover:bg-muted transition-all active:scale-95 text-xs">
                                                    Discard
                                                </button>
                                                <button
                                                    form="menu-form"
                                                    type="submit"
                                                    disabled={createMutation.isPending || updateMutation.isPending}
                                                    className="flex-[2] py-5 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-[2rem] shadow-2xl shadow-primary/30 hover:brightness-110 transition-all active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Publish Changes'}
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {activeTab === 'recipe' && (
                                        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                                            {/* Ingredient Picker */}
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                                                        <Package size={22} strokeWidth={2.5} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-black text-foreground tracking-tight">Ingredients</h4>
                                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Link inventory items to this recipe</p>
                                                    </div>
                                                </div>

                                                {/* Search Inventory */}
                                                <div className="relative">
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                                    <input
                                                        type="text"
                                                        placeholder="Search inventory items to add..."
                                                        className="input pl-12 w-full bg-muted/40 border-2 border-border focus:border-primary/50 transition-all font-bold py-4 rounded-2xl"
                                                        value={inventorySearch}
                                                        onChange={(e) => setInventorySearch(e.target.value)}
                                                    />
                                                </div>

                                                {/* Inventory results dropdown */}
                                                {inventorySearch && filteredInventory.length > 0 && (
                                                    <div className="bg-card border-4 border-border rounded-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar shadow-2xl">
                                                        {filteredInventory.map(item => (
                                                            <button
                                                                key={item._id}
                                                                onClick={() => addIngredient(item)}
                                                                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-all border-b border-border/20 last:border-0 text-left"
                                                            >
                                                                <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center flex-shrink-0">
                                                                    <Package size={18} className="text-muted-foreground" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-black text-foreground truncate">{item.name}</p>
                                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                                        {item.category} · ${item.costPrice?.toFixed(2)}/{item.unit}
                                                                    </p>
                                                                </div>
                                                                <div className="text-xs font-black text-primary uppercase tracking-widest flex-shrink-0">+ Add</div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Selected Ingredients List */}
                                                {recipeIngredients.length === 0 ? (
                                                    <div className="bg-muted/20 border-4 border-dashed border-border rounded-[2rem] p-10 text-center">
                                                        <Package size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                                                        <p className="font-black text-muted-foreground/50 uppercase tracking-widest text-xs">No ingredients added yet</p>
                                                        <p className="text-muted-foreground/40 text-sm mt-1">Search and add inventory items above</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {recipeIngredients.map((ing, idx) => {
                                                            const invItem = inventoryItems.find(i => i._id === ing.inventoryItem);
                                                            return (
                                                                <motion.div
                                                                    key={idx}
                                                                    initial={{ opacity: 0, x: -20 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    className="flex items-center gap-4 bg-muted/20 p-4 rounded-2xl border-4 border-border group"
                                                                >
                                                                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                                                        <Package size={18} className="text-emerald-500" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-black text-foreground truncate">{invItem?.name || 'Unknown Item'}</p>
                                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                                            ${invItem?.costPrice?.toFixed(2) || '0.00'}/{ing.unit}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <input
                                                                            type="number"
                                                                            value={ing.quantity}
                                                                            onChange={(e) => updateIngredient(idx, 'quantity', Number(e.target.value) || 0)}
                                                                            className="w-20 text-center bg-muted/40 border-2 border-border rounded-xl font-black py-3 text-sm"
                                                                            min="0"
                                                                            step="1"
                                                                        />
                                                                        <select
                                                                            value={ing.unit}
                                                                            onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                                                                            className="bg-muted/40 border-2 border-border rounded-xl font-black py-3 px-3 text-sm"
                                                                        >
                                                                            {['g', 'ml', 'kg', 'l', 'pcs', 'tsp', 'tbsp', 'cup', 'oz', 'lb'].map(u => (
                                                                                <option key={u} value={u}>{u}</option>
                                                                            ))}
                                                                        </select>
                                                                        <span className="text-xs font-black text-muted-foreground w-20 text-right">
                                                                            ${((invItem?.costPrice || 0) * ing.quantity).toFixed(2)}
                                                                        </span>
                                                                        <button
                                                                            onClick={() => removeIngredient(idx)}
                                                                            className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                                        >
                                                                            <X size={16} />
                                                                        </button>
                                                                    </div>
                                                                </motion.div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Costing Summary */}
                                            <div className="bg-gradient-to-br from-emerald-500/5 to-blue-500/5 border-4 border-border rounded-[2rem] p-6 space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                                                        <DollarSign size={22} strokeWidth={2.5} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-black text-foreground tracking-tight">Costing Summary</h4>
                                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Recipe cost vs selling price</p>
                                                    </div>
                                                </div>

                                                {recipeIngredients.length > 0 && (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-xs font-bold">
                                                            <thead>
                                                                <tr className="text-muted-foreground uppercase tracking-widest border-b border-border/30">
                                                                    <th className="text-left py-3">Ingredient</th>
                                                                    <th className="text-right py-3">Qty</th>
                                                                    <th className="text-right py-3">Rate</th>
                                                                    <th className="text-right py-3">Line Cost</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {recipeCostBreakdown.items.map((item, idx) => (
                                                                    <tr key={idx} className="border-b border-border/10">
                                                                        <td className="py-3 text-foreground">{item.name}</td>
                                                                        <td className="py-3 text-right">{item.quantity} {item.unit}</td>
                                                                        <td className="py-3 text-right">${item.costPerUnit.toFixed(2)}</td>
                                                                        <td className="py-3 text-right font-black">${item.lineCost.toFixed(2)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-3 gap-6 pt-4 border-t border-border/30">
                                                    <div className="text-center">
                                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Cost</p>
                                                        <p className="text-2xl font-black text-emerald-500">${recipeCostBreakdown.totalCost.toFixed(2)}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Selling Price</p>
                                                        <p className="text-2xl font-black text-foreground">${(editingItem?.price || 0).toFixed(2)}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Profit Margin</p>
                                                        <p className={`text-2xl font-black ${recipeCostBreakdown.profitMargin >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                                                            {recipeCostBreakdown.profitPercentage.toFixed(1)}%
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Recipe Tab Footer */}
                                    {activeTab === 'recipe' && (
                                        <div className="p-6 bg-card/80 backdrop-blur-2xl border-t border-border/50 flex gap-6">
                                            <button
                                                onClick={() => setActiveTab('details')}
                                                className="flex-1 py-5 bg-muted/50 text-foreground font-black uppercase tracking-widest rounded-[2rem] border-4 border-border/50 hover:bg-muted transition-all active:scale-95 text-xs"
                                            >
                                                Back to Details
                                            </button>
                                            <button
                                                onClick={handleSaveRecipe}
                                                disabled={saveRecipeMutation.isPending}
                                                className="flex-[2] py-5 bg-emerald-500 text-white font-black uppercase tracking-widest rounded-[2rem] shadow-2xl shadow-emerald-500/30 hover:brightness-110 transition-all active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {saveRecipeMutation.isPending ? 'Saving Recipe...' : recipeIngredients.length > 0 ? `Save Recipe (${recipeIngredients.length} ingredients)` : 'Save Recipe'}
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

export default MenuManagement;
