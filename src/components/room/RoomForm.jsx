import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const RoomForm = ({ room, onSubmit, onClose, loading }) => {
    const [name, setName] = useState(room?.name || '');
    const [description, setDescription] = useState(room?.description || '');
    const [sortOrder, setSortOrder] = useState(room?.sortOrder ?? 0);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({ name: name.trim(), description, sortOrder });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-foreground text-lg">
                        {room ? 'Edit Room' : 'Add Room'}
                    </h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-muted-foreground font-medium block mb-1">Name *</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Main Hall, VIP Room, Garden"
                            className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground font-medium block mb-1">Description</label>
                        <input
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Optional description"
                            className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground font-medium block mb-1">Sort Order</label>
                        <input
                            type="number"
                            value={sortOrder}
                            onChange={e => setSortOrder(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary"
                        />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-muted/50 text-foreground rounded-xl text-sm font-bold hover:bg-muted transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Saving...' : room ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default RoomForm;
