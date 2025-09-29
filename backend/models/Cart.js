const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    validate: {
      validator: function(quantity) {
        return Number.isInteger(quantity) && quantity > 0;
      },
      message: 'Quantity must be a positive integer'
    }
  },
  selectedColour: {
    type: String,
    required: [true, 'Selected colour is required'],
    trim: true,
    lowercase: true
  },
  selectedSize: {
    type: String,
    required: [true, 'Selected size is required'],
    enum: {
      values: ['sm', 'md', 'lg', 'xl'],
      message: 'Size must be one of: sm, md, lg, xl'
    }
  },
  priceAtTime: {
    type: Number,
    required: [true, 'Price at time of adding is required'],
    min: [0, 'Price cannot be negative']
  }
}, {
  timestamps: true
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    unique: true
  },
  items: [cartItemSchema],
  totalAmount: {
    type: Number,
    default: 0,
    min: [0, 'Total amount cannot be negative']
  },
  totalItems: {
    type: Number,
    default: 0,
    min: [0, 'Total items cannot be negative']
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      return ret;
    }
  }
});

// Index for better performance
cartSchema.index({ user: 1 });
cartSchema.index({ 'items.product': 1 });

// Method to calculate totals
cartSchema.methods.calculateTotals = function() {
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.totalAmount = this.items.reduce((sum, item) => sum + (item.priceAtTime * item.quantity), 0);
  return this;
};

// Method to add item to cart
cartSchema.methods.addItem = async function(productId, quantity, selectedColour, selectedSize, currentPrice) {
  // Check if item with same product and variant already exists
  const existingItemIndex = this.items.findIndex(item => 
    item.product.toString() === productId.toString() && 
    item.selectedColour === selectedColour.toLowerCase() && 
    item.selectedSize === selectedSize.toLowerCase()
  );

  if (existingItemIndex > -1) {
    // Update existing item quantity
    this.items[existingItemIndex].quantity += quantity;
    this.items[existingItemIndex].priceAtTime = currentPrice; // Update to current price
  } else {
    // Add new item
    this.items.push({
      product: productId,
      quantity,
      selectedColour: selectedColour.toLowerCase(),
      selectedSize: selectedSize.toLowerCase(),
      priceAtTime: currentPrice
    });
  }

  this.calculateTotals();
  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = async function(itemId, quantity) {
  const item = this.items.id(itemId);
  if (!item) {
    throw new Error('Cart item not found');
  }

  if (quantity <= 0) {
    // Remove item if quantity is 0 or negative
    this.items.pull(itemId);
  } else {
    item.quantity = quantity;
  }

  this.calculateTotals();
  return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = async function(itemId) {
  const item = this.items.id(itemId);
  if (!item) {
    throw new Error('Cart item not found');
  }

  this.items.pull(itemId);
  this.calculateTotals();
  return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = async function() {
  this.items = [];
  this.totalAmount = 0;
  this.totalItems = 0;
  return this.save();
};

// Method to get cart with populated product details
cartSchema.methods.getPopulatedCart = function() {
  return this.populate({
    path: 'items.product',
    select: 'name slug price images inStock totalStock colour size'
  });
};

// Static method to find or create cart for user
cartSchema.statics.findOrCreateForUser = async function(userId) {
  let cart = await this.findOne({ user: userId });
  
  if (!cart) {
    cart = new this({
      user: userId,
      items: [],
      totalAmount: 0,
      totalItems: 0
    });
    await cart.save();
  }
  
  return cart;
};

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(next) {
  this.calculateTotals();
  next();
});

module.exports = mongoose.model('Cart', cartSchema);
