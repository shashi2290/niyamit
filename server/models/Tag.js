import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    label: {
        type: String,
        required: true
    },
    color: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    }
}, {
    timestamps: true
});

// Ensure tag IDs are unique per user
tagSchema.index({ id: 1, userId: 1 }, { unique: true });

export default mongoose.model('Tag', tagSchema);
