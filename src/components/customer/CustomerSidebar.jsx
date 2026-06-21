import { motion, AnimatePresence } from 'framer-motion';
import { X, Utensils, ClipboardList, Star, AlertCircle, Bell, LogOut, ChevronRight, Receipt, Users, Download } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const CustomerSidebar = ({ isOpen, onClose, restaurant, tableId }) => {
    const location = useLocation();

    const menuLink = `/menu/${restaurant._id}${tableId ? `?table=${tableId}` : ''}`;

    const trackingLink = `/menu/${restaurant._id}/order-tracking${tableId ? `?table=${tableId}` : ''}`;

    const billLink = `/menu/${restaurant._id}/bill${tableId ? `?table=${tableId}` : ''}`;

    const links = [
        { name: 'Menu', icon: Utensils, path: menuLink },
        { name: 'Track Order', icon: ClipboardList, path: trackingLink },
        { name: 'Your Bill', icon: Receipt, path: billLink },
        ...(restaurant?.features?.reviewsEnabled ? [
            { name: 'Reviews', icon: Star, path: `/reviews?restaurant=${restaurant?._id}` }
        ] : []),
        ...(restaurant?.features?.allowStaffReviews ? [
            { name: 'Rate Staff', icon: Users, path: `/menu/${restaurant?._id}/rate-staff` }
        ] : []),
        { name: 'Report Issue', icon: AlertCircle, path: `/complaints?restaurant=${restaurant?._id}${tableId ? `&table=${tableId}` : ''}` },
    ];

    const sidebarVariants = {
        closed: {
            x: "-100%",
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 40
            }
        },
        open: {
            x: "0%",
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 40
            }
        }
    };

    const overlayVariants = {
        closed: { opacity: 0 },
        open: { opacity: 1 }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={overlayVariants}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Sidebar Drawer */}
                    <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={sidebarVariants}
                        className="fixed top-0 left-0 bottom-0 w-[80%] max-w-xs z-50 bg-[#1a1a1a] border-r border-white/10 shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <div>
                                <h2 className="font-bold text-xl text-white">{restaurant?.name}</h2>
                                {tableId && (
                                    <span className="text-xs text-primary font-medium tracking-wide uppercase">Table Attached</span>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Navigation Links */}
                        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                            {links.map((link) => {
                                // Improved active check to handle query params and sub-paths
                                const currentPath = location.pathname;
                                const linkPath = link.path.split('?')[0];
                                const isActive = currentPath === linkPath || (linkPath !== '/' && currentPath.startsWith(linkPath));
                                return (
                                    <Link
                                        key={link.name}
                                        to={link.path}
                                        onClick={onClose}
                                        className={`flex items-center gap-4 p-4 rounded-xl transition-all ${isActive
                                            ? 'bg-primary text-black font-bold shadow-lg shadow-primary/20'
                                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <link.icon size={22} className={isActive ? 'text-black' : 'text-gray-500'} />
                                        <span className="flex-1">{link.name}</span>
                                        {!isActive && <ChevronRight size={16} className="text-gray-600" />}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Footer / Info */}
                        <div className="p-6 border-t border-white/10 mt-auto space-y-4">
                            <button
                                onClick={() => {
                                    onClose();
                                    // Trigger window click to help some mobile browsers
                                    window.dispatchEvent(new Event('beforeinstallprompt'));
                                }}
                                className="w-full flex items-center gap-4 p-4 text-gray-400 hover:text-primary hover:bg-white/5 transition-all rounded-xl border border-white/5"
                            >
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                    <Download size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm text-white">Download App</p>
                                    <p className="text-[10px] text-gray-500 font-medium tracking-tight">Use Ritam Bharat POS offline</p>
                                </div>
                            </button>

                            <div className="bg-white/5 rounded-xl p-4 text-center">
                                <p className="text-gray-500 text-xs mb-1">Powered by</p>
                                <h3 className="font-bold text-white tracking-widest text-lg uppercase">Ritam Bharat POS</h3>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CustomerSidebar;
