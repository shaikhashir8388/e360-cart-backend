const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const {
  getCheckoutSummary,
  processCheckout,
  getUserOrders,
  getOrder
} = require('../controllers/checkoutController');

const router = express.Router();

/**
 * @route   GET /api/checkout/summary
 * @desc    Get checkout summary with cart items and totals
 * @access  Private
 */
router.get('/summary', authenticate, getCheckoutSummary);

/**
 * @route   POST /api/checkout/process
 * @desc    Process checkout and create order
 * @access  Private
 */
router.post('/process', [
  authenticate,
  
  // Validate shipping address
  body('shippingAddress.fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  body('shippingAddress.email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('shippingAddress.phone')
    .trim()
    .matches(/^\+?[1-9]\d{7,14}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('shippingAddress.address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  
  body('shippingAddress.city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  
  body('shippingAddress.state')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be between 2 and 100 characters'),
  
  body('shippingAddress.zipCode')
    .trim()
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Please provide a valid ZIP code'),
  
  body('shippingAddress.country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be between 2 and 100 characters'),
  
  // Validate payment method
  body('paymentMethod')
    .optional()
    .isIn(['stripe', 'paypal', 'card'])
    .withMessage('Payment method must be one of: stripe, paypal, card')
    
], processCheckout);

/**
 * @route   GET /api/checkout/orders
 * @desc    Get user orders with pagination
 * @access  Private
 */
router.get('/orders', authenticate, getUserOrders);

/**
 * @route   GET /api/checkout/orders/:orderNumber
 * @desc    Get specific order by order number
 * @access  Private
 */
router.get('/orders/:orderNumber', authenticate, getOrder);

module.exports = router;
