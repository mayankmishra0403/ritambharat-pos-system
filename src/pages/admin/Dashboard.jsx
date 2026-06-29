import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Store, Users, ShoppingCart, Activity, Shield,
    CheckCircle, XCircle, Search, RefreshCw,
    Building2, Mail, Phone, Calendar, Clock,
    AlertTriangle, Hash, ChevronDown, ChevronUp, Plus,
    X, Globe, MapPin, Trash2, History, UserCheck, UserX,
    Undo2, Timer, Link, Key, Copy, BarChart3, CheckSquare,
    Wallet, Banknote
} from 'lucide-react';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [expandedRestaurant, setExpandedRestaurant] = useState(null);
    const [restaurantSubTab, setRestaurantSubTab] = useState('active');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [passwordResetTarget, setPasswordResetTarget] = useState(null);
    const [resetPassword, setResetPassword] = useState('');
    const [selectedRestaurants, setSelectedRestaurants] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [createForm, setCreateForm] = useState({
        name: '', ownerEmail: '', ownerName: '', ownerPassword: '',
        phone: '', cuisine: '', city: '', state: ''
    });

    const { data: dashboard, isLoading: dashLoading } = useQuery({
        queryKey: ['admin-dashboard'],
        queryFn: async () => {
            const res = await api.get('/admin/dashboard');
            return res.data.data;
        },
        refetchInterval: 30000
    });

    const { data: restaurants, isLoading: restLoading } = useQuery({
        queryKey: ['admin-restaurants'],
        queryFn: async () => {
            const res = await api.get('/admin/restaurants');
            return res.data.data;
        },
        refetchInterval: 30000
    });

    const { data: users, isLoading: usersLoading } = useQuery({
        queryKey: ['admin-users'],
        queryFn: async () => {
            const res = await api.get('/admin/users');
            return res.data.data;
        }
    });

    const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
        queryKey: ['admin-activities'],
        queryFn: async () => {
            const res = await api.get('/admin/activities?limit=100');
            return res.data.data;
        },
        refetchInterval: 15000
    });

    const { data: health } = useQuery({
        queryKey: ['admin-health'],
        queryFn: async () => {
            const res = await api.get('/admin/health');
            return res.data.data;
        },
        refetchInterval: 15000
    });

    const { data: credits } = useQuery({
        queryKey: ['admin-credits'],
        queryFn: async () => {
            const res = await api.get('/admin/whatsapp');
            return res.data.data;
        },
        refetchInterval: 30000
    });

    const creditsMap = {};
    if (credits) {
        for (const c of credits) {
            creditsMap[c.restaurant?._id] = c;
        }
    }

    const [creditModalTarget, setCreditModalTarget] = useState(null);
    const [creditAmount, setCreditAmount] = useState('');
    const [creditNote, setCreditNote] = useState('');

    const addCreditsMutation = useMutation({
        mutationFn: ({ restaurantId, amount, description }) => api.post('/admin/whatsapp/add', { restaurantId, amount: parseFloat(amount), description }),
        onSuccess: (res) => {
            queryClient.invalidateQueries(['admin-credits']);
            queryClient.invalidateQueries(['admin-restaurants']);
            toast.success(res.data.message || 'Credits added');
            setCreditModalTarget(null);
            setCreditAmount('');
            setCreditNote('');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to add credits')
    });

    const toggleRestaurantMutation = useMutation({
        mutationFn: (id) => api.patch(`/admin/restaurants/${id}/toggle-status`),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-restaurants']);
            queryClient.invalidateQueries(['admin-dashboard']);
            toast.success('Restaurant status updated');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to toggle status')
    });

    const bulkBlockRestaurantsMutation = useMutation({
        mutationFn: ({ ids, action }) => api.post('/admin/restaurants/bulk/toggle-status', { ids, action }),
        onSuccess: (res) => {
            queryClient.invalidateQueries(['admin-restaurants']);
            queryClient.invalidateQueries(['admin-dashboard']);
            setSelectedRestaurants([]);
            toast.success(res.data.message);
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Bulk action failed')
    });

    const bulkDeleteRestaurantsMutation = useMutation({
        mutationFn: (ids) => api.post('/admin/restaurants/bulk/delete', { ids }),
        onSuccess: (res) => {
            queryClient.invalidateQueries(['admin-restaurants']);
            queryClient.invalidateQueries(['admin-restaurants-deleted']);
            queryClient.invalidateQueries(['admin-dashboard']);
            setSelectedRestaurants([]);
            toast.success(res.data.message);
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Bulk delete failed')
    });

    const bulkToggleUsersMutation = useMutation({
        mutationFn: ({ ids, action }) => api.post('/admin/users/bulk/toggle-status', { ids, action }),
        onSuccess: (res) => {
            queryClient.invalidateQueries(['admin-users']);
            setSelectedUsers([]);
            toast.success(res.data.message);
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Bulk action failed')
    });

    const bulkDeleteUsersMutation = useMutation({
        mutationFn: (ids) => api.post('/admin/users/bulk/delete', { ids }),
        onSuccess: (res) => {
            queryClient.invalidateQueries(['admin-users']);
            setSelectedUsers([]);
            toast.success(res.data.message);
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Bulk delete failed')
    });

    const toggleUserMutation = useMutation({
        mutationFn: (id) => api.patch(`/admin/users/${id}/toggle-status`),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-users']);
            toast.success('User status updated');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to toggle status')
    });

    const deleteUserMutation = useMutation({
        mutationFn: (id) => api.delete(`/admin/users/${id}`),
        onSuccess: (res) => {
            queryClient.invalidateQueries(['admin-users']);
            toast.success(res.data.message || 'User deleted');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete user')
    });

    const { data: deletedRestaurants } = useQuery({
        queryKey: ['admin-restaurants-deleted'],
        queryFn: async () => {
            const res = await api.get('/admin/restaurants/deleted');
            return res.data.data;
        },
        refetchInterval: 30000
    });

    const deleteRestaurantMutation = useMutation({
        mutationFn: (id) => api.delete(`/admin/restaurants/${id}`),
        onSuccess: (res) => {
            queryClient.invalidateQueries(['admin-restaurants']);
            queryClient.invalidateQueries(['admin-restaurants-deleted']);
            queryClient.invalidateQueries(['admin-dashboard']);
            toast.success(res.data.message || 'Restaurant deleted');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete restaurant')
    });

    const restoreRestaurantMutation = useMutation({
        mutationFn: (id) => api.post(`/admin/restaurants/${id}/restore`),
        onSuccess: (res) => {
            queryClient.invalidateQueries(['admin-restaurants']);
            queryClient.invalidateQueries(['admin-restaurants-deleted']);
            queryClient.invalidateQueries(['admin-dashboard']);
            toast.success(res.data.message || 'Restaurant restored');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to restore restaurant')
    });

    const createRestaurantMutation = useMutation({
        mutationFn: (data) => api.post('/admin/restaurants', data),
        onSuccess: (res) => {
            queryClient.invalidateQueries(['admin-restaurants']);
            queryClient.invalidateQueries(['admin-dashboard']);
            queryClient.invalidateQueries(['admin-users']);
            toast.success(res.data.message || 'Restaurant created!');
            setShowCreateModal(false);
            setCreateForm({ name: '', ownerEmail: '', ownerName: '', ownerPassword: '', phone: '', cuisine: '', city: '', state: '' });
            // Store last created restaurant ID for invite link generation
            if (res.data.data?.restaurant?._id) {
                setLastCreatedRestaurant(res.data.data.restaurant._id);
            }
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to create restaurant')
    });

    const [lastCreatedRestaurant, setLastCreatedRestaurant] = useState(null);

    const generateInviteMutation = useMutation({
        mutationFn: (restaurantId) => api.post('/invites', { restaurantId }),
        onSuccess: (res) => {
            const url = res.data.data.inviteUrl;
            navigator.clipboard.writeText(url).then(() => {
                toast.success('Invite link copied to clipboard!');
            }).catch(() => {
                toast.success('Invite link generated!');
                prompt('Copy this invite link:', url);
            });
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to generate invite link')
    });

    const resetPasswordMutation = useMutation({
        mutationFn: ({ id, newPassword }) => api.post(`/admin/users/${id}/reset-password`, { newPassword }),
        onSuccess: (res) => {
            toast.success(res.data.message || 'Password reset successfully');
            setPasswordResetTarget(null);
            setResetPassword('');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to reset password')
    });

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const filteredRestaurants = restaurants?.filter(r =>
        r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredUsers = users?.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            {/* Top Bar */}
            <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Shield size={24} className="text-primary" />
                        <h1 className="text-lg font-black uppercase tracking-widest">Admin Panel</h1>
                        <span className="px-3 py-1 bg-primary/10 text-primary text-[9px] font-black rounded-lg uppercase tracking-widest">
                            SUPER ADMIN
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{user?.email}</span>
                        <button
                            onClick={logout}
                            className="px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Tab Navigation */}
                <div className="flex gap-2 mb-8 border-b border-border/40 pb-4 overflow-x-auto">
                    {[
                        { id: 'overview', label: 'Overview', icon: Activity },
                        { id: 'restaurants', label: 'Restaurants', icon: Building2 },
                        { id: 'users', label: 'Users', icon: Users },
                        { id: 'activity', label: 'Activity', icon: History },
                        { id: 'health', label: 'System Health', icon: Shield },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                : 'text-muted-foreground hover:bg-muted/50'
                            }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                    <div className="flex-1" />
                    <button
                        onClick={() => queryClient.invalidateQueries()}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted/50 transition-all"
                    >
                        <RefreshCw size={16} />
                        Refresh All
                    </button>
                </div>

                {/* Search Bar */}
                {activeTab !== 'overview' && activeTab !== 'health' && (
                    <div className="relative mb-6">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder={`Search ${activeTab}...`}
                            className="w-full bg-card border-2 border-border rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-primary/50 transition-all"
                        />
                    </div>
                )}

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {[
                                {
                                    label: 'Total Restaurants',
                                    value: dashboard?.totalRestaurants || 0,
                                    icon: Building2,
                                    color: 'blue'
                                },
                                {
                                    label: 'Total Users',
                                    value: dashboard?.totalUsers || 0,
                                    icon: Users,
                                    color: 'emerald'
                                },
                                {
                                    label: 'Today Orders',
                                    value: dashboard?.todayOrders || 0,
                                    icon: ShoppingCart,
                                    color: 'amber'
                                },
                                {
                                    label: 'Active Restaurants',
                                    value: restaurants?.filter(r => r.isActive !== false).length || 0,
                                    icon: CheckCircle,
                                    color: 'green'
                                }
                            ].map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="bg-card border-4 border-border p-6 rounded-[2rem] shadow-xl"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-4 bg-${stat.color}-500/10 rounded-2xl text-${stat.color}-500`}>
                                            <stat.icon size={28} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                                            <h4 className="text-3xl font-black italic">{stat.value}</h4>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Recent Restaurants */}
                        <div className="bg-card border-4 border-border rounded-[2rem] p-6 shadow-xl">
                            <h3 className="text-lg font-black italic uppercase mb-6 flex items-center gap-3">
                                <Building2 size={20} className="text-primary" />
                                All Restaurants
                            </h3>
                            {dashLoading ? (
                                <div className="flex justify-center py-12">
                                    <Clock className="animate-spin text-primary" size={32} />
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border">
                                                <th className="text-left py-4 px-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedRestaurants.length === restaurants?.length && restaurants?.length > 0}
                                                        onChange={() => {
                                                            if (selectedRestaurants.length > 0) {
                                                                setSelectedRestaurants([]);
                                                            } else {
                                                                setSelectedRestaurants(restaurants?.map(r => r._id) || []);
                                                            }
                                                        }}
                                                        className="w-5 h-5 rounded-lg border-2 border-border accent-primary cursor-pointer"
                                                    />
                                                </th>
                                                <th className="text-left py-4 px-3">Code</th>
                                                <th className="text-left py-4 px-3">Name</th>
                                                <th className="text-left py-4 px-3">Owner</th>
                                                <th className="text-center py-4 px-3">Staff</th>
                                                <th className="text-right py-4 px-3">Today Revenue</th>
                                                <th className="text-center py-4 px-3">Status</th>
                                                <th className="text-center py-4 px-3">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {restaurants?.slice(0, 10).map((r, i) => (
                                                <tr key={r._id} className="border-b border-border/40 text-sm hover:bg-muted/20 transition-colors">
                                                    <td className="py-4 px-3">
                                                        <span className="font-black text-primary tracking-wider">{r.code || '—'}</span>
                                                    </td>
                                                    <td className="py-4 px-3 font-bold">{r.name}</td>
                                                    <td className="py-4 px-3 text-muted-foreground">
                                                        {r.owner?.name || r.ownerEmail || '—'}
                                                    </td>
                                                    <td className="py-4 px-3 text-center font-bold">{r.staffCount || 0}</td>
                                                    <td className="py-4 px-3 text-right font-bold text-emerald-500">
                                                        ₹{(r.todayRevenue || 0).toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="py-4 px-3 text-center">
                                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${r.isActive === false
                                                            ? 'bg-red-500/10 text-red-500'
                                                            : 'bg-emerald-500/10 text-emerald-500'
                                                        }`}>
                                                            {r.isActive === false ? <XCircle size={12} /> : <CheckCircle size={12} />}
                                                            {r.isActive === false ? 'Blocked' : 'Active'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-3 text-center">
                                                        <button
                                                            onClick={() => toggleRestaurantMutation.mutate(r._id)}
                                                            disabled={toggleRestaurantMutation.isPending}
                                                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${r.isActive === false
                                                                ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                                                                : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                                            }`}
                                                        >
                                                            {r.isActive === false ? 'Unblock' : 'Block'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {restaurants?.length > 10 && (
                                        <p className="text-center text-xs text-muted-foreground mt-4">
                                            Showing 10 of {restaurants.length} restaurants. Switch to "Restaurants" tab for full list.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Restaurants Tab */}
                {activeTab === 'restaurants' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="flex items-center gap-2 mb-6">
                            <button
                                onClick={() => setRestaurantSubTab('active')}
                                className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${restaurantSubTab === 'active'
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                    : 'text-muted-foreground hover:bg-muted/50'
                                }`}
                            >
                                <Building2 size={14} className="inline mr-1.5" />
                                Active ({restaurants?.length || 0})
                            </button>
                            <button
                                onClick={() => setRestaurantSubTab('deleted')}
                                className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${restaurantSubTab === 'deleted'
                                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                                    : 'text-muted-foreground hover:bg-muted/50'
                                }`}
                            >
                                <Trash2 size={14} className="inline mr-1.5" />
                                Recently Deleted ({deletedRestaurants?.length || 0})
                            </button>
                            <div className="flex-1" />
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/20 flex items-center gap-2"
                            >
                                <Plus size={16} strokeWidth={3} />
                                New Restaurant
                            </button>
                        </div>

                        {restaurantSubTab === 'active' && (
                        <div className="bg-card border-4 border-border rounded-[2rem] p-6 shadow-xl">
                            {selectedRestaurants.length > 0 && (
                                <div className="flex items-center gap-3 mb-6 p-4 bg-primary/5 border-2 border-primary/20 rounded-2xl">
                                    <CheckSquare size={18} className="text-primary" />
                                    <span className="text-sm font-bold">{selectedRestaurants.length} selected</span>
                                    <div className="flex-1" />
                                    <button
                                        onClick={() => {
                                            if (window.confirm(`Block ${selectedRestaurants.length} restaurant(s)?`)) {
                                                bulkBlockRestaurantsMutation.mutate({ ids: selectedRestaurants, action: 'block' });
                                            }
                                        }}
                                        className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all"
                                    >
                                        Block All
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm(`Unblock ${selectedRestaurants.length} restaurant(s)?`)) {
                                                bulkBlockRestaurantsMutation.mutate({ ids: selectedRestaurants, action: 'unblock' });
                                            }
                                        }}
                                        className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                                    >
                                        Unblock All
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm(`Delete ${selectedRestaurants.length} restaurant(s)? They can be restored within 24 hours.`)) {
                                                bulkDeleteRestaurantsMutation.mutate(selectedRestaurants);
                                            }
                                        }}
                                        className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all"
                                    >
                                        Delete All
                                    </button>
                                    <button
                                        onClick={() => setSelectedRestaurants([])}
                                        className="px-4 py-2 bg-muted/30 text-muted-foreground rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-muted/50 transition-all"
                                    >
                                        Clear
                                    </button>
                                </div>
                            )}
                            {restLoading ? (
                                <div className="flex justify-center py-12">
                                    <Clock className="animate-spin text-primary" size={32} />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredRestaurants?.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <Building2 size={48} className="mx-auto mb-4 opacity-30" />
                                            <p className="font-bold">No restaurants found</p>
                                        </div>
                                    ) : (
                                        filteredRestaurants?.map((r) => (
                                            <motion.div
                                                key={r._id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-muted/20 rounded-2xl border-2 border-border overflow-hidden"
                                            >
                                                <div
                                                    className="flex items-center justify-between p-5 cursor-pointer hover:bg-muted/30 transition-colors"
                                                    onClick={() => setExpandedRestaurant(expandedRestaurant === r._id ? null : r._id)}
                                                >
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedRestaurants.includes(r._id)}
                                                            onChange={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedRestaurants(prev =>
                                                                    prev.includes(r._id)
                                                                        ? prev.filter(id => id !== r._id)
                                                                        : [...prev, r._id]
                                                                );
                                                            }}
                                                            className="w-5 h-5 rounded-lg border-2 border-border accent-primary cursor-pointer"
                                                        />
                                                        <div className={`p-3 rounded-xl ${r.isActive === false ? 'bg-red-500/10' : 'bg-primary/10'}`}>
                                                            <Store size={20} className={r.isActive === false ? 'text-red-500' : 'text-primary'} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-black text-primary tracking-wider text-sm">#{r.code}</span>
                                                            <h4 className="font-bold text-lg">{r.name}</h4>
                                                                <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${r.isActive === false
                                                                    ? 'bg-red-500/10 text-red-500'
                                                                    : 'bg-emerald-500/10 text-emerald-500'
                                                                }`}>
                                                                    {r.isActive === false ? 'Blocked' : 'Active'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Owner: {r.owner?.name || 'N/A'} | Staff: {r.staffCount || 0} | Revenue: ₹{(r.todayRevenue || 0).toLocaleString('en-IN')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); generateInviteMutation.mutate(r._id); }}
                                                            disabled={generateInviteMutation.isPending}
                                                            className="p-2.5 rounded-xl bg-muted/30 hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground"
                                                            title="Generate invite link"
                                                        >
                                                            <Link size={16} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); toggleRestaurantMutation.mutate(r._id); }}
                                                            disabled={toggleRestaurantMutation.isPending}
                                                            className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${r.isActive === false
                                                                ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                                                                : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                                            }`}
                                                        >
                                                            {r.isActive === false ? 'Unblock' : 'Block'}
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (window.confirm(`Delete "${r.name}"? It will be soft-deleted — you can restore within 24 hours.`)) {
                                                                    deleteRestaurantMutation.mutate(r._id);
                                                                }
                                                            }}
                                                            disabled={deleteRestaurantMutation.isPending}
                                                            className="p-2.5 rounded-xl bg-muted/30 hover:bg-red-500/10 hover:text-red-500 transition-all text-muted-foreground"
                                                            title="Delete restaurant"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                        {expandedRestaurant === r._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                    </div>
                                                </div>
                                                {expandedRestaurant === r._id && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        className="px-5 pb-5 pt-2 border-t border-border"
                                                    >
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                            <div>
                                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Email</p>
                                                                <p className="font-medium">{r.contact?.email || r.email || 'N/A'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Phone</p>
                                                                <p className="font-medium">{r.contact?.phone || r.phone || 'N/A'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Created</p>
                                                                <p className="font-medium">{formatDate(r.createdAt)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Address</p>
                                                                <p className="font-medium text-xs">
                                                                    {r.address
                                                                        ? [r.address.street, r.address.city, r.address.state, r.address.country].filter(Boolean).join(', ') || r.address.toString()
                                                                        : 'N/A'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4 pt-4 border-t border-border">
                                                        <div>
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Orders</p>
                                                            <p className="font-bold text-lg">{r.totalOrders || 0}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Menu Items</p>
                                                            <p className="font-bold text-lg">{r.totalMenuItems || 0}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Active Tables</p>
                                                            <p className="font-bold text-lg">{r.activeTables || 0}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Staff</p>
                                                            <p className="font-bold text-lg">{r.staffCount || 0}</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 pt-4 border-t border-border">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                                <Wallet size={14} />
                                                                WhatsApp Credits
                                                            </p>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setCreditModalTarget(r); setCreditAmount(''); setCreditNote(''); }}
                                                                className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center gap-1.5"
                                                            >
                                                                <Banknote size={14} />
                                                                Add Credits
                                                            </button>
                                                        </div>
                                                        {(() => {
                                                            const cr = creditsMap[r._id];
                                                            if (!cr) return <p className="text-sm text-muted-foreground">No credit record</p>;
                                                            const msgs = Math.floor(cr.balance / 0.50);
                                                            const isLow = cr.balance <= (cr.lowBalanceThreshold || 2);
                                                            const isBlocked = cr.balance < 0.50;
                                                            return (
                                                                <div className="flex items-center gap-4">
                                                                    <span className={`font-bold text-lg ${isBlocked ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                                        ₹{cr.balance.toFixed(2)}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        ≈ {msgs} bill receipts
                                                                    </span>
                                                                    {isBlocked && (
                                                                        <span className="px-2 py-1 bg-red-500/10 text-red-500 rounded-lg text-[9px] font-black uppercase tracking-widest">Blocked</span>
                                                                    )}
                                                                    {!isBlocked && isLow && (
                                                                        <span className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-[9px] font-black uppercase tracking-widest">Low</span>
                                                                    )}
                                                                    <span className="text-xs text-muted-foreground">
                                                                        Used: ₹{cr.totalUsed.toFixed(2)} | Credited: ₹{cr.totalCredited.toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {restaurantSubTab === 'deleted' && (
                        <div className="bg-card border-4 border-border rounded-[2rem] p-6 shadow-xl">
                            <h3 className="text-lg font-black italic uppercase mb-6 flex items-center gap-3">
                                <Trash2 size={20} className="text-red-500" />
                                Recently Deleted ({deletedRestaurants?.length || 0})
                            </h3>
                            {deletedRestaurants?.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Trash2 size={48} className="mx-auto mb-4 opacity-30" />
                                    <p className="font-bold">No recently deleted restaurants</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {deletedRestaurants?.map((r) => (
                                        <div key={r._id} className="bg-red-500/5 border-2 border-red-500/20 rounded-2xl p-5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 rounded-xl bg-red-500/10">
                                                        <Trash2 size={20} className="text-red-500" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-black text-red-500 tracking-wider text-sm">#{r.code}</span>
                                                            <h4 className="font-bold text-lg">{r.name}</h4>
                                                        </div>
                                                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                                            {r.hoursRemaining !== null && (
                                                                <span className="flex items-center gap-1.5">
                                                                    <Timer size={12} className="text-amber-500" />
                                                                    Auto-deletes in <strong className="text-amber-500">{r.hoursRemaining}h</strong>
                                                                </span>
                                                            )}
                                                            <span>Deleted: {formatDate(r.deletedAt)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => restoreRestaurantMutation.mutate(r._id)}
                                                    disabled={restoreRestaurantMutation.isPending}
                                                    className="px-5 py-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all flex items-center gap-2"
                                                >
                                                    <Undo2 size={14} />
                                                    Restore
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    </motion.div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="bg-card border-4 border-border rounded-[2rem] p-6 shadow-xl">
                            <h3 className="text-lg font-black italic uppercase mb-6 flex items-center gap-3">
                                <Users size={20} className="text-primary" />
                                All Users ({users?.length || 0})
                            </h3>
                            {selectedUsers.length > 0 && (
                                <div className="flex items-center gap-3 mb-6 p-4 bg-primary/5 border-2 border-primary/20 rounded-2xl">
                                    <CheckSquare size={18} className="text-primary" />
                                    <span className="text-sm font-bold">{selectedUsers.length} selected</span>
                                    <div className="flex-1" />
                                    <button
                                        onClick={() => bulkToggleUsersMutation.mutate({ ids: selectedUsers, action: 'deactivate' })}
                                        className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all"
                                    >
                                        Deactivate All
                                    </button>
                                    <button
                                        onClick={() => bulkToggleUsersMutation.mutate({ ids: selectedUsers, action: 'activate' })}
                                        className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                                    >
                                        Activate All
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm(`Delete ${selectedUsers.length} user(s) permanently?`)) {
                                                bulkDeleteUsersMutation.mutate(selectedUsers);
                                            }
                                        }}
                                        className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all"
                                    >
                                        Delete All
                                    </button>
                                    <button
                                        onClick={() => setSelectedUsers([])}
                                        className="px-4 py-2 bg-muted/30 text-muted-foreground rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-muted/50 transition-all"
                                    >
                                        Clear
                                    </button>
                                </div>
                            )}
                            {usersLoading ? (
                                <div className="flex justify-center py-12">
                                    <Clock className="animate-spin text-primary" size={32} />
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                             <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border">
                                                <th className="text-left py-4 px-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUsers.length === users?.filter(u => u.role !== 'SUPER_ADMIN').length && users?.length > 0}
                                                        onChange={() => {
                                                            if (selectedUsers.length > 0) {
                                                                setSelectedUsers([]);
                                                            } else {
                                                                setSelectedUsers(users?.filter(u => u.role !== 'SUPER_ADMIN').map(u => u._id) || []);
                                                            }
                                                        }}
                                                        className="w-5 h-5 rounded-lg border-2 border-border accent-primary cursor-pointer"
                                                    />
                                                </th>
                                                <th className="text-left py-4 px-3">Name</th>
                                                <th className="text-left py-4 px-3">Email</th>
                                                <th className="text-center py-4 px-3">Role</th>
                                                <th className="text-left py-4 px-3">Restaurant</th>
                                                <th className="text-center py-4 px-3">Status</th>
                                                <th className="text-center py-4 px-3">Joined</th>
                                                <th className="text-center py-4 px-3">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers?.length === 0 ? (
                                                <tr>
                                                    <td colSpan="8" className="text-center py-12 text-muted-foreground font-bold">No users found</td>
                                                </tr>
                                            ) : (
                                                filteredUsers?.map((u, i) => (
                                                    <tr key={u._id} className="border-b border-border/40 text-sm hover:bg-muted/20 transition-colors">
                                                        <td className="py-4 px-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedUsers.includes(u._id)}
                                                                disabled={u.role === 'SUPER_ADMIN'}
                                                                onChange={() => setSelectedUsers(prev =>
                                                                    prev.includes(u._id)
                                                                        ? prev.filter(id => id !== u._id)
                                                                        : [...prev, u._id]
                                                                )}
                                                                className="w-5 h-5 rounded-lg border-2 border-border accent-primary cursor-pointer"
                                                            />
                                                        </td>
                                                        <td className="py-4 px-3 font-bold">{u.name}</td>
                                                        <td className="py-4 px-3 text-muted-foreground">{u.email}</td>
                                                        <td className="py-4 px-3 text-center">
                                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                                                u.role === 'SUPER_ADMIN' ? 'bg-purple-500/10 text-purple-500' :
                                                                u.role === 'OWNER' ? 'bg-blue-500/10 text-blue-500' :
                                                                u.role === 'ADMIN' ? 'bg-amber-500/10 text-amber-500' :
                                                                'bg-muted/50 text-muted-foreground'
                                                            }`}>
                                                                {u.role}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-3 text-muted-foreground">
                                                            {u.restaurant?.name || u.restaurantName || '—'}
                                                        </td>
                                                        <td className="py-4 px-3 text-center">
                                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${u.isActive === false
                                                                ? 'bg-red-500/10 text-red-500'
                                                                : 'bg-emerald-500/10 text-emerald-500'
                                                            }`}>
                                                                {u.isActive === false ? <XCircle size={12} /> : <CheckCircle size={12} />}
                                                                {u.isActive === false ? 'Inactive' : 'Active'}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-3 text-center text-xs text-muted-foreground">
                                                            {formatDate(u.createdAt)}
                                                        </td>
                                                        <td className="py-4 px-3 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                {u.role !== 'SUPER_ADMIN' && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => toggleUserMutation.mutate(u._id)}
                                                                            disabled={toggleUserMutation.isPending}
                                                                            className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${u.isActive === false
                                                                                ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                                                                                : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                                                            }`}
                                                                        >
                                                                            {u.isActive === false ? 'Activate' : 'Deactivate'}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => { setPasswordResetTarget(u); setResetPassword(''); }}
                                                                            className="p-2 rounded-xl bg-muted/20 hover:bg-amber-500/10 hover:text-amber-500 transition-all text-muted-foreground"
                                                                            title="Reset password"
                                                                        >
                                                                            <Key size={14} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                if (window.confirm(`Delete user "${u.name}" (${u.email})? This cannot be undone.`)) {
                                                                                    deleteUserMutation.mutate(u._id);
                                                                                }
                                                                            }}
                                                                            disabled={deleteUserMutation.isPending}
                                                                            className="p-2 rounded-xl bg-muted/20 hover:bg-red-500/10 hover:text-red-500 transition-all text-muted-foreground"
                                                                            title="Delete user"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {u.role === 'SUPER_ADMIN' && (
                                                                    <span className="text-[9px] text-muted-foreground italic">Protected</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Activity Tab */}
                {activeTab === 'activity' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="bg-card border-4 border-border rounded-[2rem] p-6 shadow-xl">
                            <h3 className="text-lg font-black italic uppercase mb-6 flex items-center gap-3">
                                <History size={20} className="text-primary" />
                                Activity Log
                            </h3>
                            {activitiesLoading ? (
                                <div className="flex justify-center py-12">
                                    <Clock className="animate-spin text-primary" size={32} />
                                </div>
                            ) : activitiesData?.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <History size={48} className="mx-auto mb-4 opacity-30" />
                                    <p className="font-bold">No activity yet</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                                    {activitiesData?.map((a) => (
                                        <div key={a._id} className="flex items-start gap-4 p-4 bg-muted/10 rounded-2xl border border-border/40 hover:bg-muted/20 transition-colors">
                                            <div className={`p-2.5 rounded-xl ${
                                                a.action?.includes('created') ? 'bg-emerald-500/10 text-emerald-500' :
                                                a.action?.includes('deleted') ? 'bg-red-500/10 text-red-500' :
                                                a.action?.includes('blocked') ? 'bg-red-500/10 text-red-500' :
                                                a.action?.includes('activated') || a.action?.includes('unblocked') ? 'bg-emerald-500/10 text-emerald-500' :
                                                'bg-muted/30 text-muted-foreground'
                                            }`}>
                                                {a.action?.includes('created') ? <Plus size={16} /> :
                                                 a.action?.includes('deleted') ? <Trash2 size={16} /> :
                                                 a.action?.includes('blocked') ? <UserX size={16} /> :
                                                 a.action?.includes('unblocked') ? <UserCheck size={16} /> :
                                                 a.action?.includes('activated') ? <CheckCircle size={16} /> :
                                                 <Activity size={16} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold capitalize">
                                                    {a.action}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {a.targetName && <span className="font-medium text-foreground">{a.targetName}</span>}
                                                    {a.targetName && a.details?.role && <> &middot; </>}
                                                    {a.details?.role && <span className="text-muted-foreground">{a.details.role}</span>}
                                                    {a.details?.code && <span className="text-primary ml-1">#{a.details.code}</span>}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground/60 mt-1">
                                                    by {a.performedBy?.name || a.performedBy?.email || 'Unknown'} &middot; {formatDate(a.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Health Tab */}
                {activeTab === 'health' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-card border-4 border-border rounded-[2rem] p-6 shadow-xl">
                                <h3 className="text-lg font-black italic uppercase mb-6 flex items-center gap-3">
                                    <Activity size={20} className="text-primary" />
                                    Server Status
                                </h3>
                                {health ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</span>
                                            <span className={`flex items-center gap-2 font-bold ${health.dbStatus === 'connected' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                <span className={`w-2 h-2 rounded-full ${health.dbStatus === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                {health.dbStatus === 'connected' ? 'Online' : 'Offline'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Uptime</span>
                                            <span className="font-bold">{Math.floor(health.uptime / 60)}m {Math.floor(health.uptime % 60)}s</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Memory Usage</span>
                                            <span className="font-bold">{health.memory?.heapUsed ? (health.memory.heapUsed / 1024 / 1024).toFixed(1) : 'N/A'} MB</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Database</span>
                                            <span className="font-bold capitalize">{health.dbStatus || 'N/A'}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-center py-8">
                                        <Clock className="animate-spin text-primary" size={24} />
                                    </div>
                                )}
                            </div>

                            <div className="bg-card border-4 border-border rounded-[2rem] p-6 shadow-xl">
                                <h3 className="text-lg font-black italic uppercase mb-6 flex items-center gap-3">
                                    <AlertTriangle size={20} className="text-primary" />
                                    Quick Actions
                                </h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => { setActiveTab('restaurants'); setShowCreateModal(true); }}
                                        className="w-full p-4 bg-muted/20 hover:bg-primary/10 rounded-2xl text-left transition-all flex items-center justify-between group"
                                    >
                                        <span className="font-bold text-sm group-hover:text-primary transition-colors">Create New Restaurant</span>
                                        <Plus size={16} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                    <button
                                        onClick={() => queryClient.invalidateQueries()}
                                        className="w-full p-4 bg-muted/20 hover:bg-muted/40 rounded-2xl text-left transition-all flex items-center justify-between"
                                    >
                                        <span className="font-bold text-sm">Refresh All Data</span>
                                        <RefreshCw size={16} className="text-muted-foreground" />
                                    </button>
                                    <button
                                        onClick={() => window.open('https://api.ritambharat.software/health', '_blank')}
                                        className="w-full p-4 bg-muted/20 hover:bg-muted/40 rounded-2xl text-left transition-all flex items-center justify-between"
                                    >
                                        <span className="font-bold text-sm">Ping Server</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Public</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Password Reset Modal */}
            <AnimatePresence>
                {passwordResetTarget && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setPasswordResetTarget(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-card border-4 border-border rounded-[3rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-black italic uppercase flex items-center gap-3">
                                        <Key size={20} className="text-amber-500" />
                                        Reset Password
                                    </h3>
                                    <button
                                        onClick={() => setPasswordResetTarget(null)}
                                        className="p-3 hover:bg-muted rounded-2xl transition-all"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <p className="text-sm text-muted-foreground mb-6">
                                    Resetting password for <strong>{passwordResetTarget?.email}</strong>
                                </p>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        resetPasswordMutation.mutate({ id: passwordResetTarget._id, newPassword: resetPassword });
                                    }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
                                            New Password *
                                        </label>
                                        <input
                                            required
                                            type="password"
                                            value={resetPassword}
                                            onChange={e => setResetPassword(e.target.value)}
                                            className="w-full bg-muted/20 border-2 border-transparent focus:border-primary/50 rounded-2xl py-4 px-6 outline-none transition-all"
                                            placeholder="Min 6 characters"
                                            minLength={6}
                                        />
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setPasswordResetTarget(null)}
                                            className="flex-1 py-4 font-black uppercase tracking-widest text-[10px] bg-muted hover:bg-border rounded-2xl transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={resetPasswordMutation.isPending}
                                            className="flex-1 py-4 font-black uppercase tracking-widest text-[10px] bg-primary text-primary-foreground rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {resetPasswordMutation.isPending ? (
                                                <><Clock size={16} className="animate-spin" /> Resetting...</>
                                            ) : (
                                                <><Key size={16} /> Reset Password</>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Restaurant Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setShowCreateModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-card border-4 border-border rounded-[3rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl font-black italic uppercase flex items-center gap-3">
                                        <Plus size={24} className="text-primary" />
                                        Create Restaurant
                                    </h3>
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="p-3 hover:bg-muted rounded-2xl transition-all"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        createRestaurantMutation.mutate({
                                            ...createForm,
                                            address: { city: createForm.city, state: createForm.state }
                                        });
                                    }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
                                            Restaurant Name *
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            value={createForm.name}
                                            onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                                            className="w-full bg-muted/20 border-2 border-transparent focus:border-primary/50 rounded-2xl py-4 px-6 outline-none transition-all"
                                            placeholder="e.g. Flavours of India"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
                                                Owner Email *
                                            </label>
                                            <input
                                                required
                                                type="email"
                                                value={createForm.ownerEmail}
                                                onChange={e => setCreateForm({ ...createForm, ownerEmail: e.target.value })}
                                                className="w-full bg-muted/20 border-2 border-transparent focus:border-primary/50 rounded-2xl py-4 px-6 outline-none transition-all"
                                                placeholder="owner@email.com"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
                                                Owner Name
                                            </label>
                                            <input
                                                type="text"
                                                value={createForm.ownerName}
                                                onChange={e => setCreateForm({ ...createForm, ownerName: e.target.value })}
                                                className="w-full bg-muted/20 border-2 border-transparent focus:border-primary/50 rounded-2xl py-4 px-6 outline-none transition-all"
                                                placeholder="Rajesh Kumar"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
                                            Owner Password {createForm.ownerEmail && '(required for new users)'}
                                        </label>
                                        <input
                                            type="password"
                                            value={createForm.ownerPassword}
                                            onChange={e => setCreateForm({ ...createForm, ownerPassword: e.target.value })}
                                            className="w-full bg-muted/20 border-2 border-transparent focus:border-primary/50 rounded-2xl py-4 px-6 outline-none transition-all"
                                            placeholder="Min 6 characters"
                                        />
                                        <p className="text-[9px] text-muted-foreground px-1">
                                            Required if the owner email doesn't have an account yet.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
                                                Phone
                                            </label>
                                            <input
                                                type="tel"
                                                value={createForm.phone}
                                                onChange={e => setCreateForm({ ...createForm, phone: e.target.value.replace(/[^0-9+]/g, '') })}
                                                className="w-full bg-muted/20 border-2 border-transparent focus:border-primary/50 rounded-2xl py-4 px-6 outline-none transition-all"
                                                placeholder="919999999999"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
                                                Cuisine
                                            </label>
                                            <input
                                                type="text"
                                                value={createForm.cuisine}
                                                onChange={e => setCreateForm({ ...createForm, cuisine: e.target.value })}
                                                className="w-full bg-muted/20 border-2 border-transparent focus:border-primary/50 rounded-2xl py-4 px-6 outline-none transition-all"
                                                placeholder="Indian, Chinese, etc."
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">City</label>
                                            <input
                                                type="text"
                                                value={createForm.city}
                                                onChange={e => setCreateForm({ ...createForm, city: e.target.value })}
                                                className="w-full bg-muted/20 border-2 border-transparent focus:border-primary/50 rounded-2xl py-4 px-6 outline-none transition-all"
                                                placeholder="Mumbai"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">State</label>
                                            <input
                                                type="text"
                                                value={createForm.state}
                                                onChange={e => setCreateForm({ ...createForm, state: e.target.value })}
                                                className="w-full bg-muted/20 border-2 border-transparent focus:border-primary/50 rounded-2xl py-4 px-6 outline-none transition-all"
                                                placeholder="Maharashtra"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateModal(false)}
                                            className="flex-1 py-4 font-black uppercase tracking-widest text-[10px] bg-muted hover:bg-border rounded-2xl transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={createRestaurantMutation.isPending}
                                            className="flex-1 py-4 font-black uppercase tracking-widest text-[10px] bg-primary text-primary-foreground rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {createRestaurantMutation.isPending ? (
                                                <><Clock size={16} className="animate-spin" /> Creating...</>
                                            ) : (
                                                <><Plus size={16} strokeWidth={3} /> Create Restaurant</>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Credits Modal */}
            <AnimatePresence>
                {creditModalTarget && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setCreditModalTarget(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-card border-4 border-border rounded-[3rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-black italic uppercase flex items-center gap-3">
                                        <Banknote size={20} className="text-emerald-500" />
                                        Add Credits
                                    </h3>
                                    <button
                                        onClick={() => setCreditModalTarget(null)}
                                        className="p-3 hover:bg-muted rounded-2xl transition-all"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <p className="text-sm text-muted-foreground mb-6">
                                    Adding credits to <strong>{creditModalTarget?.name}</strong> (#{creditModalTarget?.code})
                                    {(() => {
                                        const cr = creditsMap[creditModalTarget?._id];
                                        if (!cr) return null;
                                        return <span className="block mt-1 text-xs">Current balance: <strong>₹{cr.balance.toFixed(2)}</strong> (≈{Math.floor(cr.balance / 0.50)} msg)</span>;
                                    })()}
                                </p>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (!creditAmount || parseFloat(creditAmount) <= 0) {
                                            toast.error('Enter a valid amount');
                                            return;
                                        }
                                        addCreditsMutation.mutate({
                                            restaurantId: creditModalTarget._id,
                                            amount: creditAmount,
                                            description: creditNote || undefined
                                        });
                                    }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
                                            Amount (₹) *
                                        </label>
                                        <input
                                            required
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={creditAmount}
                                            onChange={e => setCreditAmount(e.target.value)}
                                            className="w-full bg-muted/20 border-2 border-transparent focus:border-primary/50 rounded-2xl py-4 px-6 outline-none transition-all"
                                            placeholder="e.g. 50"
                                        />
                                        {creditAmount > 0 && (
                                            <p className="text-[9px] text-muted-foreground px-1">
                                                ≈ {Math.floor(parseFloat(creditAmount) / 0.50)} bill messages at ₹0.50/msg
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
                                            Note (optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={creditNote}
                                            onChange={e => setCreditNote(e.target.value)}
                                            className="w-full bg-muted/20 border-2 border-transparent focus:border-primary/50 rounded-2xl py-4 px-6 outline-none transition-all"
                                            placeholder="e.g. Monthly top-up"
                                        />
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setCreditModalTarget(null)}
                                            className="flex-1 py-4 font-black uppercase tracking-widest text-[10px] bg-muted hover:bg-border rounded-2xl transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={addCreditsMutation.isPending}
                                            className="flex-1 py-4 font-black uppercase tracking-widest text-[10px] bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {addCreditsMutation.isPending ? (
                                                <><Clock size={16} className="animate-spin" /> Adding...</>
                                            ) : (
                                                <><Banknote size={16} /> Add ₹{creditAmount || '0'}</>
                                            )}
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

export default AdminDashboard;
