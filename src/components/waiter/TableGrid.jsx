import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

const statusColors = {
    FREE: { bg: 'bg-green-500/10', border: 'border-green-500', text: 'text-green-500', label: 'Free' },
    OCCUPIED: { bg: 'bg-red-500/10', border: 'border-red-500', text: 'text-red-500', label: 'Occupied' },
    RESERVED: { bg: 'bg-yellow-500/10', border: 'border-yellow-500', text: 'text-yellow-500', label: 'Reserved' },
    CLEANING: { bg: 'bg-blue-500/10', border: 'border-blue-500', text: 'text-blue-500', label: 'Cleaning' }
};

const TableGrid = ({ tables, onSelectTable, selectedTableId }) => {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {tables.map(table => {
                const colors = statusColors[table.status] || statusColors.FREE;

                return (
                    <motion.button
                        key={table._id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSelectTable(table)}
                        className={`
                            relative p-4 rounded-xl border-2 transition-all text-center
                            ${colors.bg} ${colors.border}
                            ${selectedTableId === table._id ? 'ring-2 ring-primary shadow-lg' : ''}
                            hover:shadow-md
                        `}
                    >
                        <span className={`text-lg font-black ${colors.text}`}>
                            {table.name}
                        </span>
                        <div className="flex items-center justify-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Users size={12} />
                            {table.capacity}
                        </div>
                        <span className={`block mt-1 text-[9px] font-bold uppercase tracking-wider ${colors.text}`}>
                            {colors.label}
                        </span>
                    </motion.button>
                );
            })}
        </div>
    );
};

export default TableGrid;
