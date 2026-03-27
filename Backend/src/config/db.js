const mongoose = require('mongoose');

let connectionPromise;

async function connectToDatabase() {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (!connectionPromise) {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dataset-curation';
        connectionPromise = mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000
        });
    }

    await connectionPromise;
    console.log(`MongoDB connected: ${mongoose.connection.name}`);
    return mongoose.connection;
}

module.exports = { connectToDatabase };
