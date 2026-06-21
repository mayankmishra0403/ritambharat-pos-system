import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import { Layers } from 'lucide-react';

const RoomSelector = ({ restaurantId, selectedRoom, onSelect }) => {
    const { data: rooms = [] } = useQuery({
        queryKey: ['rooms', restaurantId],
        queryFn: async () => {
            const res = await api.get(`/rooms?restaurantId=${restaurantId}`);
            return res.data.data || [];
        },
        enabled: !!restaurantId
    });

    if (!rooms.length) return null;

    return (
        <div className="flex flex-wrap gap-1.5">
            <button
                onClick={() => onSelect(null)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                    !selectedRoom
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                }`}
            >
                <Layers size={10} />
                All
            </button>
            {rooms.map(room => (
                <button
                    key={room._id}
                    onClick={() => onSelect(room._id)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                        selectedRoom === room._id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                    }`}
                >
                    {room.name}
                    <span className="opacity-60">({room.tableCount})</span>
                </button>
            ))}
        </div>
    );
};

export default RoomSelector;
