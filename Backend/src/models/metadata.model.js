const mongoose = require('mongoose');

const metadataSchema = new mongoose.Schema({
    fileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
        required: true,
        index: true
    },
    tags: {
        type: String,
        default: '[]'
    },
    language: {
        type: String,
        default: 'en'
    },
    sensitiveFlags: {
        type: String,
        default: '[]'
    },
    confidenceScores: {
        type: String,
        default: '{}'
    }
}, {
    timestamps: false,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: (_, ret) => {
            ret.id = ret._id.toString();
            ret.fileId = ret.fileId.toString();
            delete ret._id;
        }
    }
});

module.exports = mongoose.models.Metadata || mongoose.model('Metadata', metadataSchema);
