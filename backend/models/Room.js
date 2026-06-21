import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Room/Zone name is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    sortOrder: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

roomSchema.index({ restaurant: 1, name: 1 }, { unique: true });
roomSchema.index({ restaurant: 1, sortOrder: 1 });

const Room = mongoose.model('Room', roomSchema);

export default Room;
