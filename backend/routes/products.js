const express = require('express');
const { body, param, query } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { uploadProductImages } = require('../middleware/upload');
const {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
  getProductTags
} = require('../controllers/productController');

const router = express.Router();

/**
 * @route   GET /api/products
 * @desc    Get all products with filters and pagination
 * @access  Public
 */
router.get('/', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min price must be a positive number'),
  
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max price must be a positive number'),
  
  query('size')
    .optional()
    .isIn(['sm', 'md', 'lg', 'xl'])
    .withMessage('Size must be one of: sm, md, lg, xl'),
  
  query('inStock')
    .optional()
    .isBoolean()
    .withMessage('inStock must be a boolean value')
], asyncHandler(getProducts));

/**
 * @route   GET /api/products/stats
 * @desc    Get product statistics
 * @access  Private (Admin only)
 */
router.get('/stats', authenticate, requireAdmin, asyncHandler(getProductStats));

/**
 * @route   GET /api/products/tags
 * @desc    Get all unique product tags
 * @access  Public
 */
router.get('/tags', asyncHandler(getProductTags));

/**
 * @route   GET /api/products/:slug
 * @desc    Get single product by slug
 * @access  Public
 */
router.get('/:slug', [
  param('slug')
    .notEmpty()
    .withMessage('Product slug is required')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Invalid slug format')
], asyncHandler(getProductBySlug));

/**
 * @route   POST /api/products
 * @desc    Create new product
 * @access  Private (Admin only)
 */
router.post('/', [
  authenticate,
  requireAdmin,
  uploadProductImages,
  
  // Validation middleware
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Product name must be between 1 and 200 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('colour')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Colour is required and must be less than 50 characters'),
  
  body('size')
    .isIn(['sm', 'md', 'lg', 'xl'])
    .withMessage('Size must be one of: sm, md, lg, xl'),
  
  body('totalStock')
    .isInt({ min: 0 })
    .withMessage('Total stock must be a non-negative integer'),
  
  body('inStock')
    .optional()
    .isBoolean()
    .withMessage('inStock must be a boolean value'),
  
  body('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a comma-separated string')
], asyncHandler(createProduct));

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Private (Admin only)
 */
router.put('/:id', [
  authenticate,
  requireAdmin,
  uploadProductImages,
  
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID'),
  
  // Validation middleware (all optional for updates)
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Product name must be between 1 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('colour')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Colour must be less than 50 characters'),
  
  body('size')
    .optional()
    .isIn(['sm', 'md', 'lg', 'xl'])
    .withMessage('Size must be one of: sm, md, lg, xl'),
  
  body('totalStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total stock must be a non-negative integer'),
  
  body('inStock')
    .optional()
    .isBoolean()
    .withMessage('inStock must be a boolean value'),
  
  body('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a comma-separated string'),
  
  body('removeImages')
    .optional()
    .custom((value) => {
      if (Array.isArray(value)) {
        return value.every(img => typeof img === 'string');
      }
      return typeof value === 'string';
    })
    .withMessage('removeImages must be a string or array of strings')
], asyncHandler(updateProduct));

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product
 * @access  Private (Admin only)
 */
router.delete('/:id', [
  authenticate,
  requireAdmin,
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID')
], asyncHandler(deleteProduct));

module.exports = router;
