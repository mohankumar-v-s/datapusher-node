const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models');
const { userSchema, changePasswordSchema } = require('../utils/validationSchema');
const controller = {}
require('dotenv').config()

// Register a new user
controller.registerUser = async (req, res) => {
    try {
        const { error, value } = userSchema.validate(req.body);

        if (error) {
            return res.status(400).json({ message: 'Validation error', details: error.details[0].message });
        }
        const { email, password } = value;

        // Check if user exists
        const existingUser = await db.User.findOne({ where: { email } });
        if (existingUser) return res.status(400).json({ message: 'Email already exists' });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user with role
        const user = await db.User.create({
            email,
            password: hashedPassword,
        });

        console.log('User created:', user.toJSON());

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: user
        });
    } catch (error) {
        console.error('Registration error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Login user
controller.loginUser = async (req, res) => {
    try {
        const { error, value } = userSchema.validate(req.body);

        if (error) {
            return res.status(400).json({ message: 'Validation error', details: error.details[0].message });
        }
        const { email, password } = value;
        const user = await db.User.findOne({ where: { email } });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        console.log('User found:', user.toJSON());
        console.log('JWT Secret:', process.env.JWT_SECRET);

        // Generate JWT
        const token = jwt.sign(
            {
                userId: user.id,
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('Generated token:', token);

        res.json({
            success: true,
            token,
            userId: user.id
        });
    } catch (error) {
        console.error('Login error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get all users (Admin only)
controller.getAllUsers = async (req, res) => {
    try {
        const users = await db.User.findAll({
            attributes: { exclude: ['password'] }
        });
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

controller.getProfile = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const user = await db.User.findOne({
            where: { id: userId },
            attributes: { exclude: ['password'] },
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed To Get Profile', error: error.message });
    }
};

// Update user profile
controller.updateProfile = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { error, value } = changePasswordSchema.validate(req.body);

        if (error) {
            return res.status(400).json({ message: 'Validation error', details: error.details[0].message });
        }

        const { email, currentPassword, newPassword } = value;

        const user = await db.User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // If updating password, verify current password
        if (newPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: 'Current password is incorrect' });
            }
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
        }

        // Update email if provided
        if (email && email !== user.email) {
            const existingUser = await db.User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'Email already exists' });
            }
            user.email = email;
        }

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                id: user.id,
                email: user.email,
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Update profile error', error: error.message });
    }
};

module.exports = controller