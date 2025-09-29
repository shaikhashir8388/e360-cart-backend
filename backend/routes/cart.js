const express = require('express');
const { body, param } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount
} = require('../controllers/cartController');

const router = express.Router();

// All cart routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/cart
 * @desc    Get user's cart
 * @access  Private
 */
router.get('/', asyncHandler(getCart));

/**
 * @route   GET /api/cart/count
 * @desc    Get cart item count
 * @access  Private
 */
router.get('/count', asyncHandler(getCartCount));

/**
 * @route   POST /api/cart/add
 * @desc    Add item to cart
 * @access  Private
 */
router.post('/add', [
  body('productId')
    .isMongoId()
    .withMessage('Valid product ID is required'),
  
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('selectedColour')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Selected colour is required'),
  
  body('selectedSize')
    .isIn(['sm', 'md', 'lg', 'xl'])
    .withMessage('Selected size must be one of: sm, md, lg, xl')
], asyncHandler(addToCart));

/**
 * @route   PUT /api/cart/item/:itemId
 * @desc    Update cart item quantity
 * @access  Private
 */
router.put('/item/:itemId', [
  param('itemId')
    .isMongoId()
    .withMessage('Valid item ID is required'),
  
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer')
], asyncHandler(updateCartItem));

/**
 * @route   DELETE /api/cart/item/:itemId
 * @desc    Remove item from cart
 * @access  Private
 */
router.delete('/item/:itemId', [
  param('itemId')
    .isMongoId()
    .withMessage('Valid item ID is required')
], asyncHandler(removeFromCart));

/**
 * @route   DELETE /api/cart
 * @desc    Clear entire cart
 * @access  Private
 */
router.delete('/', asyncHandler(clearCart));

module.exports = router;
