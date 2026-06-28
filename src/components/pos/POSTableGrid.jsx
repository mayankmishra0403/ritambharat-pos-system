import { motion } from 'framer-motion';
import { Users, CookingPot } from 'lucide-react';

const STATUS_COLORS = {
    FREE: { bg: 'bg-green-500/10 border-green-500/30', text: 'text-green-500', dot: 'bg-green-500', label: 'Free' },
    OCCUPIED: { bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-500', dot: 'bg-red-500', label: 'Occupied' },
    RESERVED: { bg: 'bg-yellow-500/10 border-yellow-500/30', text: 'text-yellow-500', dot: 'bg-yellow-500', label: 'Reserved' },
    CLEANING: { bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-500', dot: 'bg-blue-500', label: 'Cleaning' }
};

const POSTableGrid = ({ tables, selectedTableId, onSelectTable, activeOrders }) => {
    const getTableOrderCount = (tableId) => {
        return activeOrders?.filter(o =>
            o.table?._id === tableId || o.table === tableId
        ).length || 0;
    };

    if (!tables || tables.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
                <Users size={24} className="opacity-20" />
                <span className="text-xs font-medium">No tables</span>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-2">
            {tables.map((table) => {
                const colors = STATUS_COLORS[table.status] || STATUS_COLORS.FREE;
                const orderCount = getTableOrderCount(table._id);
                const isMerged = table.currentSession?.mergedInto;
                const isSelected = selectedTableId === table._id;
                const waiterName = table.currentSession?.waiterId?.name;

                return (
                    <motion.button
                        key={table._id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSelectTable(table)}
                        className={`
                            relative p-3 rounded-xl border-2 text-left transition-all
                            ${colors.bg}
                            ${isSelected
                                ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg'
                                : 'hover:shadow-md'
                            }
                            ${isMerged ? 'opacity-60' : ''}
                        `}
                    >
                        {isMerged && (
                            <span className="absolute top-1 right-1 text-[8px] font-bold px-1 py-0.5 rounded bg-yellow-500/20 text-yellow-500">
                                MERGED
                            </span>
                        )}
                        <span className="text-sm font-bold text-foreground block">{table.name}</span>
                        <span className="text-[10px] font-medium text-muted-foreground">{table.capacity} seats</span>
                        {orderCount > 0 && (
                            <div className="flex items-center gap-1 mt-1.5">
                                <CookingPot size={10} className="text-orange-500" />
                                <span className="text-[10px] font-bold text-orange-500">{orderCount} active</span>
                            </div>
                        )}
                        {waiterName && (
                            <div className="flex items-center gap-1 mt-1">
                                <Users size={8} className="text-primary" />
                                <span className="text-[8px] font-bold text-primary uppercase tracking-wider">{waiterName}</span>
                            </div>
                        )}
                        <div className={`absolute bottom-2 right-2 w-2 h-2 rounded-full ${colors.dot} shadow-sm`} />
                    </motion.button>
                );
            })}
        </div>
    );
};

export default POSTableGrid;
