const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productSnapshot: {
    name: { type: String, required: true },
    description: { type: String, required: true },
    images: [{ type: String, required: true }],
    colour: { type: String, required: true },
    size: { type: String, required: true }
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  selectedColour: {
    type: String,
    required: true,
    trim: true
  },
  selectedSize: {
    type: String,
    required: true,
    enum: ['sm', 'md', 'lg', 'xl']
  },
  priceAtTime: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  }
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  zipCode: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true, default: 'United States' }
});

const paymentInfoSchema = new mongoose.Schema({
  method: {
    type: String,
    required: true,
    enum: ['stripe', 'paypal', 'card'],
    default: 'stripe'
  },
  stripePaymentIntentId: { type: String },
  stripeSessionId: { type: String },
  last4: { type: String },
  cardBrand: { type: String },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'succeeded', 'failed', 'canceled'],
    default: 'pending'
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  shippingAddress: shippingAddressSchema,
  paymentInfo: paymentInfoSchema,
  orderSummary: {
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    shipping: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 }
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'canceled', 'refunded'],
    default: 'pending'
  },
  notes: { type: String, trim: true },
  trackingNumber: { type: String, trim: true }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      return ret;
    }
  }
});

// Indexes for better query performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'paymentInfo.status': 1 });
orderSchema.index({ createdAt: -1 });

// Generate order number before saving
orderSchema.pre('save', function(next) {
  if (!this.orderNumber || this.orderNumber === '') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  next();
});

// Virtual for formatted order number
orderSchema.virtual('formattedOrderNumber').get(function() {
  return `#${this.orderNumber}`;
});

// Method to calculate totals
orderSchema.methods.calculateTotals = function() {
  const subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxRate = 0.08; // 8% tax
  const tax = subtotal * taxRate;
  const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
  const total = subtotal + tax + shipping;
  
  this.orderSummary = {
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    shipping: parseFloat(shipping.toFixed(2)),
    total: parseFloat(total.toFixed(2))
  };
  
  return this.orderSummary;
};

// Method to update order status
orderSchema.methods.updateStatus = function(newStatus, notes = '') {
  this.status = newStatus;
  if (notes) {
    this.notes = notes;
  }
  return this.save();
};

// Static method to get user orders with pagination
orderSchema.statics.getUserOrders = function(userId, options = {}) {
  const { page = 1, limit = 10, status = null } = options;
  
  let query = { user: userId };
  if (status) {
    query.status = status;
  }
  
  const skip = (page - 1) * limit;
  
  return Promise.all([
    this.find(query)
      .populate('items.product', 'name slug images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query)
  ]).then(([orders, total]) => ({
    orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  }));
};

module.exports = mongoose.model('Order', orderSchema);
