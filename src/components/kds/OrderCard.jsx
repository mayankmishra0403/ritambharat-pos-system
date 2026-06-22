import { motion } from 'framer-motion';
import { AlertCircle, XCircle, ChefHat, ArrowRight } from 'lucide-react';
import OrderTimer from './OrderTimer';
import { useSocket } from '../../hooks/useSocket';

const OrderCard = ({ order, nextStatus, onUpdateStatus }) => {
    const { socket } = useSocket();
    const created = new Date(order.createdAt).getTime();
    const now = Date.now();
    const elapsedMins = Math.floor((now - created) / 60000);
    const isUrgent = elapsedMins >= 15;
    const isNew = elapsedMins < 1;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`
                bg-card rounded-2xl p-5 shadow-xl border-4 transition-all duration-300 relative overflow-hidden group
                min-w-[300px] sm:min-w-0 snap-center flex-shrink-0
                ${isUrgent
                    ? 'border-red-500 bg-red-500/5 shadow-[0_0_20px_-5px_rgba(239,68,68,0.4)]'
                    : isNew
                        ? 'border-primary shadow-2xl shadow-primary/20 ring-8 ring-primary/10'
                        : 'border-border/80 hover:border-primary/50'
                }
            `}
        >
            {isNew && (
                <div className="absolute top-0 right-0 z-10">
                    <div className="bg-primary text-primary-foreground text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-sm animate-bounce mt-2 mr-2">
                        NEW
                    </div>
                </div>
            )}

            <div className="flex items-start justify-between mb-3">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-black text-foreground">
                            #{order.orderNumber}
                        </span>
                        {order.table && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase">
                                T{order.table?.name || order.table}
                            </span>
                        )}
                        {order.customerName && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                {order.customerName}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                <OrderTimer
                    createdAt={order.createdAt}
                    preparationTime={order.preparationTime || 0}
                />
            </div>

            {isUrgent && (
                <div className="mb-3 flex items-center gap-2 p-2 bg-red-500/10 rounded-lg text-xs font-black text-red-500 border border-red-500/20">
                    <AlertCircle size={14} className="animate-pulse" />
                    URGENT - OVER 15 MINUTES
                </div>
            )}

            <div className="space-y-2 mb-4">
                {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 group/item">
                        <span className="bg-foreground text-background w-6 h-6 flex items-center justify-center rounded text-xs font-black font-mono shadow-sm">
                            {item.quantity}
                        </span>
                        <span className="text-sm font-bold text-foreground/90 truncate leading-tight">
                            {item.name}
                        </span>
                        {item.specialInstructions && (
                            <span className="text-[9px] text-yellow-500 font-medium truncate ml-auto italic">
                                {item.specialInstructions}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    {order.orderSource && (
                        <span className="text-[9px] font-bold uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {order.orderSource}
                        </span>
                    )}
                    <span className="text-[9px] font-bold uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {order.items?.length || 0} items
                    </span>
                </div>

                <div className="flex gap-2">
                    {nextStatus && (
                        <button
                            onClick={() => onUpdateStatus({ id: order._id, status: nextStatus })}
                            className={`
                                flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all active:scale-95 font-black text-xs uppercase tracking-widest
                                ${nextStatus === 'SERVED'
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/40'
                                    : nextStatus === 'CANCELLED'
                                        ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                        : 'bg-foreground text-background hover:bg-foreground/90'
                                }
                            `}
                        >
                            {nextStatus === 'SERVED' ? 'Serve' : nextStatus === 'CANCELLED' ? 'Cancel' : nextStatus}
                            {nextStatus !== 'CANCELLED' && <ArrowRight size={14} />}
                        </button>
                    )}

                    <button
                        onClick={() => onUpdateStatus({ id: order._id, status: 'CANCELLED' })}
                        className="p-2.5 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors border border-transparent hover:border-red-500/20"
                        title="Cancel Order"
                    >
                        <XCircle size={18} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default OrderCard;
