const { validationResult } = require('express-validator');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const BaseController = require('./baseController');

/**
 * @desc    Get user's cart
 * @route   GET /api/cart
 * @access  Private
 */
const getCart = async (req, res) => {
  try {
    const userId = req.user._id;

    let cart = await Cart.findOrCreateForUser(userId);
    cart = await cart.getPopulatedCart();

    res.status(200).json({
      success: true,
      message: 'Cart retrieved successfully',
      data: { cart }
    });

  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching cart'
    });
  }
};

/**
 * @desc    Add item to cart
 * @route   POST /api/cart/add
 * @access  Private
 */
const addToCart = async (req, res) => {
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

    const userId = req.user._id;
    const { productId, quantity, selectedColour, selectedSize } = req.body;

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if product is available
    if (!product.inStock) {
      return res.status(400).json({
        success: false,
        message: 'Product is currently out of stock'
      });
    }

    // Check if requested quantity is available
    if (product.totalStock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.totalStock} items available in stock`
      });
    }

    // Validate colour and size match product
    if (selectedColour.toLowerCase() !== product.colour.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Selected colour does not match product colour'
      });
    }

    if (selectedSize.toLowerCase() !== product.size.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Selected size does not match product size'
      });
    }

    // Get or create cart
    let cart = await Cart.findOrCreateForUser(userId);

    // Add item to cart
    await cart.addItem(productId, quantity, selectedColour, selectedSize, product.price);

    // Get updated cart with populated product details
    cart = await cart.getPopulatedCart();

    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      data: { cart }
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while adding item to cart'
    });
  }
};

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/cart/item/:itemId
 * @access  Private
 */
const updateCartItem = async (req, res) => {
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

    const userId = req.user._id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    // Find user's cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Find the cart item
    const cartItem = cart.items.id(itemId);
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    // If quantity > 0, check product availability
    if (quantity > 0) {
      const product = await Product.findById(cartItem.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      if (!product.inStock) {
        return res.status(400).json({
          success: false,
          message: 'Product is currently out of stock'
        });
      }

      if (product.totalStock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.totalStock} items available in stock`
        });
      }
    }

    // Update cart item
    await cart.updateItemQuantity(itemId, quantity);

    // Get updated cart with populated product details
    cart = await cart.getPopulatedCart();

    res.status(200).json({
      success: true,
      message: 'Cart item updated successfully',
      data: { cart }
    });

  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating cart item'
    });
  }
};

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/item/:itemId
 * @access  Private
 */
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;

    // Find user's cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Remove item from cart
    await cart.removeItem(itemId);

    // Get updated cart with populated product details
    cart = await cart.getPopulatedCart();

    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
      data: { cart }
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    
    if (error.message === 'Cart item not found') {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while removing item from cart'
    });
  }
};

/**
 * @desc    Clear entire cart
 * @route   DELETE /api/cart
 * @access  Private
 */
const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find user's cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Clear cart
    await cart.clearCart();

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: { cart }
    });

  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while clearing cart'
    });
  }
};

/**
 * @desc    Get cart item count
 * @route   GET /api/cart/count
 * @access  Private
 */
const getCartCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId });
    const count = cart ? cart.totalItems : 0;

    res.status(200).json({
      success: true,
      message: 'Cart count retrieved successfully',
      data: { count }
    });

  } catch (error) {
    console.error('Get cart count error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching cart count'
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount
};
