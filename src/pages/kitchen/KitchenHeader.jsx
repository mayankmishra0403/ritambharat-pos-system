import { Maximize2, Minimize2, Volume2, VolumeX, Bell, LogOut, ArrowLeftFromLine } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';

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
    const unreadCount = notifications.filter(n => !n.isRead).length;

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

                <div className="relative">
                    <button
                        onClick={onMarkAllRead}
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
