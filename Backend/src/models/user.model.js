const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    passwordHash: {
        type: String,
        required: true
    }
}, {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: (_, ret) => {
            ret.id = ret._id.toString();
            delete ret.passwordHash;
            delete ret._id;
        }
    }
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
