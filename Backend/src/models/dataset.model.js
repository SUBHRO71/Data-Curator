const mongoose = require('mongoose');

const datasetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        default: 'Processing'
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: (_, ret) => {
            ret.id = ret._id.toString();
            if (ret.userId) {
                ret.userId = ret.userId.toString();
            }
            delete ret._id;
        }
    }
});

module.exports = mongoose.models.Dataset || mongoose.model('Dataset', datasetSchema);
