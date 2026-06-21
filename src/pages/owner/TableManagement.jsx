import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { Table as TableIcon, Plus, QrCode, Trash2, X, Download, RefreshCw, Users, Clock, Filter, MoreVertical, Armchair, Coffee, MapPin, Layers, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import RoomForm from '../../components/room/RoomForm';
import RoomSelector from '../../components/room/RoomSelector';

const TableManagement = () => {
    const { user } = useAuth();
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [restaurantId, setRestaurantId] = useState(() => {
        if (!user?.restaurant) return null;
        return typeof user.restaurant === 'object' ? user.restaurant._id : user.restaurant;
    });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Filter State
    const [filterLocation, setFilterLocation] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterRoom, setFilterRoom] = useState(null);

    // Room State
    const [showRoomForm, setShowRoomForm] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);

    const queryClient = useQueryClient();

    const { data: rooms = [] } = useQuery({
        queryKey: ['rooms', restaurantId],
        queryFn: async () => {
            const res = await api.get(`/rooms?restaurantId=${restaurantId}`);
            return res.data.data || [];
        },
        enabled: !!restaurantId
    });

    const roomMutation = useMutation({
        mutationFn: async ({ id, data }) => {
            if (id) return api.patch(`/rooms/${id}`, data);
            return api.post('/rooms', { restaurantId, ...data });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rooms', restaurantId] });
            setShowRoomForm(false);
            setEditingRoom(null);
            toast.success('Room saved');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to save room')
    });

    const deleteRoomMutation = useMutation({
        mutationFn: async (id) => api.delete(`/rooms/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rooms', restaurantId] });
            toast.success('Room deleted');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete room')
    });

    // Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        capacity: 4,
        location: 'Indoor',
        room: ''
    });

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        try {
            setLoading(true);
            let targetRestaurantId = restaurantId;

            // If we don't have the ID yet, try to find it
            if (!targetRestaurantId) {
                const res = await api.get('/restaurant/my-restaurants');
                if (res.data.data && res.data.data.length > 0) {
                    targetRestaurantId = res.data.data[0]._id;
                    setRestaurantId(targetRestaurantId);
                }
            } else if (user?.restaurant && !restaurantId) {
                // Keep state in sync if user.restaurant becomes available
                const id = typeof user.restaurant === 'object' ? user.restaurant._id : user.restaurant;
                if (id) {
                    targetRestaurantId = id;
                    setRestaurantId(id);
                }
            }

            if (targetRestaurantId) {
                const { data } = await api.get(`/tables?restaurant=${targetRestaurantId}`);
                setTables(data.data);
            }
        } catch (error) {
            console.error('Error fetching tables:', error);
            toast.error('Failed to load tables');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTable = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, restaurant: restaurantId };
            if (!payload.room) delete payload.room;
            await api.post('/tables', payload);
            toast.success('Table created successfully');
            setShowAddModal(false);
            setFormData({ name: '', capacity: 4, location: 'Indoor', room: '' });
            fetchTables();
        } catch (error) {
            console.error('Error creating table:', error);
            toast.error(error.response?.data?.message || 'Failed to create table');
        }
    };

    const handleDeleteTable = async (id) => {
        if (!window.confirm('Are you sure you want to delete this table?')) return;

        try {
            await api.delete(`/tables/${id}`);
            toast.success('Table deleted successfully');
            fetchTables();
        } catch (error) {
            console.error('Error deleting table:', error);
            toast.error('Failed to delete table');
        }
    };

    const handleDownloadQR = async (table) => {
        try {
            const response = await api.get(`/tables/${table._id}/qr`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `table-${table.name}-qr.png`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading QR:', error);
            toast.error('Failed to download QR code');
        }
    };

    const openQRModal = async (table) => {
        try {
            const { data } = await api.get(`/tables/${table._id}`);
            setSelectedTable(data.data);
            setShowQRModal(true);
        } catch (error) {
            console.error('Error fetching table details:', error);
            toast.error('Failed to load QR code');
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            // Note: Assuming backend supports PATCH /tables/:id with { status }
            // If strictly using dedicated endpoints like /reset, we might need to adjust.
            // But usually a direct update is also possible or we can simulate it.
            // Reusing reset endpoint for FREE status if generic update fails.

            if (status === 'FREE') {
                await api.patch(`/tables/${id}/reset`);
            } else {
                // Determine if we need to call a specific endpoint or generic update
                // Trying generic update first as per typical REST patterns
                await api.patch(`/tables/${id}`, { status });
            }

            toast.success(`Table marked as ${status}`);
            fetchTables();
        } catch (error) {
            console.error('Error updating table status:', error);
            toast.error('Failed to update status');
        }
    };

    // Component for Table Timer
    const TableTimer = ({ startTime }) => {
        const [elapsed, setElapsed] = useState('');

        useEffect(() => {
            if (!startTime) return;

            const updateTimer = () => {
                const now = new Date();
                const start = new Date(startTime);
                const diff = Math.floor((now - start) / 1000); // seconds

                if (diff < 0) {
                    setElapsed('0m');
                    return;
                }

                const hours = Math.floor(diff / 3600);
                const minutes = Math.floor((diff % 3600) / 60);

                if (hours > 0) {
                    setElapsed(`${hours}h ${minutes}m`);
                } else {
                    setElapsed(`${minutes}m`);
                }
            };

            updateTimer();
            const interval = setInterval(updateTimer, 60000); // Update every minute

            return () => clearInterval(interval);
        }, [startTime]);

        return (
            <div className="flex items-center gap-1 text-xs font-mono text-foreground font-bold">
                <Clock size={12} className="text-muted-foreground" />
                {elapsed}
            </div>
        );
    };

    // Filtering Logic
    const filteredTables = tables.filter(table => {
        const matchLocation = filterLocation === 'All' || table.location === filterLocation;
        const matchStatus = filterStatus === 'All' || table.status === filterStatus;
        const matchRoom = !filterRoom || table.room === filterRoom || table.room?._id === filterRoom || table.room?.toString() === filterRoom;
        return matchLocation && matchStatus && matchRoom;
    });

    // Stats Calculation
    const stats = {
        total: tables.length,
        occupied: tables.filter(t => t.status === 'OCCUPIED').length,
        capacity: tables.reduce((acc, t) => acc + (t.capacity || 0), 0),
        free: tables.filter(t => t.status === 'FREE').length
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
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h1 className="text-3xl font-display font-bold text-foreground mb-1">
                                Table Management
                            </h1>
                            <p className="text-muted-foreground">
                                Oversee layout, occupancy, and QR codes
                            </p>
                        </motion.div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn-primary shadow-lg shadow-primary/20 gap-2"
                        >
                            <Plus size={20} /> Add New Table
                        </button>
                    </div>

                    {/* Stats Carousel */}
                    <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory carousel-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-4 lg:pb-0 mb-8">
                        {[
                            { label: 'Total Tables', value: stats.total, icon: TableIcon, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                            { label: 'Occupied', value: stats.occupied, icon: Users, color: 'text-red-500', bg: 'bg-red-500/10' },
                            { label: 'Available', value: stats.free, icon: CheckCircleIcon, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                            { label: 'Total Guests', value: stats.capacity, icon: Armchair, color: 'text-purple-500', bg: 'bg-purple-500/10' },
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

                    {/* Filters & Actions Overlay */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
                        <div className="flex-1 flex gap-2 w-full overflow-x-auto pb-2 sm:pb-0 carousel-scrollbar">
                            <select
                                value={filterLocation}
                                onChange={(e) => setFilterLocation(e.target.value)}
                                className="bg-card/50 backdrop-blur-md border border-border/50 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest focus:ring-2 ring-primary/20 outline-none min-w-[140px]"
                            >
                                <option value="All">All Areas</option>
                                <option value="Indoor">Indoor</option>
                                <option value="Outdoor">Outdoor</option>
                                <option value="VIP">VIP</option>
                            </select>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="bg-card/50 backdrop-blur-md border border-border/50 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest focus:ring-2 ring-primary/20 outline-none min-w-[140px]"
                            >
                                <option value="All">All States</option>
                                <option value="FREE">Available</option>
                                <option value="OCCUPIED">Busy</option>
                                <option value="CLEANING">Cleaning</option>
                            </select>
                        </div>
                    </div>

                    {/* Rooms Section */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Layers size={14} />
                                Rooms / Zones
                            </h3>
                            <button
                                onClick={() => { setEditingRoom(null); setShowRoomForm(true); }}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] font-bold hover:bg-primary/20 transition-colors"
                            >
                                <Plus size={10} />
                                Add Room
                            </button>
                        </div>
                        <RoomSelector
                            restaurantId={restaurantId}
                            selectedRoom={filterRoom}
                            onSelect={setFilterRoom}
                        />
                        {rooms.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {rooms.map(room => (
                                    <div key={room._id} className="flex items-center gap-1 bg-muted/20 px-2 py-1 rounded-lg">
                                        <span className="text-[10px] font-bold text-muted-foreground">{room.name}</span>
                                        <button
                                            onClick={() => { setEditingRoom(room); setShowRoomForm(true); }}
                                            className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <Pencil size={10} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm(`Delete "${room.name}"? Tables in this room will be unlinked.`))
                                                    deleteRoomMutation.mutate(room._id);
                                            }}
                                            className="p-0.5 text-red-500 hover:text-red-400 transition-colors"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tables Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="h-48 rounded-2xl bg-muted/20 animate-pulse"></div>
                            ))}
                        </div>
                    ) : filteredTables.length === 0 ? (
                        <div className="text-center py-20 bg-muted/10 rounded-2xl border border-dashed border-border">
                            <TableIcon size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-xl font-bold text-foreground mb-2">No Tables Found</h3>
                            <p className="text-muted-foreground mb-6">Adjust filters or create your first table.</p>
                            <button onClick={() => setShowAddModal(true)} className="btn-primary">
                                Create Table
                            </button>
                        </div>
                    ) : (
                        <motion.div
                            layout
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            <AnimatePresence>
                                {filteredTables.map(table => (
                                    <motion.div
                                        key={table._id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className={`relative group rounded-[2.5rem] p-8 border-4 lg:border-[10px] shadow-2xl transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden ${table.status === 'OCCUPIED' ? 'bg-red-500/5 border-red-500/60' :
                                            table.status === 'RESERVED' ? 'bg-orange-500/5 border-orange-500/60' :
                                                table.status === 'CLEANING' ? 'bg-blue-500/5 border-blue-500/60' :
                                                    'bg-card border-border hover:border-primary'
                                            }`}
                                    >
                                        {/* Background Pulse for Occupied */}
                                        {table.status === 'OCCUPIED' && (
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[60px] rounded-full -mr-16 -mt-16 animate-pulse" />
                                        )}

                                        <div className="flex justify-between items-start mb-6 relative z-10">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3.5 rounded-2xl shadow-inner ${table.status === 'OCCUPIED' ? 'bg-red-500/20 text-red-600' :
                                                    table.status === 'RESERVED' ? 'bg-orange-500/20 text-orange-600' :
                                                        table.status === 'CLEANING' ? 'bg-blue-500/20 text-blue-600' :
                                                            'bg-emerald-500/20 text-emerald-600'
                                                    }`}>
                                                    {table.status === 'OCCUPIED' ? <Users size={24} strokeWidth={2.5} /> :
                                                        table.status === 'RESERVED' ? <Clock size={24} strokeWidth={2.5} /> :
                                                            table.status === 'CLEANING' ? <RefreshCw size={24} strokeWidth={2.5} /> :
                                                                <TableIcon size={24} strokeWidth={2.5} />}
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-xl text-foreground tracking-tight">{table.name}</h3>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                                        <MapPin size={12} strokeWidth={3} />
                                                        {table.location}
                                                    </div>
                                                    {table.room?.name && (
                                                        <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-primary/60">
                                                            <Layers size={10} strokeWidth={3} />
                                                            {table.room.name}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => openQRModal(table)}
                                                    className="p-2.5 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-all active:scale-90 border border-border/50"
                                                >
                                                    <QrCode size={18} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4 relative z-10">
                                            <div className="flex justify-between items-center bg-background/40 backdrop-blur-md p-3 rounded-2xl border border-border/30">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">State</span>
                                                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${table.status === 'OCCUPIED' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' :
                                                    table.status === 'RESERVED' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' :
                                                        table.status === 'CLEANING' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' :
                                                            'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                                    }`}>
                                                    {table.status}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-foreground/5 p-3 rounded-2xl border border-border/10 flex flex-col gap-1">
                                                    <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Seats</span>
                                                    <span className="text-sm font-black text-foreground">{table.capacity} Guests</span>
                                                </div>
                                                <div className="bg-foreground/5 p-3 rounded-2xl border border-border/10 flex flex-col gap-1">
                                                    <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Duration</span>
                                                    {table.status === 'OCCUPIED' ? <TableTimer startTime={table.currentSession?.occupiedAt} /> : <span className="text-sm font-black text-muted-foreground/40">--</span>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Fat-Finger Friendly Actions */}
                                        <div className="mt-6 pt-6 border-t border-border/30 grid grid-cols-2 gap-3 relative z-10">
                                            {table.status !== 'FREE' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(table._id, 'FREE')}
                                                    className="py-3 bg-emerald-500/10 text-emerald-600 font-black text-[10px] uppercase tracking-widest border-2 border-emerald-500/20 rounded-2xl hover:bg-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircleIcon size={14} /> Clear
                                                </button>
                                            )}
                                            {table.status === 'FREE' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(table._id, 'OCCUPIED')}
                                                    className="py-3 bg-red-500/10 text-red-600 font-black text-[10px] uppercase tracking-widest border-2 border-red-500/20 rounded-2xl hover:bg-red-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    <Users size={14} strokeWidth={3} /> Occupy
                                                </button>
                                            )}
                                            {table.status !== 'CLEANING' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(table._id, 'CLEANING')}
                                                    className="py-3 bg-blue-500/10 text-blue-600 font-black text-[10px] uppercase tracking-widest border-2 border-blue-500/20 rounded-2xl hover:bg-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    <RefreshCw size={14} strokeWidth={3} /> Clean
                                                </button>
                                            )}

                                            <button
                                                onClick={() => handleDeleteTable(table._id)}
                                                className="col-span-2 py-3 bg-red-500/20 text-white font-medium text-[9px] uppercase tracking-widest border-2 border-transparent rounded-2xl hover:bg-red-500/30 transition-all active:scale-95 mt-2"
                                            >
                                                Permanently Remove Table
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </main>
            </div>

            {/* Add Table Modal */}
            <AnimatePresence>
                {showAddModal && (
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
                                    <h3 className="text-2xl font-black text-foreground tracking-tight">New Table</h3>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Expand your seating capacity</p>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="bg-muted/50 text-foreground hover:bg-muted p-2.5 rounded-2xl transition-all active:scale-90">
                                    <X size={24} strokeWidth={2.5} />
                                </button>
                            </div>

                            <form onSubmit={handleAddTable} className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Table Name/ID</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="input w-full bg-muted/30 border-2 border-transparent focus:border-primary/50 transition-all font-bold py-4 text-lg"
                                        placeholder="e.g. Table 01"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Capacity</label>
                                        <input
                                            type="number"
                                            value={formData.capacity}
                                            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                            min="1"
                                            className="input w-full bg-muted/30 border-2 border-transparent focus:border-primary/50 transition-all font-bold py-4"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Location</label>
                                        <select
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            className="input w-full bg-muted/30 border-2 border-transparent focus:border-primary/50 transition-all font-bold py-4 appearance-none"
                                        >
                                            <option value="Indoor">Indoor</option>
                                            <option value="Outdoor">Outdoor</option>
                                            <option value="VIP">VIP</option>
                                            <option value="Patio">Patio</option>
                                            <option value="Bar">Bar</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Room / Zone</label>
                                    <select
                                        value={formData.room}
                                        onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                        className="input w-full bg-muted/30 border-2 border-transparent focus:border-primary/50 transition-all font-bold py-4 appearance-none"
                                    >
                                        <option value="">None</option>
                                        {rooms.map(room => (
                                            <option key={room._id} value={room._id}>{room.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pt-6 flex gap-4">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-muted/50 text-foreground font-black uppercase tracking-widest rounded-2xl border-2 border-border/50 hover:bg-muted transition-all active:scale-95">
                                        Cancel
                                    </button>
                                    <button type="submit" className="flex-[2] py-4 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:brightness-110 transition-all active:scale-95">
                                        Create Table
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* View QR Modal */}
            <AnimatePresence>
                {showQRModal && selectedTable && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-card w-full max-w-sm rounded-[2.5rem] shadow-2xl border-4 border-border flex flex-col items-center p-8 text-center"
                        >
                            <div className="w-full flex justify-between items-center mb-6">
                                <div className="text-left">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Digital Node</h4>
                                    <h2 className="text-2xl font-black text-foreground tracking-tight">{selectedTable.name}</h2>
                                </div>
                                <button onClick={() => setShowQRModal(false)} className="bg-muted text-foreground hover:bg-muted/80 p-2.5 rounded-2xl transition-all active:scale-90 shadow-lg border border-border/50">
                                    <X size={22} strokeWidth={3} />
                                </button>
                            </div>

                            <div className="bg-white p-6 rounded-[2rem] shadow-2xl mb-8 border-4 border-muted/20">
                                <img
                                    src={selectedTable.qrCodeImage}
                                    alt="Table QR"
                                    className="h-48 w-48 object-contain"
                                />
                            </div>

                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-8 leading-relaxed">
                                Scan for instant access<br />to menu and ordering
                            </p>

                            <button onClick={() => handleDownloadQR(selectedTable)} className="w-full py-4 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:brightness-110 transition-all active:scale-95 text-sm">
                                <Download size={20} strokeWidth={3} />
                                Download QR
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {showRoomForm && (
                <RoomForm
                    room={editingRoom}
                    onClose={() => { setShowRoomForm(false); setEditingRoom(null); }}
                    onSubmit={(data) => roomMutation.mutate({ id: editingRoom?._id, data })}
                    loading={roomMutation.isPending}
                />
            )}
        </div>
    );
};

// Helper Icon for Stats
const CheckCircleIcon = ({ size, className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

export default TableManagement;
