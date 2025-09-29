const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Uncomment when Stripe is installed

/**
 * @desc    Get checkout summary
 * @route   GET /api/checkout/summary
 * @access  Private
 */
const getCheckoutSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's cart
    const cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Validate cart items and check stock
    const validationErrors = [];
    const orderItems = [];

    for (const item of cart.items) {
      const product = item.product;

      // Check if product still exists
      if (!product) {
        validationErrors.push(`Product no longer available`);
        continue;
      }

      // Check stock availability
      if (!product.inStock || product.totalStock < item.quantity) {
        validationErrors.push(`${product.name} - Insufficient stock (Available: ${product.totalStock})`);
        continue;
      }

      // Create order item
      orderItems.push({
        product: product._id,
        productSnapshot: {
          name: product.name,
          description: product.description,
          images: product.images,
          colour: product.colour,
          size: product.size
        },
        quantity: item.quantity,
        selectedColour: item.selectedColour,
        selectedSize: item.selectedSize,
        priceAtTime: product.price,
        totalPrice: product.price * item.quantity
      });
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart validation failed',
        errors: validationErrors
      });
    }

    // Calculate order summary
    const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxRate = 0.08; // 8% tax
    const tax = subtotal * taxRate;
    const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
    const total = subtotal + tax + shipping;

    const orderSummary = {
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      shipping: parseFloat(shipping.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      taxRate: taxRate,
      freeShippingThreshold: 50
    };

    res.status(200).json({
      success: true,
      message: 'Checkout summary retrieved successfully',
      data: {
        items: orderItems,
        orderSummary,
        itemCount: orderItems.length,
        totalQuantity: orderItems.reduce((sum, item) => sum + item.quantity, 0)
      }
    });

  } catch (error) {
    console.error('Get checkout summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while getting checkout summary'
    });
  }
};

/**
 * @desc    Process checkout and create order
 * @route   POST /api/checkout/process
 * @access  Private
 */
const processCheckout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shippingAddress, paymentMethod = 'stripe' } = req.body;

    // Validate required fields
    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    const requiredFields = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
    const missingFields = requiredFields.filter(field => !shippingAddress[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required shipping address fields',
        missingFields
      });
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Validate cart items and prepare order items
    const orderItems = [];
    const stockUpdates = [];

    for (const item of cart.items) {
      const product = item.product;

      if (!product) {
        return res.status(400).json({
          success: false,
          message: 'One or more products are no longer available'
        });
      }

      if (!product.inStock || product.totalStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `${product.name} - Insufficient stock (Available: ${product.totalStock})`
        });
      }

      orderItems.push({
        product: product._id,
        productSnapshot: {
          name: product.name,
          description: product.description,
          images: product.images,
          colour: product.colour,
          size: product.size
        },
        quantity: item.quantity,
        selectedColour: item.selectedColour,
        selectedSize: item.selectedSize,
        priceAtTime: product.price,
        totalPrice: product.price * item.quantity
      });

      // Prepare stock update
      stockUpdates.push({
        productId: product._id,
        quantity: item.quantity
      });
    }

    // Create order
    const order = new Order({
      user: userId,
      items: orderItems,
      shippingAddress: {
        ...shippingAddress,
        country: shippingAddress.country || 'United States'
      },
      paymentInfo: {
        method: paymentMethod,
        status: 'pending'
      }
    });

    console.log('Order created, orderNumber before calculate:', order.orderNumber);
    
    // Calculate totals
    order.calculateTotals();
    
    console.log('Order after calculate, orderNumber:', order.orderNumber);

    // In a real implementation, you would process payment with Stripe here
    // For demo purposes, we'll simulate a successful payment
    
    // Simulate Stripe payment processing
    const paymentResult = await simulateStripePayment(order.orderSummary.total);
    
    if (paymentResult.success) {
      order.paymentInfo.status = 'succeeded';
      order.paymentInfo.stripePaymentIntentId = paymentResult.paymentIntentId;
      order.paymentInfo.last4 = paymentResult.last4;
      order.paymentInfo.cardBrand = paymentResult.cardBrand;
      order.status = 'processing';
    } else {
      order.paymentInfo.status = 'failed';
      
      await order.save();
      
      return res.status(400).json({
        success: false,
        message: 'Payment failed',
        error: paymentResult.error
      });
    }

    // Save order
    console.log('Saving order with orderNumber:', order.orderNumber);
    await order.save();
    console.log('Order saved successfully with ID:', order._id);

    // Update product stock
    for (const update of stockUpdates) {
      await Product.findByIdAndUpdate(
        update.productId,
        {
          $inc: {
            totalStock: -update.quantity,
            soldCount: update.quantity
          }
        }
      );
      
      // Update inStock status if needed
      const updatedProduct = await Product.findById(update.productId);
      if (updatedProduct.totalStock === 0) {
        updatedProduct.inStock = false;
        await updatedProduct.save();
      }
    }

    // Clear user's cart
    await Cart.findByIdAndUpdate(cart._id, {
      items: [],
      totalAmount: 0,
      totalItems: 0
    });

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Order placed successfully! Thank you for your purchase.',
      data: {
        order: {
          orderNumber: order.orderNumber,
          formattedOrderNumber: order.formattedOrderNumber,
          status: order.status,
          orderSummary: order.orderSummary,
          estimatedDelivery: getEstimatedDelivery(),
          trackingInfo: {
            available: false,
            message: 'Tracking information will be available once your order ships.'
          }
        },
        paymentInfo: {
          status: order.paymentInfo.status,
          method: order.paymentInfo.method,
          last4: order.paymentInfo.last4,
          cardBrand: order.paymentInfo.cardBrand
        }
      }
    });

  } catch (error) {
    console.error('Process checkout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while processing checkout'
    });
  }
};

/**
 * @desc    Get user orders
 * @route   GET /api/checkout/orders
 * @access  Private
 */
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const result = await Order.getUserOrders(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      status
    });

    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: result
    });

  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching orders'
    });
  }
};

/**
 * @desc    Get specific order
 * @route   GET /api/checkout/orders/:orderNumber
 * @access  Private
 */
const getOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderNumber } = req.params;

    const order = await Order.findOne({
      orderNumber,
      user: userId
    }).populate('items.product', 'name slug images');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order retrieved successfully',
      data: { order }
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching order'
    });
  }
};

// Helper function to simulate Stripe payment (replace with real Stripe integration)
async function simulateStripePayment(amount) {
  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate random payment success/failure (90% success rate)
  const success = Math.random() > 0.1;
  
  if (success) {
    return {
      success: true,
      paymentIntentId: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      last4: '4242',
      cardBrand: 'visa'
    };
  } else {
    return {
      success: false,
      error: 'Payment declined. Please try a different payment method.'
    };
  }
}

// Helper function to calculate estimated delivery
function getEstimatedDelivery() {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 5); // 5 business days
  
  return {
    date: deliveryDate.toISOString().split('T')[0],
    formatted: deliveryDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    businessDays: 5
  };
}

module.exports = {
  getCheckoutSummary,
  processCheckout,
  getUserOrders,
  getOrder
};
