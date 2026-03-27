const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const [, token] = authHeader.split(' ');

    if (!token) {
        return res.status(401).json({
            status: 'error',
            data: null,
            error: {
                message: 'Authentication token is required'
            }
        });
    }

    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET is not configured');
        }

        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        return next();
    } catch (error) {
        return res.status(401).json({
            status: 'error',
            data: null,
            error: {
                message: 'Invalid or expired authentication token'
            }
        });
    }
}

module.exports = authMiddleware;
