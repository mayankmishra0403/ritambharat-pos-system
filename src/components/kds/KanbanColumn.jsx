import { motion, AnimatePresence } from 'framer-motion';
import OrderCard from './OrderCard';

const KanbanColumn = ({ title, icon: Icon, color, bgColor, orders, nextStatus, onUpdateStatus }) => {
    return (
        <div className="flex-1 flex flex-col min-h-[300px] sm:min-h-0 sm:min-w-[260px] lg:min-w-0">
            <div className={`flex items-center gap-2 p-3 rounded-t-xl font-bold border-b transition-colors bg-card border-border ${color}`}>
                <div className={`p-1.5 rounded-lg ${bgColor}`}>
                    <Icon size={18} />
                </div>
                {title}
                <span className="ml-auto bg-muted px-2 py-0.5 rounded text-xs text-foreground font-mono">
                    {orders.length}
                </span>
            </div>

            <div className="flex-1 bg-muted/30 rounded-b-xl p-2 border-x border-b border-border flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto snap-x snap-mandatory sm:snap-none custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {orders.map(order => (
                        <OrderCard
                            key={order._id}
                            order={order}
                            nextStatus={nextStatus}
                            onUpdateStatus={onUpdateStatus}
                        />
                    ))}
                </AnimatePresence>
                {orders.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 min-w-full text-muted-foreground/50 gap-2">
                        <Icon size={24} className="opacity-20" />
                        <span className="text-xs font-medium">No orders</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KanbanColumn;
