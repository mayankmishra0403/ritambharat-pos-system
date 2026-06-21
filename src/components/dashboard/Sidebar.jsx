import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Store, Table, Menu as MenuIcon, ShoppingCart,
    BarChart3, Star, LogOut, Bell, Calendar,
    MessageSquare, Settings, ChevronLeft, ChevronRight,
    UtensilsCrossed,     Pin, PinOff, Users, QrCode,
    DollarSign, ChefHat, FileText, Percent, UserCheck, ShoppingBag
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { useState } from 'react';
import Logo from '../common/Logo';

const Sidebar = ({ className, open, onClose }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isPinned, setIsPinned] = useState(() => {
        return localStorage.getItem('sidebarPinned') === 'true';
    });
    const [collapsed, setCollapsed] = useState(!isPinned);

    const togglePin = () => {
        const newState = !isPinned;
        setIsPinned(newState);
        localStorage.setItem('sidebarPinned', newState);
        if (newState) setCollapsed(false);
    };

    const handleMouseEnter = () => {
        if (window.innerWidth >= 1024 && !isPinned) {
            setCollapsed(false);
        }
    };

    const handleMouseLeave = () => {
        if (window.innerWidth >= 1024 && !isPinned) {
            setCollapsed(true);
        }
    };

    const allMenuItems = [
        { label: 'Overview', icon: LayoutDashboard, link: '/dashboard', permission: 'dashboard' },
        { label: 'Live Orders', icon: ShoppingCart, link: '/orders', permission: 'orders' },
        { label: 'POS Billing', icon: DollarSign, link: '/admin/pos', permission: 'revenue' },
        { label: 'Kitchen Display', icon: ChefHat, link: '/kitchen', permission: 'orders' },
        { label: 'Waiter App', icon: UtensilsCrossed, link: '/waiter-app', permission: 'orders' },
        { label: 'Takeaway', icon: ShoppingBag, link: '/takeaway', permission: 'orders' },
        { label: 'Billing', icon: FileText, link: '/billing', permission: 'revenue' },
        { label: 'Menu Management', icon: MenuIcon, link: '/menu-management', permission: 'menu' },
        { label: 'Table Management', icon: Table, link: '/tables', permission: 'tables' },
        { label: 'Inventory', icon: Store, link: '/inventory', permission: 'inventory' },
        { label: 'QR Management', icon: QrCode, link: '/qr-codes', permission: 'qr-codes' },
        { label: 'Analytics', icon: BarChart3, link: '/analytics', permission: 'analytics' },
        { label: 'Staff Management', icon: Users, link: '/staff-management', permission: 'staff' },
        { label: 'Customers', icon: UserCheck, link: '/customers', permission: 'dashboard' },
        { label: 'Reviews', icon: Star, link: '/admin/reviews', permission: 'reviews' },
        { label: 'Complaints', icon: MessageSquare, link: '/admin/complaints', permission: 'complaints' },
        { label: 'Invoice Settings', icon: FileText, link: '/invoice-settings', permission: 'settings' },
        { label: 'Settings', icon: Settings, link: '/settings', permission: 'settings' },
        { label: 'GST Settings', icon: Percent, link: '/gst-settings', permission: 'menu' },
    ];

    const menuItems = allMenuItems.filter(item => {
        if (user?.role === 'OWNER' || user?.role === 'ADMIN') return true;
        return user?.permissions?.includes(item.permission);
    });

    const variants = {
        desktop: {
            width: (collapsed && !isPinned) ? 80 : 280,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 30
            }
        },
        mobileOpen: {
            x: 0,
            width: 280,
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 40
            }
        },
        mobileClosed: {
            x: "-100%",
            width: 280,
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 40
            }
        }
    };

    return (
        <motion.div
            initial={false}
            animate={window.innerWidth >= 1024 ? "desktop" : (open ? "mobileOpen" : "mobileClosed")}
            variants={variants}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={cn(
                "flex flex-col h-screen sticky top-0 border-r border-border/40 bg-background/80 backdrop-blur-xl z-50 shadow-xl shadow-black/5",
                "fixed lg:sticky inset-y-0 left-0",
                className
            )}
        >
            {/* Logo Section */}
            <div className="h-20 flex items-center px-6 relative justify-between">
                <Link to={user?.role === 'OWNER' || user?.role === 'ADMIN' ? '/dashboard' : (user?.permissions?.includes('orders') ? '/orders' : '/dashboard')}>
                    <Logo iconOnly={collapsed && !isPinned} className={(collapsed && !isPinned) ? "w-10 h-10" : "w-auto h-10"} />
                </Link>

                {/* Mobile Close Button */}
                <button
                    onClick={onClose}
                    className="lg:hidden p-2 hover:bg-muted rounded-xl transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>

                {/* Sidebar Pin/Unpin Toggle (Desktop Only) */}
                <button
                    onClick={togglePin}
                    className={cn(
                        "hidden lg:flex p-2 rounded-xl transition-all duration-300 bg-background border border-border shadow-sm active:scale-95",
                        isPinned
                            ? "relative"
                            : "absolute -right-3 top-36 transition-opacity"
                    )}
                >
                    {isPinned ? <Pin size={18} fill="currentColor" className="text-primary" /> : <Pin size={18} />}
                </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto custom-scrollbar py-6 px-3 space-y-1">
                {menuItems.map((item, index) => {
                    const isActive = location.pathname === item.link;
                    const isCollapsedOnDesktop = collapsed && !isPinned && window.innerWidth >= 1024;

                    return (
                        <Link to={item.link} key={index} onClick={() => window.innerWidth < 1024 && onClose?.()}>
                            <div
                                className={cn(
                                    "relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group overflow-hidden",
                                    isActive
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-50"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}

                                <item.icon
                                    size={20}
                                    className={cn(
                                        "shrink-0 transition-colors",
                                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                    )}
                                />

                                <AnimatePresence mode="wait">
                                    {!isCollapsedOnDesktop && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="truncate whitespace-nowrap"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>

                                {isActive && !isCollapsedOnDesktop && (
                                    <motion.div
                                        layoutId="activeIndicator"
                                        className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(250,144,0,0.8)]"
                                    />
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Logout Section */}
            <div className="p-4 border-t border-border/40">
                <button
                    onClick={logout}
                    className={cn(
                        "flex items-center gap-3 w-full px-3 py-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all group overflow-hidden",
                        (collapsed && !isPinned) && window.innerWidth >= 1024 && "justify-center"
                    )}
                >
                    <LogOut size={20} className="shrink-0 transition-transform group-hover:rotate-12" />
                    <AnimatePresence mode="wait">
                        {!((collapsed && !isPinned) && window.innerWidth >= 1024) && (
                            <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                className="font-medium truncate"
                            >
                                Sign Out
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>
        </motion.div>
    );
};

export default Sidebar;
