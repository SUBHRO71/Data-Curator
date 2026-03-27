const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

function sendSuccess(res, statusCode, data) {
    return res.status(statusCode).json({
        status: 'success',
        data,
        error: null
    });
}

function sendError(res, statusCode, message) {
    return res.status(statusCode).json({
        status: 'error',
        data: null,
        error: { message }
    });
}

function signToken(user) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }

    return jwt.sign(
        {
            userId: user.id,
            email: user.email
        },
        secret,
        { expiresIn: '1d' }
    );
}

exports.signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return sendError(res, 400, 'Name, email, and password are required');
        }

        if (password.length < 8) {
            return sendError(res, 400, 'Password must be at least 8 characters long');
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return sendError(res, 409, 'User already exists with this email');
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await User.create({
            name: String(name).trim(),
            email: normalizedEmail,
            passwordHash
        });

        const token = signToken(user);
        return sendSuccess(res, 201, {
            message: 'User created',
            token,
            user: user.toJSON()
        });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendError(res, 400, 'Email and password are required');
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return sendError(res, 401, 'Invalid email or password');
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return sendError(res, 401, 'Invalid email or password');
        }

        const token = signToken(user);
        return sendSuccess(res, 200, {
            message: 'Login successful',
            token,
            user: user.toJSON()
        });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

exports.me = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return sendError(res, 404, 'User not found');
        }

        return sendSuccess(res, 200, user.toJSON());
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};
