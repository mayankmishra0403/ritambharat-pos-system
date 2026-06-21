import { useState, useEffect } from 'react';
import { Bell, Menu, Moon, Sun, Laptop } from 'lucide-react';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const Header = ({ onMobileMenuClick }) => {
    const { user } = useAuth();
    const { theme, setTheme } = useTheme();

    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [lastReadTime, setLastReadTime] = useState(() => {
        return parseInt(localStorage.getItem('ritam_bharat_pos_notifications_last_read') || '0');
    });

    const handleMarkAllRead = () => {
        const now = Date.now();
        setLastReadTime(now);
        localStorage.setItem('ritam_bharat_pos_notifications_last_read', now.toString());
    };

    const processedNotifications = notifications.map(n => ({
        ...n,
        unread: new Date(n.time).getTime() > lastReadTime
    }));

    const hasUnread = processedNotifications.some(n => n.unread);

    const [showThemeMenu, setShowThemeMenu] = useState(false);

    // Fetch Notifications
    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user?.restaurant) return;
            const restaurantId = user.restaurant._id || user.restaurant;
            try {
                const response = await api.get(`/analytics/notifications/${restaurantId}`);
                if (response.data.success) {
                    setNotifications(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching notifications:", error);
            }
        };

        if (user?.restaurant) {
            fetchNotifications();
            // Poll every minute
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [user]);

    // Click Outside to Close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showNotifications && !event.target.closest('.notifications-container')) {
                setShowNotifications(false);
            }
            if (showThemeMenu && !event.target.closest('.theme-menu-container')) {
                setShowThemeMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showNotifications, showThemeMenu]);

    return (
        <header className="h-20 flex items-center justify-between px-6 lg:px-8 border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-40 transition-colors duration-300">
            {/* Mobile Menu */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMobileMenuClick}
                    className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Actions & Profile */}
            <div className="flex items-center gap-4">
                {/* Theme Toggle */}
                <div className="relative theme-menu-container">
                    <button
                        onClick={() => setShowThemeMenu(!showThemeMenu)}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors relative rounded-full hover:bg-muted/50"
                    >
                        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute top-2 left-2 h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </button>

                    <AnimatePresence>
                        {showThemeMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 top-full mt-2 w-36 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-50"
                            >
                                <div className="p-1">
                                    {[
                                        { name: 'light', icon: Sun, label: 'Light' },
                                        { name: 'dark', icon: Moon, label: 'Dark' },
                                        { name: 'system', icon: Laptop, label: 'System' },
                                    ].map((t) => (
                                        <button
                                            key={t.name}
                                            onClick={() => { setTheme(t.name); setShowThemeMenu(false); }}
                                            className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition-colors ${theme === t.name ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                                        >
                                            <t.icon size={14} />
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Notifications */}
                <div className="relative notifications-container">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors relative rounded-full hover:bg-muted/50"
                    >
                        <Bell size={20} />
                        {hasUnread && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                        )}
                    </button>

                    <AnimatePresence>
                        {showNotifications && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 top-full mt-4 w-80 bg-popover border border-border rounded-2xl shadow-xl overflow-hidden z-50"
                            >
                                <div className="p-4 border-b border-border flex justify-between items-center">
                                    <h4 className="font-semibold text-foreground">Notifications</h4>
                                    <button
                                        onClick={handleMarkAllRead}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        Mark all read
                                    </button>
                                </div>
                                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                    {processedNotifications.length > 0 ? (
                                        processedNotifications.map(n => (
                                            <div key={n.id} className={`p-4 hover:bg-muted/50 transition-colors border-b border-border last:border-0 ${n.unread ? 'bg-primary/5' : ''}`}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-medium text-sm text-foreground">{n.title}</span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{n.message}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-sm text-muted-foreground">No new notifications</div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="w-[1px] h-8 bg-border mx-2 hidden md:block"></div>

                {/* Profile */}
                <div className="flex items-center gap-3 cursor-pointer group">
                    <div className="text-right hidden md:block">
                        <div className="flex items-center gap-2 justify-end">
                            <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{user?.name}</div>
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{user?.role}</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-600 p-[2px] shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
                        <div className="w-full h-full rounded-full bg-background flex items-center justify-center text-foreground font-bold text-sm">
                            {user?.name?.[0]}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
