import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    label: {
        type: String,
        required: true
    },
    color: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

export default mongoose.model('Tag', tagSchema);
