import { useState, useEffect } from 'react';

const OrderTimer = ({ createdAt, preparationTime = 0 }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const created = new Date(createdAt).getTime();

        const tick = () => {
            setElapsed(Math.floor((Date.now() - created) / 1000));
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [createdAt]);

    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const display = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    let colorClass = 'text-green-500';
    if (mins >= 15) colorClass = 'text-red-500 animate-pulse';
    else if (mins >= 10) colorClass = 'text-red-500';
    else if (mins >= 5) colorClass = 'text-yellow-500';

    let urgency = 'normal';
    if (mins >= 15) urgency = 'critical';
    else if (mins >= 10) urgency = 'warning';
    else if (mins >= 5) urgency = 'attention';

    const estimatedTotal = preparationTime * 60;
    const progress = estimatedTotal > 0 ? Math.min((elapsed / estimatedTotal) * 100, 100) : 0;

    return (
        <div className="flex flex-col items-end gap-1">
            <div className={`font-mono text-lg font-black tracking-wider ${colorClass}`}>
                {display}
            </div>
            {preparationTime > 0 && (
                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                            progress > 90 ? 'bg-red-500' : progress > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
            {urgency === 'critical' && (
                <span className="text-[8px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-1.5 py-0.5 rounded">
                    OVERDUE
                </span>
            )}
        </div>
    );
};

export default OrderTimer;
