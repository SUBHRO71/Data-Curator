const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    datasetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dataset',
        required: true,
        index: true
    },
    originalName: {
        type: String,
        required: true
    },
    storedPath: {
        type: String,
        required: true
    },
    format: {
        type: String,
        required: true
    },
    sizeBytes: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        default: 'Pending'
    }
}, {
    timestamps: false,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: (_, ret) => {
            ret.id = ret._id.toString();
            ret.datasetId = ret.datasetId.toString();
            delete ret._id;
        }
    }
});

module.exports = mongoose.models.File || mongoose.model('File', fileSchema);
