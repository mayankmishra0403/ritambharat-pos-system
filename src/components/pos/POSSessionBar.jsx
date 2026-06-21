import { Clock, Circle, LogOut } from 'lucide-react';

const POSSessionBar = ({ session, onOpen, onClose }) => {
    if (!session) {
        return (
            <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Circle size={10} className="text-red-500" />
                    <span className="text-sm font-bold text-muted-foreground">No Active Session</span>
                </div>
                <button
                    onClick={onOpen}
                    className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors"
                >
                    Open Session
                </button>
            </div>
        );
    }

    const elapsed = Math.floor((Date.now() - new Date(session.openedAt).getTime()) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const mins = Math.floor((elapsed % 3600) / 60);

    return (
        <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Circle size={10} className="text-green-500 animate-pulse" />
                <div>
                    <span className="text-sm font-bold text-foreground">Session Open</span>
                    <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock size={10} />
                            {hours}h {mins.toString().padStart(2, '0')}m
                        </span>
                        <span className="text-[10px] text-muted-foreground">Sales: ₹{session.totalSales?.toFixed(2) || '0.00'}</span>
                        <span className="text-[10px] text-muted-foreground">Orders: {session.orderCount || 0}</span>
                    </div>
                </div>
            </div>
            <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-500 text-xs font-bold rounded-lg hover:bg-red-500/20 transition-colors"
            >
                <LogOut size={12} />
                Close
            </button>
        </div>
    );
};

export default POSSessionBar;
