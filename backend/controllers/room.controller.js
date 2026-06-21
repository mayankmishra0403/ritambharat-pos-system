import Room from '../models/Room.js';
import Table from '../models/Table.js';

export const getRooms = async (req, res, next) => {
    try {
        const { restaurantId } = req.query;
        if (!restaurantId) {
            return res.status(400).json({ success: false, message: 'Restaurant ID is required' });
        }

        const rooms = await Room.find({ restaurant: restaurantId })
            .sort({ sortOrder: 1, name: 1 });

        const roomsWithTableCount = await Promise.all(
            rooms.map(async (room) => {
                const tableCount = await Table.countDocuments({ restaurant: restaurantId, room: room._id });
                return { ...room.toObject(), tableCount };
            })
        );

        res.status(200).json({
            success: true,
            data: roomsWithTableCount
        });
    } catch (error) {
        next(error);
    }
};

export const createRoom = async (req, res, next) => {
    try {
        const { restaurantId, name, description, sortOrder } = req.body;

        if (!restaurantId || !name) {
            return res.status(400).json({
                success: false, message: 'Restaurant ID and name are required'
            });
        }

        const existing = await Room.findOne({ restaurant: restaurantId, name });
        if (existing) {
            return res.status(400).json({
                success: false, message: 'A room with this name already exists'
            });
        }

        const room = await Room.create({ restaurant: restaurantId, name, description, sortOrder });

        res.status(201).json({ success: true, data: room });
    } catch (error) {
        next(error);
    }
};

export const updateRoom = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, sortOrder } = req.body;

        const room = await Room.findById(id);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        if (name && name !== room.name) {
            const existing = await Room.findOne({ restaurant: room.restaurant, name });
            if (existing) {
                return res.status(400).json({
                    success: false, message: 'A room with this name already exists'
                });
            }
        }

        if (name) room.name = name;
        if (description !== undefined) room.description = description;
        if (sortOrder !== undefined) room.sortOrder = sortOrder;

        await room.save();

        res.status(200).json({ success: true, data: room });
    } catch (error) {
        next(error);
    }
};

export const deleteRoom = async (req, res, next) => {
    try {
        const { id } = req.params;

        const room = await Room.findById(id);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        // Unlink tables from this room
        await Table.updateMany({ room: id }, { $unset: { room: '' } });

        await Room.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: 'Room deleted' });
    } catch (error) {
        next(error);
    }
};
