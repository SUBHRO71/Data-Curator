const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const apiRoutes = require('./routes/api.routes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const uploadsDir = path.join(__dirname, '../uploads');
const exportsDir = path.join(uploadsDir, 'exports');
const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
    : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
}

app.use((req, res, next) => {
    const startedAt = Date.now();
    console.log(`[request] ${req.method} ${req.originalUrl}`, {
        params: req.params,
        query: req.query,
        body: req.body
    });

    res.on('finish', () => {
        console.log(`[response] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - startedAt}ms)`);
    });

    next();
});

app.use('/uploads', express.static(uploadsDir));
app.use('/api', apiRoutes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        status: 'error',
        data: null,
        error: {
            message: err.message || 'Something went wrong!'
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Allowed CORS origins: ${allowedOrigins.join(', ')}`);
});
