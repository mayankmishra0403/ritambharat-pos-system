import { useState, useRef, useEffect } from 'react';
import { Maximize2, Minimize2, Volume2, VolumeX, Bell, LogOut, ArrowLeftFromLine, X } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';

const NotificationDropdown = ({ notifications, onMarkAllRead, onClose }) => (
    <div className="absolute top-full right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-2xl shadow-black/20 z-50 overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-border">
            <span className="text-sm font-bold">Notifications</span>
            <div className="flex items-center gap-1">
                <button onClick={onMarkAllRead} className="text-[10px] font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded-lg transition-colors">
                    Mark all read
                </button>
                <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
                    <X size={14} />
                </button>
            </div>
        </div>
        <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No notifications</div>
            ) : (
                notifications.slice(0, 20).map(n => (
                    <div key={n._id} className={`p-3 border-b border-border/50 text-sm flex items-start gap-3 ${!n.isRead ? 'bg-primary/5' : ''}`}>
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.isRead ? 'bg-primary' : 'bg-transparent'}`} />
                        <div>
                            <p className="text-foreground font-medium">{n.message}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
);

const KitchenHeader = ({
    fullscreen,
    onToggleFullscreen,
    soundEnabled,
    onToggleSound,
    stats,
    notifications,
    onMarkAllRead,
    onLogout,
    showBackButton,
    onBackToPanel
}) => {
    const { connected } = useSocket();
    const [showNotifications, setShowNotifications] = useState(false);
    const notifRef = useRef(null);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        const handleClick = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleMarkAllRead = () => {
        onMarkAllRead();
        setShowNotifications(false);
    };

    return (
        <div className="bg-card border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
                <div>
                    <h1 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                        Kitchen Display System
                        {connected ? (
                            <span className="flex items-center gap-1 bg-green-500/10 text-green-500 text-[10px] px-2 py-0.5 rounded-full border border-green-500/20">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                LIVE
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 bg-red-500/10 text-red-500 text-[10px] px-2 py-0.5 rounded-full border border-red-500/20">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                OFFLINE
                            </span>
                        )}
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <span className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Active: <strong className="text-foreground">{stats.active}</strong></span>
                    <span>Urgent: <strong className="text-red-500">{stats.urgent}</strong></span>
                    <span>Ready: <strong className="text-green-500">{stats.ready}</strong></span>
                </span>

                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground relative"
                        title="Notifications"
                    >
                        <Bell size={18} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    {showNotifications && (
                        <NotificationDropdown
                            notifications={notifications}
                            onMarkAllRead={handleMarkAllRead}
                            onClose={() => setShowNotifications(false)}
                        />
                    )}
                </div>

                <button
                    onClick={onToggleSound}
                    className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                    title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
                >
                    {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>

                <button
                    onClick={onToggleFullscreen}
                    className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                    title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                    {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>

                {showBackButton && (
                    <button
                        onClick={onBackToPanel}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-foreground/10 text-foreground rounded-lg hover:bg-foreground/20 transition-colors"
                        title="Back to Panel"
                    >
                        <ArrowLeftFromLine size={14} />
                        Back to Panel
                    </button>
                )}
                <button
                    onClick={onLogout}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-500"
                    title="Logout"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </div>
    );
};

export default KitchenHeader;
