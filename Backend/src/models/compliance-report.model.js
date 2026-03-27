const mongoose = require('mongoose');

const complianceReportSchema = new mongoose.Schema({
    datasetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dataset',
        required: true,
        index: true
    },
    overallScore: {
        type: Number,
        default: 0
    },
    violations: {
        type: String,
        default: '[]'
    },
    warnings: {
        type: String,
        default: '[]'
    },
    autoFixSuggestions: {
        type: String,
        default: '[]'
    }
}, {
    timestamps: { createdAt: true, updatedAt: false },
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

module.exports = mongoose.models.ComplianceReport || mongoose.model('ComplianceReport', complianceReportSchema);
