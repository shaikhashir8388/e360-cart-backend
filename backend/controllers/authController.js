const { validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../utils/jwt');
const { getFileUrl, deleteUploadedFile } = require('../middleware/upload');
const BaseController = require('./baseController');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Delete uploaded file if validation fails
      if (req.file) {
        deleteUploadedFile(req.file.path);
      }
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email },
        { username: username },
        { phone: phone }
      ]
    });

    if (existingUser) {
      // Delete uploaded file if user exists
      if (req.file) {
        deleteUploadedFile(req.file.path);
      }
      
      let message = 'User already exists';
      if (existingUser.email === email) {
        message = 'Email is already registered';
      } else if (existingUser.username === username) {
        message = 'Username is already taken';
      } else if (existingUser.phone === phone) {
        message = 'Phone number is already registered';
      }
      
      return res.status(400).json({
        success: false,
        message
      });
    }

    // Prepare user data
    const userData = {
      username,
      email,
      password,
      phone
    };

    // Add profile image if uploaded
    if (req.file) {
      userData.profileImage = getFileUrl(req.file.filename);
    }

    // Create user
    const user = new User(userData);
    await user.save();

    // Generate tokens
    const tokenPayload = {
      userId: user._id,
      email: user.email,
      role: user.role
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Update last login
    await user.updateLastLogin();

    // Remove password from response
    const userResponse = user.toJSON();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token,
        refreshToken
      }
    });

  } catch (error) {
    // Delete uploaded file if error occurs
    if (req.file) {
      deleteUploadedFile(req.file.path);
    }
    
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate tokens
    const tokenPayload = {
      userId: user._id,
      email: user.email,
      role: user.role
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Update last login
    await user.updateLastLogin();

    // Remove password from response
    const userResponse = user.toJSON();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
};

/**
 * @desc    Admin login
 * @route   POST /api/auth/admin/login
 * @access  Public
 */
const loginAdmin = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find admin user by email
    const user = await User.findOne({ 
      email,
      role: 'admin'
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin account is deactivated'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Generate tokens
    const tokenPayload = {
      userId: user._id,
      email: user.email,
      role: user.role
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Update last login
    await user.updateLastLogin();

    // Remove password from response
    const userResponse = user.toJSON();

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: {
        user: userResponse,
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during admin login'
    });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getCurrentUser = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching user profile'
    });
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logoutUser = async (req, res) => {
  try {
    // In a more complex setup, you might want to blacklist the token
    // For now, we just send a success response
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout'
    });
  }
};

/**
 * @desc    Create admin user (for initial setup)
 * @route   POST /api/auth/create-admin
 * @access  Public (should be restricted in production)
 */
const createAdmin = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, email, password, phone } = req.body;

    // Note: Removed single admin restriction to allow multiple admin users

    // Check if user with same credentials exists
    const existingUser = await User.findOne({
      $or: [
        { email: email },
        { username: username },
        { phone: phone }
      ]
    });

    if (existingUser) {
      let message = 'User with these credentials already exists';
      if (existingUser.email === email) {
        message = 'Email is already registered';
      } else if (existingUser.username === username) {
        message = 'Username is already taken';
      } else if (existingUser.phone === phone) {
        message = 'Phone number is already registered';
      }
      
      return res.status(400).json({
        success: false,
        message
      });
    }

    // Create admin user
    const admin = await User.createAdmin({
      username,
      email,
      password,
      phone
    });

    // Remove password from response
    const adminResponse = admin.toJSON();

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        user: adminResponse
      }
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating admin'
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const { username, phone } = req.body;
    const userId = req.user._id;

    // Build update object
    const updateData = {};
    if (username) updateData.username = username;
    if (phone) updateData.phone = phone;

    // Add profile image if uploaded
    if (req.file) {
      // Delete old profile image if exists
      const user = await User.findById(userId);
      if (user.profileImage) {
        // Extract filename from URL and delete file
        const oldFilename = user.profileImage.split('/').pop();
        const oldFilePath = `uploads/profiles/${oldFilename}`;
        deleteUploadedFile(oldFilePath);
      }
      
      updateData.profileImage = getFileUrl(req.file.filename);
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      if (req.file) {
        deleteUploadedFile(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    // Delete uploaded file if error occurs
    if (req.file) {
      deleteUploadedFile(req.file.path);
    }
    
    console.error('Update profile error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const value = error.keyValue[field];
      return res.status(400).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' is already taken`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating profile'
    });
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Find user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Validate new password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;
    if (newPassword.length < 8 || !passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while changing password'
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  loginAdmin,
  getCurrentUser,
  logoutUser,
  createAdmin,
  updateProfile,
  changePassword
};
