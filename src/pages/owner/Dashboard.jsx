import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import {
    TrendingUp, ShoppingCart, DollarSign, Users,
    ArrowUpRight, Clock, MoreHorizontal, Calendar,
    Menu, BarChart3, RefreshCw, AlertTriangle, Package,     QrCode, ChefHat, UtensilsCrossed, CreditCard, Percent, ShoppingBag
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [timeRange, setTimeRange] = useState('Today'); // 'Today', 'Week', 'Month'
    const [showItemsMenu, setShowItemsMenu] = useState(false);
    const itemsMenuRef = useRef(null);

    // Placeholder Data for Charts
    const [peakHoursData, setPeakHoursData] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [notifications, setNotifications] = useState([]);


    // Chart Data State
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (itemsMenuRef.current && !itemsMenuRef.current.contains(event.target)) {
                setShowItemsMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchDashboardData = async () => {
            const restaurantId = user?.restaurant?._id || user?.restaurant;
            if (!restaurantId) return;

            try {
                setLoading(true);

                const fetchData = async (url, fallback = { data: { success: false } }) => {
                    try {
                        return await api.get(url, { _skipErrorToast: true });
                    } catch (err) {
                        return fallback;
                    }
                };

                const [
                    summaryRes,
                    peakHoursRes,
                    inventoryRes,
                    notificationsRes,
                    topItemsRes
                ] = await Promise.all([
                    fetchData(`/analytics/dashboard/${restaurantId}`),
                    fetchData(`/analytics/peak-hours/${restaurantId}`),
                    fetchData(`/inventory/${restaurantId}`),
                    fetchData(`/analytics/notifications/${restaurantId}`),
                    fetchData(`/analytics/top-items/${restaurantId}?limit=5`)
                ]);

                // 1. Summary & Trends
                if (summaryRes.data.success) {
                    setAnalytics({
                        ...summaryRes.data.data,
                        topItems: topItemsRes.data.success ? topItemsRes.data.data : []
                    });
                }

                // 2. Peak Hours Chart
                let formattedPeakHours = [];
                const hourly = peakHoursRes.data.success ? (peakHoursRes.data.data.hourlyBreakdown || []) : [];

                if (hourly.length > 0) {
                    formattedPeakHours = hourly.map(h => ({
                        name: h._id > 12 ? `${h._id - 12}pm` : h._id === 12 ? '12pm' : h._id === 0 ? '12am' : `${h._id}am`,
                        orders: h.orderCount,
                        revenue: h.totalRevenue
                    })).sort((a, b) => 0);
                } else {
                    // Default Skeleton Data (11am - 10pm)
                    formattedPeakHours = Array.from({ length: 12 }, (_, i) => {
                        const hour = i + 11;
                        return {
                            name: hour > 12 ? `${hour - 12}pm` : hour === 12 ? '12pm' : hour === 24 ? '12am' : `${hour}am`,
                            orders: 0,
                            revenue: 0
                        };
                    });
                }
                setPeakHoursData(formattedPeakHours);

                // Set initial chart data (Today)
                if (timeRange === 'Today') {
                    setChartData(formattedPeakHours.map(d => ({ name: d.name, sales: d.revenue })));
                }

                // 3. Low Stock Items
                if (inventoryRes.data.success) {
                    const lowStock = inventoryRes.data.data
                        .filter(item => item.isLowStock || item.stockQuantity <= 5)
                        .slice(0, 3)
                        .map(item => ({
                            name: item.name,
                            stock: item.stockQuantity,
                            unit: 'units',
                            status: item.stockQuantity === 0 ? 'critical' : 'low'
                        }));
                    setLowStockItems(lowStock);
                }

                // 4. Notifications
                if (notificationsRes.data.success) {
                    setNotifications(notificationsRes.data.data);
                }

            } catch (error) {
                console.error('Critical dashboard error:', error);
                toast.error('Could not load some dashboard metrics');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user, navigate]);

    // Chart Data Effect
    useEffect(() => {
        const fetchChartData = async () => {
            const restaurantId = user?.restaurant?._id || user?.restaurant;
            if (!restaurantId || timeRange === 'Today') {
                // Re-apply peak hours data to chartData if switching back to Today
                // This ensures the chart updates when switching from Week -> Today
                if (timeRange === 'Today' && peakHoursData.length > 0) {
                    setChartData(peakHoursData.map(d => ({ name: d.name, sales: d.revenue })));
                }
                return;
            }

            try {
                // Fetch historical data
                const startDate = new Date();
                let daysToGenerate = 7;

                if (timeRange === 'Week') {
                    startDate.setDate(startDate.getDate() - 7);
                    daysToGenerate = 7;
                }
                if (timeRange === 'Month') {
                    startDate.setMonth(startDate.getMonth() - 1);
                    daysToGenerate = 14;
                }

                const res = await api.get(`/analytics/orders/${restaurantId}?startDate=${startDate.toISOString()}&groupBy=day`);

                let formatted = [];
                if (res.data.success && res.data.data.length > 0) {
                    formatted = res.data.data.map(item => ({
                        name: new Date(item._id).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
                        sales: item.totalRevenue
                    }));
                } else {
                    // Generate empty data for graph skeleton
                    formatted = Array.from({ length: daysToGenerate }, (_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - (daysToGenerate - 1 - i));
                        return {
                            name: d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
                            sales: 0
                        };
                    });
                }
                setChartData(formatted);
            } catch (error) {
                console.error("Error fetching chart data", error);
            }
        };

        fetchChartData();
    }, [timeRange, user, peakHoursData]);

    const handleRefresh = async () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1000)),
            {
                loading: 'Refreshing data...',
                success: 'Dashboard updated',
                error: 'Could not refresh',
            }
        );
    };

    const stats = [
        {
            title: "Total Revenue",
            value: loading ? "..." : (analytics ? `₹${analytics.today.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "₹0.00"),
            trend: loading ? "..." : (analytics?.trends?.revenue || "0%"),
            positive: parseFloat(analytics?.trends?.revenue || 0) >= 0,
            icon: DollarSign,
            color: "text-green-500",
            bg: "bg-green-500/10"
        },
        {
            title: "Total Orders",
            value: loading ? "..." : (analytics ? analytics.today.orders : "0"),
            trend: loading ? "..." : (analytics?.trends?.orders || "0%"),
            positive: parseFloat(analytics?.trends?.orders || 0) >= 0,
            icon: ShoppingCart,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        {
            title: "Live Guests",
            value: loading ? "..." : (analytics?.active?.guests || "0"),
            trend: loading ? "..." : (analytics?.trends?.guests || "0%"), // Guests trend
            positive: parseFloat(analytics?.trends?.guests || 0) >= 0,
            icon: Users,
            color: "text-orange-500",
            bg: "bg-orange-500/10"
        },
        {
            title: "Avg. Prep Time",
            value: loading ? "..." : (analytics?.performance?.avgPrepTime ? `${analytics.performance.avgPrepTime}m` : "0m"),
            trend: loading ? "..." : (analytics?.trends?.prepTime || "0%"),
            positive: parseFloat(analytics?.trends?.prepTime || 0) <= 0, // Lower prep time is better (positive result)
            icon: Clock,
            color: "text-purple-500",
            bg: "bg-purple-500/10"
        },
    ];

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
                    {/* Welcome Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-8 gap-3 sm:gap-4">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-1">
                                Dashboard
                            </h1>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                Overview for <span className="text-foreground font-semibold">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </p>
                        </motion.div>

                        <div className="flex gap-1.5 sm:gap-2 flex-wrap">

                            <button onClick={handleRefresh} className="btn-outline gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm hover:bg-primary/5">
                                <RefreshCw size={14} className="hidden sm:inline" />
                                <RefreshCw size={12} className="sm:hidden" />
                                <span>Refresh</span>
                            </button>
                            <button onClick={() => navigate('/analytics')} className="btn-primary gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm shadow-lg shadow-primary/20">
                                <TrendingUp size={14} className="hidden sm:inline" />
                                <TrendingUp size={12} className="sm:hidden" />
                                <span>Reports</span>
                            </button>
                        </div>
                    </div>

                    {/* KPI Stats Grid - "Coursera Style" Horizontal Scroll on Mobile */}
                    <div className="flex overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 snap-x snap-mandatory carousel-scrollbar touch-pan-x">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-card border border-border/50 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group min-w-[260px] sm:min-w-0 snap-center flex-shrink-0"
                            >
                                <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <stat.icon size={48} className={`${stat.color} sm:w-16 sm:h-16`} />
                                </div>
                                <div className="flex justify-between items-start mb-2 sm:mb-3 relative z-10">
                                    <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl ${stat.bg} ${stat.color}`}>
                                        <stat.icon size={18} className="sm:w-5 sm:h-5" />
                                    </div>
                                    <div className={`flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${stat.positive ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                                        {stat.positive ? <TrendingUp size={10} className="sm:w-3 sm:h-3" /> : <TrendingUp size={10} className="rotate-180 sm:w-3 sm:h-3" />}
                                        <span className="hidden xs:inline">{stat.trend}</span>
                                    </div>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-1 tracking-tight relative z-10">{stat.value}</h3>
                                <p className="text-sm text-muted-foreground font-medium relative z-10">{stat.title}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
                        {/* Main Sales Chart */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="lg:col-span-2 bg-card border border-border/50 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-sm flex flex-col"
                        >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                                <div>
                                    <h3 className="text-base sm:text-lg font-bold text-foreground">Revenue Flow</h3>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Live sales tracking</p>
                                </div>
                                <div className="flex gap-0.5 sm:gap-1 bg-muted/30 p-0.5 sm:p-1 rounded-lg w-full sm:w-auto">
                                    {['Today', 'Week', 'Month'].map((period) => (
                                        <button
                                            key={period}
                                            onClick={() => setTimeRange(period)}
                                            className={`flex-1 sm:flex-none px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold rounded-md transition-all ${timeRange === period ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            {period}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="h-[250px] sm:h-[300px] w-full flex-1 min-h-0">
                                {loading ? (
                                    <div className="w-full h-full animate-pulse bg-muted/20 rounded-xl" />
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.8} />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 500 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 500 }}
                                                tickFormatter={(value) => `₹${value}`}
                                            />
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        if (data.isSkeleton) return null;
                                                        return (
                                                            <div className="bg-popover border border-border p-2 rounded-lg shadow-md">
                                                                <p className="text-sm font-semibold text-foreground">{data.name}</p>
                                                                <p className="text-sm text-primary">Sales: ₹{data.sales}</p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="sales"
                                                stroke={chartData[0]?.isSkeleton ? "hsl(var(--muted-foreground)/0.5)" : "hsl(var(--primary))"}
                                                strokeOpacity={1}
                                                fillOpacity={1}
                                                fill={chartData[0]?.isSkeleton ? "hsl(var(--muted)/0.3)" : "url(#colorSales)"}
                                                strokeWidth={3}
                                                strokeDasharray={chartData[0]?.isSkeleton ? "5 5" : "0"}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </motion.div>

                        {/* Side Widgets Column */}
                        <div className="space-y-4 sm:space-y-6">

                            {/* Peak Hours Widget */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-card border border-border/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm"
                            >
                                <div className="mb-3 sm:mb-4">
                                    <h3 className="text-base sm:text-lg font-bold text-foreground">Peak Hours</h3>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">Traffic intensity by hour</p>
                                </div>
                                <div className="h-[180px] sm:h-[200px] w-full relative">
                                    {loading ? (
                                        <div className="flex gap-2 h-full items-end pb-2">
                                            {[...Array(7)].map((_, i) => (
                                                <div key={i} className="flex-1 bg-muted/20 animate-pulse rounded-t-sm" style={{ height: `${Math.random() * 60 + 20}%` }} />
                                            ))}
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={peakHoursData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.8} />
                                                <XAxis
                                                    dataKey="name"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 500 }}
                                                    dy={5}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 500 }}
                                                    width={25}
                                                />
                                                <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                                                    {peakHoursData.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={entry.isSkeleton ? 'hsl(var(--muted))' : (entry.orders > 60 ? 'hsl(var(--primary))' : 'hsl(var(--primary)/0.5)')}
                                                        />
                                                    ))}
                                                </Bar>
                                                <Tooltip
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0].payload;
                                                            if (data.isSkeleton) return null;
                                                            return (
                                                                <div className="bg-popover border border-border p-2 rounded-lg shadow-md">
                                                                    <p className="text-sm font-semibold text-foreground">{data.name}</p>
                                                                    <p className="text-sm text-primary">Orders: {data.orders}</p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                    cursor={{ fill: 'transparent' }}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </motion.div>

                            {/* Low Stock Alerts */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-card border border-border/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm"
                            >
                                <div className="flex justify-between items-center mb-3 sm:mb-4">
                                    <h3 className="text-base sm:text-lg font-bold text-foreground">Low Stock Alerts</h3>
                                    {!loading && lowStockItems.length > 0 && (
                                        <span className="bg-red-500/10 text-red-500 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full animate-pulse">
                                            {lowStockItems.length} Alert{lowStockItems.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-2 sm:space-y-3">
                                    {loading ? (
                                        [...Array(3)].map((_, i) => (
                                            <div key={i} className="flex items-center justify-between p-2 bg-muted/20 rounded-lg animate-pulse">
                                                <div className="flex items-center gap-3 w-full">
                                                    <div className="w-8 h-8 bg-muted/40 rounded-lg" />
                                                    <div className="space-y-2 flex-1">
                                                        <div className="h-3 w-24 bg-muted/40 rounded" />
                                                        <div className="h-2 w-16 bg-muted/40 rounded" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        lowStockItems.length > 0 ? (
                                            lowStockItems.map((item, i) => (
                                                <div key={i} className="flex items-center justify-between p-2 bg-muted/40 rounded-lg gap-2">
                                                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                                        <div className="p-1.5 sm:p-2 bg-red-500/10 text-red-500 rounded-lg flex-shrink-0">
                                                            <AlertTriangle size={12} className="sm:w-3.5 sm:h-3.5" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{item.name}</p>
                                                            <p className="text-[10px] sm:text-xs text-muted-foreground">{item.stock} {item.unit} remaining</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => navigate('/inventory')} className="text-[10px] sm:text-xs font-bold text-primary hover:underline whitespace-nowrap flex-shrink-0">Restock</button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-4 text-sm text-muted-foreground">
                                                All items well stocked
                                            </div>
                                        )
                                    )}
                                </div>
                            </motion.div>

                        </div>
                    </div>

                    {/* Bottom Section: Top Items & Activity */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                        {/* Popular Items */}
                        <div className="bg-card border border-border/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                                <h3 className="text-base sm:text-lg font-bold text-foreground">Top Selling Items</h3>
                                <button onClick={() => navigate('/menu-management')} className="text-xs sm:text-sm text-primary font-medium hover:underline flex items-center gap-1">
                                    View Menu <ArrowUpRight size={12} className="sm:w-3.5 sm:h-3.5" />
                                </button>
                            </div>
                            <div className="space-y-3 sm:space-y-4">
                                {analytics?.topItems?.slice(0, 4).map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 sm:gap-4 group">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-secondary flex items-center justify-center font-bold text-sm sm:text-base text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors flex-shrink-0">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-sm sm:text-base text-foreground truncate">{item.itemName}</h4>
                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                                <div className="h-1 sm:h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary" style={{ width: `${Math.random() * 40 + 60}%` }}></div>
                                                </div>
                                                <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">{item.totalOrdered} orders</span>
                                            </div>
                                        </div>
                                        <span className="font-bold text-sm sm:text-base text-foreground flex-shrink-0">
                                            ₹{parseFloat(item.totalRevenue).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                                {(!analytics?.topItems || analytics.topItems.length === 0) && (
                                    <div className="text-center py-6 text-muted-foreground italic">No sales data today</div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            {[
                                { label: 'Manage Inventory', icon: Package, color: 'text-orange-500', bg: 'bg-orange-500/10', to: '/inventory' },
                                { label: 'Financial Report', icon: BarChart3, color: 'text-green-500', bg: 'bg-green-500/10', to: '/analytics' },
                                { label: 'Live Orders', icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-500/10', to: '/orders' },
                                { label: 'QR Management', icon: QrCode, color: 'text-primary', bg: 'bg-primary/10', to: '/qr-codes' },
                                { label: 'POS Billing', icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-500/10', to: '/admin/pos' },
                                { label: 'Kitchen Display', icon: ChefHat, color: 'text-orange-500', bg: 'bg-orange-500/10', to: '/kitchen' },
                                { label: 'Waiter App', icon: UtensilsCrossed, color: 'text-purple-500', bg: 'bg-purple-500/10', to: '/waiter-app' },
                                { label: 'GST Settings', icon: Percent, color: 'text-cyan-500', bg: 'bg-cyan-500/10', to: '/gst-settings' },
                                { label: 'Customers', icon: Users, color: 'text-pink-500', bg: 'bg-pink-500/10', to: '/customers' },
                                { label: 'Takeaway/Delivery', icon: ShoppingBag, color: 'text-teal-500', bg: 'bg-teal-500/10', to: '/takeaway' },
                            ].map((action, i) => (
                                <button
                                    key={i}
                                    onClick={() => navigate(action.to)}
                                    className="flex flex-col items-center justify-center p-4 sm:p-6 bg-card border border-border/50 rounded-xl sm:rounded-2xl hover:bg-muted/50 transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[120px] sm:min-h-[160px] cursor-pointer shadow-lg shadow-black/5"
                                >
                                    <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full ${action.bg} flex items-center justify-center mb-2 sm:mb-4`}>
                                        <action.icon size={20} className={`${action.color} sm:w-7 sm:h-7`} />
                                    </div>
                                    <span className="font-bold text-foreground text-[10px] sm:text-xs uppercase tracking-widest text-center leading-tight px-2">{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
};

export default Dashboard;
