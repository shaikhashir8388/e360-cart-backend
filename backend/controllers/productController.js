const { validationResult } = require('express-validator');
const Product = require('../models/Product');
const { getProductFileUrl, deleteUploadedFile } = require('../middleware/upload');
const BaseController = require('./baseController');

/**
 * @desc    Get all products with filters and pagination
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      sort = '-createdAt',
      search = '',
      tags = '',
      minPrice = 0,
      maxPrice = Number.MAX_VALUE,
      colour = '',
      size = '',
      inStock = null
    } = req.query;

    // Parse tags if provided
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim().toLowerCase()) : [];

    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 50), // Max 50 items per page
      sort,
      search: search.trim(),
      tags: tagsArray,
      minPrice: parseFloat(minPrice),
      maxPrice: parseFloat(maxPrice),
      colour: colour.trim(),
      size: size.trim(),
      inStock: inStock !== null ? inStock === 'true' : null
    };

    const result = await Product.findWithFilters({}, options);

    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: result
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching products'
    });
  }
};

/**
 * @desc    Get single product by slug
 * @route   GET /api/products/:slug
 * @access  Public
 */
const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({ slug });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: { product }
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching product'
    });
  }
};

/**
 * @desc    Create new product
 * @route   POST /api/products
 * @access  Private (Admin only)
 */
const createProduct = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Delete uploaded files if validation fails
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => deleteUploadedFile(file.path));
      }
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, description, tags, price, colour, size, totalStock, inStock } = req.body;

    // Parse tags
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim().toLowerCase()) : [];

    // Handle images
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => getProductFileUrl(file.filename));
    }

    // Create product data
    const productData = {
      name: name.trim(),
      description: description.trim(),
      tags: tagsArray,
      price: parseFloat(price),
      colour: colour.trim().toLowerCase(),
      size: size.toLowerCase(),
      images,
      totalStock: parseInt(totalStock),
      inStock: inStock === 'true' || inStock === true
    };

    // Create product
    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product }
    });

  } catch (error) {
    // Delete uploaded files if error occurs
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => deleteUploadedFile(file.path));
    }
    
    console.error('Create product error:', error);
    
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
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating product'
    });
  }
};

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Private (Admin only)
 */
const updateProduct = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Delete uploaded files if validation fails
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => deleteUploadedFile(file.path));
      }
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { name, description, tags, price, colour, size, totalStock, inStock, removeImages } = req.body;

    // Find existing product
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      // Delete uploaded files if product not found
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => deleteUploadedFile(file.path));
      }
      
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Build update data
    const updateData = {};
    
    if (name) updateData.name = name.trim();
    if (description) updateData.description = description.trim();
    if (tags) updateData.tags = tags.split(',').map(tag => tag.trim().toLowerCase());
    if (price) updateData.price = parseFloat(price);
    if (colour) updateData.colour = colour.trim().toLowerCase();
    if (size) updateData.size = size.toLowerCase();
    if (totalStock) updateData.totalStock = parseInt(totalStock);
    if (inStock !== undefined) updateData.inStock = inStock === 'true' || inStock === true;

    // Handle images
    let currentImages = [...existingProduct.images];

    // Remove specified images
    if (removeImages) {
      const imagesToRemove = Array.isArray(removeImages) ? removeImages : [removeImages];
      currentImages = currentImages.filter(img => !imagesToRemove.includes(img));
    }

    // Add new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => getProductFileUrl(file.filename));
      currentImages = [...currentImages, ...newImages];
    }

    if (currentImages.length > 0) {
      updateData.images = currentImages;
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: { product: updatedProduct }
    });

  } catch (error) {
    // Delete uploaded files if error occurs
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => deleteUploadedFile(file.path));
    }
    
    console.error('Update product error:', error);
    
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
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating product'
    });
  }
};

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Private (Admin only)
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete associated images if they are file URLs
    if (product.images && product.images.length > 0) {
      product.images.forEach(imageUrl => {
        if (imageUrl.includes('/uploads/')) {
          const filename = imageUrl.split('/').pop();
          const filePath = `uploads/products/${filename}`;
          deleteUploadedFile(filePath);
        }
      });
    }

    await Product.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting product'
    });
  }
};

/**
 * @desc    Get product stats (Admin only)
 * @route   GET /api/products/stats
 * @access  Private (Admin only)
 */
const getProductStats = async (req, res) => {
  try {
    const stats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalInStock: { $sum: { $cond: ['$inStock', 1, 0] } },
          totalOutOfStock: { $sum: { $cond: ['$inStock', 0, 1] } },
          totalStock: { $sum: '$totalStock' },
          totalSold: { $sum: '$soldCount' },
          averagePrice: { $avg: '$price' },
          maxPrice: { $max: '$price' },
          minPrice: { $min: '$price' }
        }
      }
    ]);

    const result = stats[0] || {
      totalProducts: 0,
      totalInStock: 0,
      totalOutOfStock: 0,
      totalStock: 0,
      totalSold: 0,
      averagePrice: 0,
      maxPrice: 0,
      minPrice: 0
    };

    res.status(200).json({
      success: true,
      message: 'Product stats retrieved successfully',
      data: { stats: result }
    });

  } catch (error) {
    console.error('Get product stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching product stats'
    });
  }
};

/**
 * @desc    Get all unique tags
 * @route   GET /api/products/tags
 * @access  Public
 */
const getProductTags = async (req, res) => {
  try {
    const tags = await Product.distinct('tags');
    
    res.status(200).json({
      success: true,
      message: 'Product tags retrieved successfully',
      data: { tags: tags.sort() }
    });

  } catch (error) {
    console.error('Get product tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching product tags'
    });
  }
};

module.exports = {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
  getProductTags
};
