import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Users, Plus, Trash2, Star, MessageSquare,
    Calendar, Mail, User as UserIcon, Shield,
    TrendingUp, Award, Clock, Upload, Camera, KeyRound,
    Store, Table, LayoutDashboard, Settings, ShoppingCart,
    Menu as MenuIcon, BarChart3, Sparkles, Pencil
} from 'lucide-react';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';

const StaffManagement = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newStaff, setNewStaff] = useState({
        name: '',
        email: '',
        password: '',
        pin: '',
        role: 'WAITER',
        profileImage: '',
        permissions: []
    });

    const isPinRole = ['WAITER', 'CASHIER', 'CHEF'].includes(newStaff.role);
    const [uploading, setUploading] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);

    const restaurantId = user?.restaurant?._id || user?.restaurant;

    const availableFeatures = [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'orders', label: 'Live Orders', icon: ShoppingCart },
        { id: 'menu', label: 'Menu Mgmt', icon: MenuIcon },
        { id: 'tables', label: 'Tables', icon: Table },
        { id: 'inventory', label: 'Inventory', icon: Store },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'staff', label: 'Team', icon: Users },
        { id: 'reviews', label: 'Reviews', icon: Star },
        { id: 'complaints', label: 'Complaints', icon: Shield },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    const togglePermission = (permId) => {
        setNewStaff(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permId)
                ? prev.permissions.filter(p => p !== permId)
                : [...prev.permissions, permId]
        }));
    };

    // Fetch Staff Members
    const { data: staffData, isLoading } = useQuery({
        queryKey: ['staff', restaurantId],
        queryFn: async () => {
            const res = await api.get(`/staff?restaurantId=${restaurantId}`);
            return res.data.data;
        },
        enabled: !!restaurantId
    });

    // Fetch Restaurant Staff Stats
    const { data: statsSummary } = useQuery({
        queryKey: ['staff-stats-summary', restaurantId],
        queryFn: async () => {
            const res = await api.get('/staff/stats/summary');
            return res.data.data;
        },
        enabled: !!restaurantId
    });

    // Add Staff Mutation
    const addStaffMutation = useMutation({
        mutationFn: (data) => api.post('/staff', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['staff', restaurantId]);
            toast.success('Staff member authorized successfully');
            setIsAddModalOpen(false);
            setNewStaff({
                name: '', email: '', password: '', pin: '', role: 'WAITER', profileImage: '', permissions: []
            });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to authorize staff');
        }
    });

    // Update Staff Mutation
    const updateStaffMutation = useMutation({
        mutationFn: ({ id, data }) => api.patch(`/staff/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['staff', restaurantId]);
            toast.success('Staff member updated');
            setIsAddModalOpen(false);
            setEditingStaff(null);
            setNewStaff({
                name: '', email: '', password: '', pin: '', role: 'WAITER', profileImage: '', permissions: []
            });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to update staff');
        }
    });

    // Remove Staff Mutation
    const removeStaffMutation = useMutation({
        mutationFn: (id) => api.delete(`/staff/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['staff', restaurantId]);
            toast.success('Staff member removed');
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to remove staff');
        }
    });

    const handleAddStaff = (e) => {
        e.preventDefault();
        const payload = { ...newStaff };
        if (isPinRole) {
            delete payload.email;
            delete payload.password;
        } else {
            delete payload.pin;
        }
        if (editingStaff) {
            delete payload.password;
            updateStaffMutation.mutate({ id: editingStaff._id, data: payload });
        } else {
            addStaffMutation.mutate(payload);
        }
    };

    const handleEditStaff = (member) => {
        setEditingStaff(member);
        setNewStaff({
            name: member.name,
            email: member.email || '',
            password: '',
            pin: '',
            role: member.role,
            profileImage: member.profileImage,
            permissions: member.permissions || [],
            phone: member.phone || ''
        });
        setIsAddModalOpen(true);
    };

    const handleOpenAddModal = () => {
        setEditingStaff(null);
        setNewStaff({
            name: '', email: '', password: '', pin: '', role: 'WAITER', profileImage: '', permissions: [], phone: ''
        });
        setIsAddModalOpen(true);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await api.post('/upload/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setNewStaff({ ...newStaff, profileImage: res.data.data.url });
            toast.success('Image uploaded successfully');
        } catch (error) {
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex bg-background min-h-screen text-foreground font-sans selection:bg-primary/30">
            <Sidebar open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header onMobileMenuClick={() => setMobileMenuOpen(true)} />

                <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                            <h1 className="text-4xl font-black text-foreground mb-1 tracking-tight italic uppercase">
                                Team Management
                            </h1>
                            <p className="text-muted-foreground font-medium text-sm">
                                Track performance and manage your service excellence team
                            </p>
                        </motion.div>

                        <button
                            onClick={handleOpenAddModal}
                            className="w-full md:w-auto px-8 py-4 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <Plus size={18} strokeWidth={3} />
                            Recruit New Staff
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        {[
                            { label: 'Active Team', value: statsSummary?.teamSize || 0, icon: Users, color: 'blue' },
                            { label: 'Top Performer', value: statsSummary?.topPerformer || 'N/A', icon: Award, color: 'amber' },
                            { label: 'Avg Rating', value: statsSummary?.avgRating || '0.0', icon: Star, color: 'emerald' },
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-card border-4 border-border p-6 rounded-[2rem] shadow-xl relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                                <div className="flex items-center gap-4">
                                    <div className={`p-4 bg-${stat.color}-500/10 rounded-2xl text-${stat.color}-500`}>
                                        <stat.icon size={28} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                                        <h4 className="text-2xl font-black italic">{stat.value}</h4>
                                        {stat.label === 'Avg Rating' && statsSummary?.excellenceTrend && (
                                            <span className="text-[10px] font-bold text-emerald-500">{statsSummary.excellenceTrend} vs last month</span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Staff List */}
                    <div className="space-y-6">
                        {isLoading ? (
                            <div className="flex justify-center py-20">
                                <Clock className="animate-spin text-primary" size={40} />
                            </div>
                        ) : staffData?.length > 0 ? (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {staffData.map((member, i) => (
                                    <StaffCard
                                        key={member._id}
                                        member={member}
                                        onRemove={() => removeStaffMutation.mutate(member._id)}
                                        onEdit={() => handleEditStaff(member)}
                                        index={i}
                                        availableFeatures={availableFeatures}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-card border-4 border-dashed border-border rounded-[3rem]">
                                <Users size={60} className="mx-auto text-muted-foreground/20 mb-6" />
                                <h3 className="text-xl font-bold mb-2">Build Your Team</h3>
                                <p className="text-muted-foreground mb-8">No staff members assigned to this restaurant yet.</p>
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="px-8 py-3 bg-muted hover:bg-border transition-colors rounded-xl font-bold uppercase text-[10px] tracking-widest"
                                >
                                    Add Your First Member
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Add Staff Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setIsAddModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-card border-4 border-border rounded-[3rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                                <h3 className="text-2xl font-black italic uppercase mb-8">
                                    {editingStaff ? 'Update Staff Member' : 'Recruit Staff Member'}
                                </h3>
                                <form onSubmit={handleAddStaff} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Full Name</label>
                                            <input
                                                required
                                                type="text"
                                                value={newStaff.name}
                                                onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                                                className="w-full bg-muted/20 border-2 border-transparent focus:border-primary/50 rounded-2xl py-4 px-6 outline-none transition-all"
                                                placeholder="Sarah Jenkins"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Designated Role</label>
                                            <select
                                                required
                                                value={newStaff.role}
                                                onChange={e => {
                                                    const role = e.target.value;
                                                    setNewStaff({
                                                        ...newStaff,
                                                        role,
                                                        email: ['WAITER', 'CASHIER', 'CHEF'].includes(role) ? '' : newStaff.email,
                                                        password: ['WAITER', 'CASHIER', 'CHEF'].includes(role) ? '' : newStaff.password,
                                                        pin: ['WAITER', 'CASHIER', 'CHEF'].includes(role) ? newStaff.pin : ''
                                                    });
                                                }}
                                                className="w-full bg-muted/20 border-2 border-transparent focus:border-primary/50 rounded-2xl py-4 px-6 outline-none transition-all appearance-none cursor-pointer font-bold"
                                            >
                                                <option value="WAITER">WAITER / SERVER</option>
                                                <option value="CASHIER">CASHIER / POS</option>
                                                <option value="CHEF">CHEF / KITCHEN</option>
                                                <option value="ADMIN">ADMINISTRATOR</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">WhatsApp Number</label>
                                        <input
                                            type="tel"
                                            value={newStaff.phone || ''}
                                            onChange={e => setNewStaff({ ...newStaff, phone: e.target.value.replace(/[^0-9+]/g, '') })}
                                            className="w-full bg-muted/20 border-2 border-transparent focus:border-primary/50 rounded-2xl py-4 px-6 outline-none transition-all"
                                            placeholder="919876543210"
                                        />
                                        <p className="text-[9px] text-muted-foreground px-1">Country code + number (e.g. <b>919876543210</b>). 10-digit numbers auto-get <b>91</b> prefix.</p>
                                    </div>

                                    {isPinRole ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Staff PIN</label>
                                                <input
                                                    required
                                                    type="password"
                                                    inputMode="numeric"
                                                    maxLength={6}
                                                    value={newStaff.pin}
                                                    onChange={e => setNewStaff({ ...newStaff, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                                    className="w-full bg-muted/20 border-2 border-transparent focus:border-primary/50 rounded-2xl py-4 px-6 outline-none transition-all tracking-[0.3em] text-center font-bold"
                                                    placeholder="••••••"
                                                />
                                                <p className="text-[9px] text-muted-foreground px-1">4-6 digit PIN for staff login</p>
                                            </div>
                                            <div />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Email Address</label>
                                                <input
                                                    required
                                                    type="email"
                                                    value={newStaff.email}
                                                    onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                                                    className="w-full bg-muted/20 border-2 border-transparent focus:border-primary/50 rounded-2xl py-4 px-6 outline-none transition-all"
                                                    placeholder="admin@restaurant.com"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
                                                    {editingStaff ? 'Change Password (Optional)' : 'Login Password'}
                                                </label>
                                                <input
                                                    required={!editingStaff}
                                                    type="password"
                                                    value={newStaff.password}
                                                    onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                                                    className="w-full bg-muted/20 border-2 border-transparent focus:border-primary/50 rounded-2xl py-4 px-6 outline-none transition-all"
                                                    placeholder={editingStaff ? "Leave blank to keep" : "Min 6 characters"}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Profile Photo</label>
                                        <div className="flex gap-6 items-center">
                                            <div className="w-24 h-24 rounded-[2rem] bg-muted/20 border-4 border-dashed border-border flex items-center justify-center overflow-hidden relative group">
                                                {newStaff.profileImage ? (
                                                    <img src={newStaff.profileImage} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <UserIcon size={32} className="text-muted-foreground/30" />
                                                )}
                                                {uploading && (
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                        <Clock className="animate-spin text-white" size={24} />
                                                    </div>
                                                )}
                                            </div>
                                            <label className="cursor-pointer px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
                                                <Camera size={14} />
                                                {newStaff.profileImage ? 'Change Photo' : 'Upload Photo'}
                                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Grant Feature Access</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {availableFeatures.map((f) => {
                                                const isActive = newStaff.permissions.includes(f.id);
                                                return (
                                                    <button
                                                        key={f.id}
                                                        type="button"
                                                        onClick={() => togglePermission(f.id)}
                                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group ${isActive
                                                            ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/5'
                                                            : 'bg-muted/10 border-transparent hover:border-border'}`}
                                                    >
                                                        <f.icon size={20} className={isActive ? 'scale-110' : 'opacity-40 group-hover:opacity-100'} />
                                                        <span className="text-[10px] font-black uppercase tracking-tight">{f.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="pt-4 flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsAddModalOpen(false)}
                                            className="flex-1 py-4 font-black uppercase tracking-widest text-[10px] bg-muted hover:bg-border rounded-2xl transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={addStaffMutation.isPending || updateStaffMutation.isPending}
                                            className="flex-1 py-4 font-black uppercase tracking-widest text-[10px] bg-primary text-primary-foreground rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {addStaffMutation.isPending || updateStaffMutation.isPending
                                                ? 'Processing...'
                                                : editingStaff ? 'Update Member' : 'Authorize Member'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const StaffCard = ({ member, onRemove, onEdit, index, availableFeatures }) => {

    // Map member permissions to labels
    const activePermissions = availableFeatures?.filter(f =>
        member.permissions?.includes(f.id)
    ) || [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card border-4 border-border p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden group hover:border-primary/20 transition-all font-sans"
        >
            <div className="flex items-start justify-between">
                <div className="flex gap-6">
                    <div
                        className="w-20 h-20 rounded-[2rem] flex items-center justify-center font-black text-2xl text-white shadow-xl overflow-hidden bg-primary/20"
                    >
                        {member.profileImage ? (
                            <img src={member.profileImage} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                            member.name.charAt(0)
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                            <h3 className="text-xl font-black italic uppercase tracking-tight truncate">{member.name}</h3>
                            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg uppercase tracking-widest">
                                {member.role}
                            </span>
                        </div>
                        <div className="space-y-1">
                            {['WAITER', 'CASHIER', 'CHEF'].includes(member.role) ? (
                                <p className="flex items-center gap-2 text-xs text-muted-foreground font-medium truncate">
                                    <KeyRound size={14} className="text-primary" /> PIN-based login
                                </p>
                            ) : (
                                <p className="flex items-center gap-2 text-xs text-muted-foreground font-medium truncate">
                                    <Mail size={14} className="text-primary" /> {member.email}
                                </p>
                            )}
                            {member.phone && (
                                <p className="flex items-center gap-2 text-xs text-muted-foreground font-medium truncate">
                                    <span className="text-green-500 font-bold">WhatsApp</span> {member.phone}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 items-start shrink-0">
                    <button
                        onClick={onEdit}
                        className="p-4 rounded-2xl bg-muted hover:bg-primary/10 hover:text-primary transition-all"
                    >
                        <Pencil size={20} />
                    </button>
                    <button
                        onClick={() => {
                            if (window.confirm(`Are you sure you want to remove ${member.name}?`)) {
                                onRemove();
                            }
                        }}
                        className="p-4 rounded-2xl bg-muted hover:bg-red-500/10 hover:text-red-500 transition-all"
                        title="Remove Staff Member"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            {/* Permissions Tags */}
            <div className="mt-6 flex flex-wrap gap-2">
                {activePermissions.length > 0 ? (
                    activePermissions.map(p => (
                        <span key={p.id} className="flex items-center gap-1 px-3 py-1.5 bg-muted/30 text-[9px] font-black uppercase tracking-tight rounded-xl border border-border/50">
                            <p.icon size={10} className="text-primary" />
                            {p.label}
                        </span>
                    ))
                ) : (
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-2 italic">No special access granted</span>
                )}
            </div>

            {/* Metrics Section */}
            <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                <div className="flex gap-8">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Service Rating</p>
                        <div className="flex items-center gap-2">
                            <div className="flex text-amber-500">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <Star
                                        key={i}
                                        size={14}
                                        fill={i <= Math.round(member.avgRating || 0) ? "currentColor" : "none"}
                                        strokeWidth={i <= Math.round(member.avgRating || 0) ? 0 : 2}
                                    />
                                ))}
                            </div>
                            <span className="text-sm font-black italic">{member.avgRating || '0.0'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default StaffManagement;
