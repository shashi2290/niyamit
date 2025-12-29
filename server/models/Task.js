import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    category: {
        id: String,
        label: String,
        color: String
    },
    date: {
        type: String,
        required: true
    },
    startTime: String,
    endTime: String,
    completed: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        enum: ['task', 'habit'],
        default: 'task'
    }
}, {
    timestamps: true
});

// Index for faster date queries
taskSchema.index({ date: 1 });

export default mongoose.model('Task', taskSchema);
