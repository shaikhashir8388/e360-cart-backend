const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative'],
    validate: {
      validator: function(price) {
        return Number.isFinite(price) && price >= 0;
      },
      message: 'Price must be a valid positive number'
    }
  },
  colour: {
    type: String,
    required: [true, 'Product colour is required'],
    trim: true,
    lowercase: true
  },
  size: {
    type: String,
    required: [true, 'Product size is required'],
    enum: {
      values: ['sm', 'md', 'lg', 'xl'],
      message: 'Size must be one of: sm, md, lg, xl'
    }
  },
  images: [{
    type: String,
    required: true,
    validate: {
      validator: function(image) {
        // Check if it's a valid URL or base64 string
        const urlPattern = /^https?:\/\/.+/;
        const base64Pattern = /^data:image\/(png|jpg|jpeg|gif|webp);base64,/;
        return urlPattern.test(image) || base64Pattern.test(image);
      },
      message: 'Image must be a valid URL or base64 string'
    }
  }],
  inStock: {
    type: Boolean,
    default: true
  },
  totalStock: {
    type: Number,
    required: [true, 'Total stock is required'],
    min: [0, 'Stock cannot be negative'],
    validate: {
      validator: function(stock) {
        return Number.isInteger(stock) && stock >= 0;
      },
      message: 'Stock must be a valid non-negative integer'
    }
  },
  soldCount: {
    type: Number,
    default: 0,
    min: [0, 'Sold count cannot be negative'],
    validate: {
      validator: function(count) {
        return Number.isInteger(count) && count >= 0;
      },
      message: 'Sold count must be a valid non-negative integer'
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      return ret;
    }
  }
});

// Indexes for better query performance
productSchema.index({ slug: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ price: 1 });
productSchema.index({ inStock: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ soldCount: -1 });

// Compound indexes for common queries
productSchema.index({ inStock: 1, createdAt: -1 });
productSchema.index({ tags: 1, inStock: 1 });
productSchema.index({ price: 1, inStock: 1 });

// Virtual for availability status
productSchema.virtual('isAvailable').get(function() {
  return this.inStock && this.totalStock > 0;
});

// Method to update stock after purchase
productSchema.methods.updateStock = function(quantity) {
  if (this.totalStock >= quantity) {
    this.totalStock -= quantity;
    this.soldCount += quantity;
    
    // Auto-update inStock status
    if (this.totalStock === 0) {
      this.inStock = false;
    }
    
    return this.save();
  } else {
    throw new Error('Insufficient stock available');
  }
};

// Method to restore stock (e.g., when order is cancelled)
productSchema.methods.restoreStock = function(quantity) {
  this.totalStock += quantity;
  this.soldCount = Math.max(0, this.soldCount - quantity);
  
  // Auto-update inStock status
  if (this.totalStock > 0 && !this.inStock) {
    this.inStock = true;
  }
  
  return this.save();
};

// Static method to find products with filters and pagination
productSchema.statics.findWithFilters = function(filters = {}, options = {}) {
  const {
    page = 1,
    limit = 12,
    sort = '-createdAt',
    search = '',
    tags = [],
    minPrice = 0,
    maxPrice = Number.MAX_VALUE,
    colour = '',
    size = '',
    inStock = null
  } = options;

  // Build query
  let query = {};

  // Search in name and description
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Filter by tags
  if (tags.length > 0) {
    query.tags = { $in: tags };
  }

  // Filter by price range
  if (minPrice > 0 || maxPrice < Number.MAX_VALUE) {
    query.price = {};
    if (minPrice > 0) query.price.$gte = minPrice;
    if (maxPrice < Number.MAX_VALUE) query.price.$lte = maxPrice;
  }

  // Filter by colour
  if (colour) {
    query.colour = colour.toLowerCase();
  }

  // Filter by size
  if (size) {
    query.size = size.toLowerCase();
  }

  // Filter by stock status
  if (inStock !== null) {
    query.inStock = inStock;
  }

  // Apply additional filters
  Object.assign(query, filters);

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Execute query with pagination
  return Promise.all([
    this.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query)
  ]).then(([products, total]) => ({
    products,
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

// Pre-save middleware to generate slug if not provided
productSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    // Generate slug from name
    let slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .trim();
    
    // Ensure slug is not empty
    if (!slug) {
      slug = 'product-' + Date.now();
    }
    
    this.slug = slug;
  }
  next();
});

// Pre-save middleware to ensure at least one image
productSchema.pre('save', function(next) {
  if (!this.images || this.images.length === 0) {
    return next(new Error('At least one product image is required'));
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
