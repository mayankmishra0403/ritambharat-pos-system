import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import {
    Save, Loader, Store, Clock, Settings, Image as ImageIcon,
    Upload, MapPin, Phone, Globe, Shield, Bell, CheckCircle, Smartphone,
    ShieldAlert, Share2, Star, Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';

const RestaurantSettings = () => {
    const { user } = useAuth();
    const [restaurant, setRestaurant] = useState(null);
    const [activeTab, setActiveTab] = useState('general');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const restaurantId = user?.restaurant?._id || user?.restaurant;

    // Fetch Restaurant Data
    const { data: restaurantData, isLoading } = useQuery({
        queryKey: ['restaurant', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return null;
            const res = await api.get(`/restaurant/${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId
    });

    useEffect(() => {
        if (restaurantData) {
            setRestaurant(restaurantData);
        }
    }, [restaurantData]);

    const updateMutation = useMutation({
        mutationFn: (data) => api.patch(`/restaurant/${restaurantId}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['restaurant', restaurantId]);
            toast.success('Settings updated successfully');
        },
        onError: () => {
            toast.error('Failed to update settings');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: () => api.delete(`/restaurant/${restaurantId}`),
        onSuccess: () => {
            toast.success('Restaurant deleted successfully');
            navigate('/onboarding'); // Redirect to onboarding or dashboard
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to delete restaurant');
        }
    });

    const handleSave = () => {
        updateMutation.mutate(restaurant);
    };

    const handleChange = (e, section = null) => {
        const { name, value, type, checked } = e.target;
        const finalValue = type === 'checkbox' ? checked : value;

        setRestaurant(prev => {
            if (section) {
                return {
                    ...prev,
                    [section]: {
                        ...prev[section],
                        [name]: finalValue
                    }
                };
            }
            return {
                ...prev,
                [name]: finalValue
            };
        });
    };

    const handleFeatureChange = (feature) => {
        setRestaurant(prev => ({
            ...prev,
            features: {
                ...prev.features,
                [feature]: !prev.features[feature]
            }
        }));
    };

    const handleFileUpload = async (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        const formDataUpload = new FormData();
        formDataUpload.append('image', file);

        const toastId = toast.loading('Uploading...');
        try {
            const res = await api.post('/upload/image', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                setRestaurant(prev => ({ ...prev, [field]: res.data.data.url }));
                toast.success('Upload complete', { id: toastId });
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Upload failed', { id: toastId });
        }
    };

    const tabs = [
        { id: 'general', label: 'General', icon: Store },
        { id: 'location', label: 'Location & Contact', icon: MapPin },
        { id: 'operations', label: 'Operations', icon: Clock },
        { id: 'security', label: 'Security & Features', icon: Shield },
    ];

    if (isLoading || !restaurant) {
        return (
            <div className="flex bg-background min-h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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

                <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h1 className="text-4xl font-black text-foreground mb-1 tracking-tight italic uppercase">
                                Restaurant Settings
                            </h1>
                            <p className="text-muted-foreground font-medium text-sm">
                                Configure your restaurant profile and security preferences
                            </p>
                        </motion.div>

                        <button
                            onClick={handleSave}
                            disabled={updateMutation.isPending}
                            className="w-full md:w-auto px-10 py-4 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            {updateMutation.isPending ? <Loader className="animate-spin" size={18} /> : <Save size={18} strokeWidth={3} />}
                            Save All Changes
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-card border-4 border-border p-1.5 rounded-[2rem] shadow-xl mb-12 overflow-x-auto custom-scrollbar no-scrollbar">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative rounded-2xl whitespace-nowrap ${activeTab === tab.id
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                        }`}
                                >
                                    <Icon size={16} strokeWidth={3} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content */}
                    <div className="max-w-4xl">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {activeTab === 'general' && (
                                    <GeneralSettings
                                        restaurant={restaurant}
                                        handleChange={handleChange}
                                        handleFileUpload={handleFileUpload}
                                    />
                                )}
                                {activeTab === 'location' && (
                                    <LocationSettings
                                        restaurant={restaurant}
                                        handleChange={handleChange}
                                    />
                                )}
                                {activeTab === 'operations' && (
                                    <OperationsSettings
                                        restaurant={restaurant}
                                        setRestaurant={setRestaurant}
                                    />
                                )}
                                {activeTab === 'security' && (
                                    <SecuritySettings
                                        restaurant={restaurant}
                                        handleFeatureChange={handleFeatureChange}
                                        handleChange={handleChange}
                                        onDeleteRestart={() => deleteMutation.mutate()}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </div>
    );
};

// --- Sub-Components ---

const GeneralSettings = ({ restaurant, handleChange, handleFileUpload }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
        <div className="space-y-8">
            <div className="bg-card border-4 border-border p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-foreground tracking-tight uppercase">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                        <Store size={24} strokeWidth={3} />
                    </div>
                    Core Profile
                </h3>
                <div className="space-y-6 relative z-10">
                    <div className="group/field relative">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 block px-1">Restaurant Name</label>
                        <div className="relative">
                            <input
                                type="text"
                                name="name"
                                value={restaurant.name || ''}
                                onChange={handleChange}
                                className="w-full bg-muted/20 border-2 border-transparent focus:border-primary/50 rounded-2xl py-4 px-6 text-sm font-medium transition-all outline-none"
                                placeholder="e.g. The Gourmet Kitchen"
                            />
                            <Settings size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground/30 opacity-0 group-hover/field:opacity-100 transition-opacity" />
                        </div>
                    </div>
                    <div className="group/field relative">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 block px-1">Description</label>
                        <div className="relative">
                            <textarea
                                name="description"
                                value={restaurant.description || ''}
                                onChange={handleChange}
                                className="w-full bg-muted/20 border-2 border-transparent focus:border-primary/50 rounded-2xl py-4 px-6 text-sm font-medium transition-all outline-none min-h-[140px] resize-none"
                                placeholder="Tell your story..."
                            />
                            <Settings size={16} className="absolute right-6 top-6 text-muted-foreground/30 opacity-0 group-hover/field:opacity-100 transition-opacity" />
                        </div>
                    </div>
                    <div className="group/field relative">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 block px-1">Cuisine Specialty</label>
                        <div className="relative">
                            <input
                                type="text"
                                name="cuisine"
                                value={restaurant.cuisine || ''}
                                onChange={handleChange}
                                className="w-full bg-muted/20 border-2 border-transparent focus:border-primary/50 rounded-2xl py-4 px-6 text-sm font-medium transition-all outline-none"
                                placeholder="e.g. Italian, Mexican, Fusion"
                            />
                            <Settings size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground/30 opacity-0 group-hover/field:opacity-100 transition-opacity" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="group/field relative">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 block px-1">Currency</label>
                            <select
                                name="currency"
                                value={restaurant.currency || 'USD'}
                                onChange={handleChange}
                                className="w-full bg-muted/20 border-2 border-transparent focus:border-primary/50 rounded-2xl py-4 px-6 text-sm font-medium transition-all outline-none appearance-none"
                            >
                                <option value="USD">USD ($)</option>
                                <option value="PKR">PKR (Rs.)</option>
                            </select>
                        </div>
                        <div className="group/field relative">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 block px-1">Base Gateway</label>
                            <select
                                name="paymentGateway"
                                value={restaurant.paymentGateway || 'SAFEPAY'}
                                onChange={handleChange}
                                className="w-full bg-muted/20 border-2 border-transparent focus:border-primary/50 rounded-2xl py-4 px-6 text-sm font-medium transition-all outline-none appearance-none"
                            >
                                <option value="SAFEPAY">Safepay</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="space-y-8">
            <div className="bg-card border-4 border-border p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-foreground tracking-tight uppercase">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                        <ImageIcon size={24} strokeWidth={3} />
                    </div>
                    Visual Branding
                </h3>
                <div className="space-y-8 relative z-10">
                    {/* Logo Upload */}
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 block px-1">Brand Logo</label>
                        <div className="flex items-center gap-6">
                            <div className="h-28 w-28 bg-muted/30 rounded-3xl flex items-center justify-center border-4 border-dashed border-border overflow-hidden relative group/upload shadow-inner transition-all hover:border-primary/50">
                                {restaurant.logo ? (
                                    <img src={restaurant.logo} alt="Logo" className="h-full w-full object-contain p-3" />
                                ) : (
                                    <ImageIcon className="text-muted-foreground/30" size={32} />
                                )}
                                <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center">
                                    <Upload className="text-white" size={24} strokeWidth={3} />
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => handleFileUpload(e, 'logo')}
                                />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-muted-foreground mb-3 leading-relaxed">Square PNG/JPG.<br />Min: 512x512px.</p>
                                <label className="inline-flex px-6 py-2 bg-muted/50 hover:bg-muted text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer border-2 border-transparent active:scale-95">
                                    Change Logo
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleFileUpload(e, 'logo')}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Cover Upload */}
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 block px-1">Header Cover</label>
                        <div className="h-44 w-full bg-muted/30 rounded-[2rem] flex items-center justify-center border-4 border-dashed border-border overflow-hidden relative group/cover shadow-inner transition-all hover:border-primary/50">
                            {restaurant.coverImage ? (
                                <img src={restaurant.coverImage} alt="Cover" className="h-full w-full object-cover" />
                            ) : (
                                <div className="text-center">
                                    <ImageIcon className="mx-auto text-muted-foreground/30 mb-2" size={40} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Add Hero Background</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                <div className="bg-white/20 p-4 rounded-3xl">
                                    <Upload className="text-white" size={32} strokeWidth={3} />
                                </div>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => handleFileUpload(e, 'coverImage')}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const LocationSettings = ({ restaurant, handleChange }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
        <div className="bg-card border-4 border-border p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden h-fit group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-foreground tracking-tight uppercase">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                    <MapPin size={24} strokeWidth={3} />
                </div>
                Business Address
            </h3>
            <div className="space-y-6 relative z-10">
                <div className="group/field relative">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 block px-1">Street Location</label>
                    <input
                        type="text"
                        name="street"
                        value={restaurant.address?.street || ''}
                        onChange={(e) => handleChange(e, 'address')}
                        className="w-full bg-muted/20 border-2 border-transparent focus:border-primary/50 rounded-2xl py-4 px-6 text-sm font-medium transition-all outline-none"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="group/field relative">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 block px-1">City</label>
                        <input
                            type="text"
                            name="city"
                            value={restaurant.address?.city || ''}
                            onChange={(e) => handleChange(e, 'address')}
                            className="w-full bg-muted/20 border-2 border-transparent focus:border-primary/50 rounded-2xl py-4 px-6 text-sm font-medium transition-all outline-none"
                        />
                    </div>
                    <div className="group/field relative">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 block px-1">State / Zip</label>
                        <input
                            type="text"
                            name="state"
                            value={restaurant.address?.state || ''}
                            onChange={(e) => handleChange(e, 'address')}
                            className="w-full bg-muted/20 border-2 border-transparent focus:border-primary/50 rounded-2xl py-4 px-6 text-sm font-medium transition-all outline-none"
                        />
                    </div>
                </div>
                <div className="group/field relative">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 block px-1">Google Maps Link</label>
                    <div className="relative">
                        <input
                            type="text"
                            name="mapLink"
                            value={restaurant.address?.mapLink || ''}
                            onChange={(e) => handleChange(e, 'address')}
                            className="w-full bg-muted/20 border-2 border-transparent focus:border-primary/50 rounded-2xl py-4 px-6 text-sm font-medium transition-all outline-none pl-12"
                            placeholder="https://maps.google.com/..."
                        />
                        <Globe size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-card border-4 border-border p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden h-fit group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-foreground tracking-tight uppercase">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                    <Phone size={24} strokeWidth={3} />
                </div>
                Contact Terminal
            </h3>
            <div className="space-y-6 relative z-10">
                <div className="group/field relative">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 block px-1">Primary Phone</label>
                    <input
                        type="text"
                        name="phone"
                        value={restaurant.contact?.phone || ''}
                        onChange={(e) => handleChange(e, 'contact')}
                        className="w-full bg-muted/20 border-2 border-transparent focus:border-primary/50 rounded-2xl py-4 px-6 text-sm font-medium transition-all outline-none"
                    />
                </div>
                <div className="group/field relative">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 block px-1">Official Email</label>
                    <input
                        type="email"
                        name="email"
                        value={restaurant.contact?.email || ''}
                        onChange={(e) => handleChange(e, 'contact')}
                        className="w-full bg-muted/20 border-2 border-transparent focus:border-primary/50 rounded-2xl py-4 px-6 text-sm font-medium transition-all outline-none"
                    />
                </div>
                <div className="group/field relative">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 block px-1">Public Website</label>
                    <input
                        type="text"
                        name="website"
                        value={restaurant.contact?.website || ''}
                        onChange={(e) => handleChange(e, 'contact')}
                        className="w-full bg-muted/20 border-2 border-transparent focus:border-primary/50 rounded-2xl py-4 px-6 text-sm font-medium transition-all outline-none"
                        placeholder="www.yourrestaurant.com"
                    />
                </div>
            </div>
        </div>
    </div>
);

const OperationsSettings = ({ restaurant, setRestaurant }) => {
    const handleDayChange = (day, field, value) => {
        setRestaurant(prev => {
            const hours = prev.businessHours || [];
            const dayExists = hours.some(h => h.day === day);

            let newHours;
            if (dayExists) {
                newHours = hours.map(h => h.day === day ? { ...h, [field]: value } : h);
            } else {
                newHours = [...hours, {
                    day,
                    openTime: '09:00',
                    closeTime: '22:00',
                    isClosed: false,
                    [field]: value
                }];
            }

            return { ...prev, businessHours: newHours };
        });
    };

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
        <div className="grid grid-cols-1 gap-8 mb-20">
            <div className="bg-card border-4 border-border p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-foreground tracking-tight uppercase">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                        <Clock size={24} strokeWidth={3} />
                    </div>
                    Operational Hours
                </h3>
                <div className="space-y-4 relative z-10">
                    {days.map(day => {
                        const hours = restaurant.businessHours?.find(h => h.day === day) || { openTime: '09:00', closeTime: '22:00', isClosed: false };
                        return (
                            <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 bg-muted/10 rounded-3xl border border-transparent hover:border-border transition-all group/day">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground w-32">{day}</span>

                                <div className="flex items-center gap-6 flex-1">
                                    {!hours.isClosed ? (
                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="flex items-center gap-3 bg-background/50 p-2 rounded-xl border border-border/50">
                                                <span className="text-[10px] font-black uppercase text-muted-foreground">OPEN</span>
                                                <input
                                                    type="time"
                                                    value={hours.openTime || '09:00'}
                                                    onChange={(e) => handleDayChange(day, 'openTime', e.target.value)}
                                                    className="bg-transparent text-sm font-black outline-none focus:text-primary transition-colors"
                                                />
                                            </div>
                                            <div className="h-0.5 w-4 bg-border hidden sm:block" />
                                            <div className="flex items-center gap-3 bg-background/50 p-2 rounded-xl border border-border/50">
                                                <span className="text-[10px] font-black uppercase text-muted-foreground">CLOSE</span>
                                                <input
                                                    type="time"
                                                    value={hours.closeTime || '22:00'}
                                                    onChange={(e) => handleDayChange(day, 'closeTime', e.target.value)}
                                                    className="bg-transparent text-sm font-black outline-none focus:text-primary transition-colors"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 px-4 py-2 rounded-xl">Closed for business</span>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleDayChange(day, 'isClosed', !hours.isClosed)}
                                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${hours.isClosed
                                        ? 'bg-red-500/10 border-red-500/20 text-red-500 shadow-lg shadow-red-500/10'
                                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-lg shadow-emerald-500/10'}`}
                                >
                                    {hours.isClosed ? 'OFF' : 'ON'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const SecuritySettings = ({ restaurant, handleFeatureChange, handleChange, onDeleteRestart }) => {
    const [confirmDelete, setConfirmDelete] = useState(false);

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Terminal Reset */}
                <div className="bg-card border-4 border-red-500/20 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group h-full">
                    <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />
                    <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-red-500 tracking-tight uppercase">
                        <div className="p-3 bg-red-500/10 rounded-2xl">
                            <ShieldAlert size={24} strokeWidth={3} />
                        </div>
                        TERMINAL RESET
                    </h3>
                    <div className="p-6 bg-red-500/5 border-2 border-red-500/20 rounded-3xl relative z-10">
                        <h4 className="text-[10px] font-black text-red-500 mb-2 uppercase tracking-widest">Danger Zone</h4>
                        <p className="text-sm font-medium text-muted-foreground/80 mb-6 leading-relaxed">
                            Permanently erase this restaurant and all its telemetry, menu data, and order history. This is IRREVERSIBLE.
                        </p>

                        {!confirmDelete ? (
                            <button
                                onClick={() => setConfirmDelete(true)}
                                className="w-full py-4 px-6 bg-red-500/10 border-4 border-red-500/20 text-red-500 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-xl shadow-red-500/10"
                            >
                                DELETE ENTIRE TERMINAL
                            </button>
                        ) : (
                            <div className="space-y-3 animate-in fade-in zoom-in-95">
                                <button
                                    onClick={onDeleteRestart}
                                    className="w-full py-4 px-6 bg-red-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:brightness-110 shadow-2xl shadow-red-600/40"
                                >
                                    CONFIRM PERMANENT WIPE
                                </button>
                                <button
                                    onClick={() => setConfirmDelete(false)}
                                    className="w-full py-4 px-6 bg-transparent text-muted-foreground rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-muted/50"
                                >
                                    CANCEL RESET
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Feature Management */}
                <div className="bg-card border-4 border-border p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group h-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                    <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-foreground tracking-tight uppercase">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                            <Settings size={24} strokeWidth={3} />
                        </div>
                        Feature Management
                    </h3>

                    <div className="space-y-4 relative z-10">
                        <div className="flex items-center justify-between p-6 bg-muted/20 rounded-3xl border border-border/50 group/item hover:border-primary/30 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover/item:scale-110 transition-transform">
                                    <Star size={24} strokeWidth={2.5} />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-black uppercase tracking-widest text-foreground truncate">Public Reviews</h4>
                                    <p className="text-[10px] text-muted-foreground font-medium">Customer feedback visibility</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleFeatureChange('reviewsEnabled')}
                                className={`w-14 h-7 shrink-0 rounded-full relative transition-all duration-300 shadow-inner ${restaurant.features.reviewsEnabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                            >
                                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 ${restaurant.features.reviewsEnabled ? 'left-7.5' : 'left-0.5'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-6 bg-muted/20 rounded-3xl border border-border/50 group/item hover:border-primary/30 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover/item:scale-110 transition-transform">
                                    <Users size={24} strokeWidth={2.5} />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-black uppercase tracking-widest text-foreground truncate">Staff Reviews</h4>
                                    <p className="text-[10px] text-muted-foreground font-medium">Rate staff excellence</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleFeatureChange('allowStaffReviews')}
                                className={`w-14 h-7 shrink-0 rounded-full relative transition-all duration-300 shadow-inner ${restaurant.features.allowStaffReviews ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                            >
                                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 ${restaurant.features.allowStaffReviews ? 'left-7.5' : 'left-0.5'}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RestaurantSettings;
