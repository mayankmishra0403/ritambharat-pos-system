import { useState, useEffect, Component } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import { Calendar, TrendingUp, ShoppingBag, DollarSign, Clock, Download, ArrowUpRight, ArrowDownRight, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

class AnalyticsErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error) {
        console.error('[Analytics] Render error:', error);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <p className="text-muted-foreground font-bold text-sm mb-2">Could not load analytics chart</p>
                    <button onClick={() => this.setState({ hasError: false })} className="text-primary text-xs underline">Retry</button>
                </div>
            );
        }
        return this.props.children;
    }
}

const Analytics = () => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [dateRange, setDateRange] = useState('week'); // today, week, month
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [data, setData] = useState({
        orders: [],
        revenue: null,
        peakHours: [],
        topItems: []
    });
    const restaurantId = user?.restaurant?._id || user?.restaurant;

    useEffect(() => {
        if (restaurantId) {
            fetchAllData();
        }
    }, [restaurantId, dateRange]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const now = new Date();
            let startDate = new Date();

            if (dateRange === 'today') {
                startDate.setHours(0, 0, 0, 0);
            } else if (dateRange === 'week') {
                startDate.setDate(now.getDate() - 7);
            } else if (dateRange === 'month') {
                startDate.setMonth(now.getMonth() - 1);
            }

            const startStr = startDate.toISOString();
            const endStr = now.toISOString();

            const fetchData = async (url) => {
                try {
                    const res = await api.get(url, { _skipErrorToast: true });
                    return { success: true, data: res.data.data };
                } catch (err) {
                    return { success: false, data: [] };
                }
            };

            const [ordersRes, revenueRes, peakHoursRes, topItemsRes] = await Promise.all([
                fetchData(`/analytics/orders/${restaurantId}?startDate=${startStr}&endDate=${endStr}&groupBy=${dateRange === 'today' ? 'hour' : 'day'}&timezone=${timezone}`),
                fetchData(`/analytics/revenue/${restaurantId}?startDate=${startStr}&endDate=${endStr}`),
                fetchData(`/analytics/peak-hours/${restaurantId}?startDate=${startStr}&endDate=${endStr}&timezone=${timezone}`),
                fetchData(`/analytics/top-items/${restaurantId}?startDate=${startStr}&endDate=${endStr}&limit=5`)
            ]);

            setData({
                orders: ordersRes.data || [],
                revenue: revenueRes.data || null,
                peakHours: peakHoursRes.data || [],
                topItems: topItemsRes.data || []
            });
        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error('Could not load some analytics data');
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = () => {
        const rows = [
            ['Period', 'Orders', 'Revenue', 'Avg Order Value'],
            ...data.orders.map(o => [o._id, o.totalOrders, o.totalRevenue, o.avgOrderValue]),
            [],
            ['Item', 'Category', 'Orders', 'Revenue'],
            ...data.topItems.map(i => [i.itemName, i.category, i.totalOrdered, i.totalRevenue]),
        ];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${dateRange}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const StatsCard = ({ title, value, icon: Icon, trend }) => (
        <div className="bg-card border-4 border-border rounded-[2.5rem] p-8 shadow-2xl min-w-[280px] md:min-w-0 flex-1 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border-2 border-primary/20 shadow-inner group-hover:scale-110 transition-transform">
                    <Icon size={28} strokeWidth={2.5} />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center text-[10px] font-black tracking-tighter uppercase px-3 py-1.5 rounded-full border-2 ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                        {trend >= 0 ? <ArrowUpRight size={14} className="mr-1" strokeWidth={3} /> : <ArrowDownRight size={14} className="mr-1" strokeWidth={3} />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <h3 className="text-4xl font-black text-foreground mb-2 tracking-tighter">{value}</h3>
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground">{title}</p>
        </div>
    );

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
                    className="fixed inset-0 bg-black/80 backdrop-blur-xl z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header onMobileMenuClick={() => setMobileMenuOpen(true)} />

                <main className="flex-1 overflow-y-auto p-4 lg:p-12 custom-scrollbar">
                    {/* Header */}
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-12 gap-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <h1 className="text-5xl font-black text-foreground mb-3 tracking-tighter">
                                Insights
                            </h1>
                            <div className="flex items-center gap-2 text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
                                <Calendar size={14} />
                                Tracking <span className="text-primary">{dateRange === 'today' ? 'Today' : dateRange === 'week' ? 'Last 7 Days' : 'Last 30 Days'}</span>
                            </div>
                        </motion.div>

                        <div className="flex flex-wrap gap-4 w-full xl:w-auto">
                            <div className="flex bg-card border-4 border-border p-2 rounded-[2rem] w-full sm:w-auto">
                                {['today', 'week', 'month'].map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => setDateRange(range)}
                                        className={`flex-1 sm:flex-none px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${dateRange === range ? 'bg-primary text-primary-foreground shadow-xl scale-105' : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        {range}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={downloadCSV}
                                className="flex-1 sm:flex-none px-8 py-4 bg-muted/50 border-4 border-border rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center justify-center gap-3"
                            >
                                <Download size={18} /> Export
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="h-96 flex items-center justify-center">
                            <div className="relative w-20 h-20">
                                <div className="absolute inset-0 border-8 border-primary/20 rounded-full"></div>
                                <div className="absolute inset-0 border-8 border-primary rounded-full border-t-transparent animate-spin"></div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-12 pb-12">
                            {/* KPI Metrics */}
                            <div className="flex overflow-x-auto lg:grid lg:grid-cols-3 gap-6 pb-6 lg:pb-0 no-scrollbar snap-x touch-pan-x">
                                <div className="snap-center">
                                    <StatsCard
                                        title="Total Revenue"
                                        value={Math.round(data.revenue?.totalRevenue || 0)}
                                        icon={TrendingUp}
                                        trend={data.revenue?.trends?.revenue}
                                    />
                                </div>
                                <div className="snap-center">
                                    <StatsCard
                                        title="Total Orders"
                                        value={data.revenue?.totalTransactions || 0}
                                        icon={ShoppingBag}
                                        trend={data.revenue?.trends?.orders}
                                    />
                                </div>
                                <div className="snap-center">
                                    <StatsCard
                                        title="Avg. Ticket"
                                        value={Math.round(data.revenue?.avgTransactionValue || 0)}
                                        icon={TrendingUp}
                                        trend={data.revenue?.trends?.ticket}
                                    />
                                </div>
                            </div>

                            {/* Main Charts */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                                    {/* Revenue Trend Area Chart */}
                                    <div className="bg-card border-4 border-border rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                                        <div className="flex items-center justify-between mb-10">
                                            <h3 className="text-xl font-black text-foreground uppercase tracking-widest flex items-center gap-4">
                                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border-2 border-primary/20">
                                                    <TrendingUp size={20} strokeWidth={3} />
                                                </div>
                                                Revenue
                                            </h3>
                                        </div>
                                        <div className="h-[350px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={data.orders}>
                                                    <defs>
                                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#d97706" stopOpacity={0.4} />
                                                            <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="10 10" stroke={theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} vertical={false} />
                                                    <XAxis
                                                        dataKey="_id"
                                                        stroke={theme === 'dark' ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}
                                                        fontSize={10}
                                                        fontWeight="bold"
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tickFormatter={(val) => dateRange === 'today' ? `${val}:00` : val.split('-').slice(1).join('/')}
                                                    />
                                                    <YAxis stroke={theme === 'dark' ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: theme === 'dark' ? '#121212' : '#ffffff',
                                                            border: `4px solid ${theme === 'dark' ? '#1a1a1a' : '#f3f4f6'}`,
                                                            borderRadius: '2rem',
                                                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)'
                                                        }}
                                                        itemStyle={{ color: '#d97706', fontWeight: '900', textTransform: 'uppercase', fontSize: '10px' }}
                                                        labelStyle={{ color: theme === 'dark' ? 'white' : '#111827', fontWeight: '900', marginBottom: '8px', fontSize: '12px' }}
                                                        formatter={(value) => [`$${value}`, 'Revenue']}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="totalRevenue"
                                                        stroke="#d97706"
                                                        strokeWidth={4}
                                                        fillOpacity={1}
                                                        fill="url(#colorRevenue)"
                                                        animationDuration={2000}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Peak Hours Bar Chart */}
                                    <div className="bg-card border-4 border-border rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                                        <div className="flex items-center justify-between mb-10">
                                            <h3 className="text-xl font-black text-foreground uppercase tracking-widest flex items-center gap-4">
                                                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 border-2 border-blue-500/20">
                                                    <Clock size={20} strokeWidth={3} />
                                                </div>
                                                Peak Hours
                                            </h3>
                                        </div>
                                        <div className="h-[350px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={data.peakHours?.hourlyBreakdown?.sort((a, b) => a._id - b._id)}>
                                                    <CartesianGrid strokeDasharray="10 10" stroke={theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} vertical={false} />
                                                    <XAxis dataKey="_id" stroke={theme === 'dark' ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(val) => `${val}:00`} />
                                                    <YAxis stroke={theme === 'dark' ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                                                    <Tooltip
                                                        cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
                                                        contentStyle={{
                                                            backgroundColor: theme === 'dark' ? '#121212' : '#ffffff',
                                                            border: `4px solid ${theme === 'dark' ? '#1a1a1a' : '#f3f4f6'}`,
                                                            borderRadius: '2rem',
                                                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)'
                                                        }}
                                                        itemStyle={{ color: '#3b82f6', fontWeight: '900', textTransform: 'uppercase', fontSize: '10px' }}
                                                        labelStyle={{ color: theme === 'dark' ? 'white' : '#111827', fontWeight: '900', marginBottom: '8px', fontSize: '12px' }}
                                                    />
                                                    <Bar dataKey="orderCount" fill="#3b82f6" radius={[10, 10, 0, 0]} name="Orders" animationDuration={2000} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>


                            {/* Top Items List */}
                            <div className="bg-card border-4 border-border rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden">
                                <div className="flex items-center justify-between mb-10">
                                    <h3 className="text-xl font-black text-foreground uppercase tracking-widest flex items-center gap-4">
                                        <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500 border-2 border-yellow-500/20">
                                            <Star size={20} strokeWidth={3} />
                                        </div>
                                        Best Sellers
                                    </h3>
                                </div>

                                {/* Desktop Table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left border-separate border-spacing-y-4">
                                        <thead>
                                            <tr className="text-muted-foreground text-[10px] uppercase tracking-[0.2em] font-black">
                                                <th className="pb-4 px-6">Rank</th>
                                                <th className="pb-4 px-6">Item</th>
                                                <th className="pb-4 px-6">Category</th>
                                                <th className="pb-4 px-6 text-right">Orders</th>
                                                <th className="pb-4 px-6 text-right">Revenue</th>
                                                <th className="pb-4 px-6 text-right">Impact</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.topItems?.map((item, index) => (
                                                <tr key={index} className="group text-foreground">
                                                    <td className="bg-muted/30 py-6 px-6 rounded-l-[1.5rem] font-black text-muted-foreground/30 text-2xl">#{index + 1}</td>
                                                    <td className="bg-muted/30 py-6 px-6 font-black">{item.itemName}</td>
                                                    <td className="bg-muted/30 py-6 px-6">
                                                        <span className="px-4 py-2 bg-muted rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground border border-border/50">
                                                            {item.category}
                                                        </span>
                                                    </td>
                                                    <td className="bg-muted/30 py-6 px-6 text-right font-black">{item.totalOrdered}</td>
                                                    <td className="bg-muted/30 py-6 px-6 text-right font-black text-primary text-lg">
                                                        ${Math.round(item.totalRevenue)}
                                                    </td>
                                                    <td className="bg-muted/30 py-6 px-6 rounded-r-[1.5rem]">
                                                        <div className="w-32 ml-auto h-3 bg-muted rounded-full overflow-hidden border border-border/50">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${(item.totalRevenue / (data.topItems[0]?.totalRevenue || 1)) * 100}%` }}
                                                                transition={{ delay: index * 0.1, duration: 1 }}
                                                                className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(217,119,6,0.3)]"
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card List */}
                                <div className="md:hidden space-y-6">
                                    {data.topItems?.map((item, index) => (
                                        <div key={index} className="bg-card border-2 border-border rounded-[2rem] p-6 relative group overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 font-black text-muted-foreground/10 text-4xl">#{index + 1}</div>
                                            <div className="flex flex-col gap-4 relative z-10">
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-widest font-black text-primary mb-1">{item.category}</p>
                                                    <h4 className="text-xl font-black text-foreground mb-2">{item.itemName}</h4>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 bg-muted/30 rounded-2xl border border-border/50">
                                                        <p className="text-[8px] uppercase tracking-widest font-black text-muted-foreground mb-1">Orders</p>
                                                        <p className="text-lg font-black text-foreground">{item.totalOrdered}</p>
                                                    </div>
                                                    <div className="p-4 bg-muted/30 rounded-2xl border border-border/50">
                                                        <p className="text-[8px] uppercase tracking-widest font-black text-muted-foreground mb-1">Revenue</p>
                                                        <p className="text-lg font-black text-primary">${Math.round(item.totalRevenue)}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 mt-2">
                                                    <div className="flex justify-between text-[8px] uppercase tracking-widest font-black text-muted-foreground">
                                                        <span>Financial Impact</span>
                                                        <span>{Math.round((item.totalRevenue / (data.topItems[0]?.totalRevenue || 1)) * 100)}%</span>
                                                    </div>
                                                    <div className="h-2 bg-muted rounded-full overflow-hidden border border-border/50">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${(item.totalRevenue / (data.topItems[0]?.totalRevenue || 1)) * 100}%` }}
                                                            className="h-full bg-primary"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Analytics;
