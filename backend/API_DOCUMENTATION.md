# ShopHub Backend API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication APIs

### 1. User Registration
**POST** `/auth/register`

**Headers:**
```
Content-Type: multipart/form-data
```

**Body (form-data):**
```
username: string (required, 3-30 chars, alphanumeric + underscore only)
email: string (required, valid email)
password: string (required, min 8 chars, must include uppercase, lowercase, number, special char)
confirmPassword: string (required, must match password)
phone: string (required, valid phone number)
profileImage: file (optional, image file, max 5MB)
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "username": "john_doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "profileImage": "http://localhost:5000/uploads/profiles/profile-123456789.jpg",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Password must contain at least one uppercase letter...",
      "param": "password",
      "location": "body"
    }
  ]
}
```

### 2. User Login
**POST** `/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "john@example.com",
  "password": "Password@123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "username": "john_doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "profileImage": "http://localhost:5000/uploads/profiles/profile-123456789.jpg",
      "role": "user",
      "isActive": true,
      "lastLogin": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Admin Login
**POST** `/auth/admin/login`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "admin@shophub.com",
  "password": "Admin@123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "user": {
      "_id": "admin_id",
      "username": "admin",
      "email": "admin@shophub.com",
      "role": "admin",
      "isActive": true,
      "lastLogin": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 4. Get Current User Profile
**GET** `/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "username": "john_doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "profileImage": "http://localhost:5000/uploads/profiles/profile-123456789.jpg",
      "role": "user",
      "isActive": true,
      "lastLogin": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 5. Logout
**POST** `/auth/logout`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 6. Create Admin (Initial Setup)
**POST** `/auth/create-admin`

**Note:** Multiple admins can now be created with unique credentials.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "username": "admin",
  "email": "admin@shophub.com",
  "password": "Admin@123",
  "phone": "+1234567890"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Admin user created successfully",
  "data": {
    "user": {
      "_id": "admin_id",
      "username": "admin",
      "email": "admin@shophub.com",
      "phone": "+1234567890",
      "role": "admin",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 7. Update Profile
**PUT** `/auth/profile`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body (form-data):**
```
username: string (optional, 3-30 chars, alphanumeric + underscore only)
phone: string (optional, valid phone number)
profileImage: file (optional, image file, max 5MB)
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "username": "updated_username",
      "email": "john@example.com",
      "phone": "+1234567891",
      "profileImage": "http://localhost:5000/uploads/profiles/profile-123456789.jpg",
      "role": "user",
      "isActive": true
    }
  }
}
```

### 8. Change Password
**PUT** `/auth/change-password`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "currentPassword": "OldPassword@123",
  "newPassword": "NewPassword@123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

## Products APIs

### 1. Get All Products
**GET** `/products`

**Query Parameters:**
```
page: number (optional, default: 1, min: 1)
limit: number (optional, default: 12, min: 1, max: 50)
search: string (optional, search in name and description)
category: string (optional, filter by category)
tags: string (optional, comma-separated tags)
minPrice: number (optional, minimum price filter)
maxPrice: number (optional, maximum price filter)
size: string (optional, one of: sm, md, lg, xl)
colour: string (optional, filter by colour)
inStock: boolean (optional, filter by stock status)
sortBy: string (optional, one of: name, price, createdAt)
sortOrder: string (optional, asc or desc)
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "product_id",
        "name": "Premium T-Shirt",
        "slug": "premium-t-shirt",
        "description": "High-quality cotton t-shirt with modern design",
        "price": 29.99,
        "colour": "Blue",
        "size": "md",
        "totalStock": 100,
        "inStock": true,
        "images": [
          "http://localhost:5000/uploads/products/product-123456789.jpg"
        ],
        "tags": ["casual", "cotton", "comfortable"],
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalProducts": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 2. Get Product by Slug
**GET** `/products/:slug`

**Parameters:**
```
slug: string (required, product slug)
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "product": {
      "_id": "product_id",
      "name": "Premium T-Shirt",
      "slug": "premium-t-shirt",
      "description": "High-quality cotton t-shirt with modern design",
      "price": 29.99,
      "colour": "Blue",
      "size": "md",
      "totalStock": 100,
      "inStock": true,
      "images": [
        "http://localhost:5000/uploads/products/product-123456789.jpg"
      ],
      "tags": ["casual", "cotton", "comfortable"],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 3. Create Product (Admin Only)
**POST** `/products`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

**Body (form-data):**
```
name: string (required, 1-200 chars)
description: string (required, 10-2000 chars)
price: number (required, positive number)
colour: string (required, 1-50 chars)
size: string (required, one of: sm, md, lg, xl)
totalStock: number (required, non-negative integer)
inStock: boolean (optional, default: true)
tags: string (optional, comma-separated tags)
images: file[] (required, 1-5 image files, max 5MB each)
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "product": {
      "_id": "product_id",
      "name": "Premium T-Shirt",
      "slug": "premium-t-shirt",
      "description": "High-quality cotton t-shirt with modern design",
      "price": 29.99,
      "colour": "Blue",
      "size": "md",
      "totalStock": 100,
      "inStock": true,
      "images": [
        "http://localhost:5000/uploads/products/product-123456789.jpg"
      ],
      "tags": ["casual", "cotton", "comfortable"],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 4. Update Product (Admin Only)
**PUT** `/products/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

**Parameters:**
```
id: string (required, valid MongoDB ObjectId)
```

**Body (form-data, all optional):**
```
name: string (optional, 1-200 chars)
description: string (optional, 10-2000 chars)
price: number (optional, positive number)
colour: string (optional, 1-50 chars)
size: string (optional, one of: sm, md, lg, xl)
totalStock: number (optional, non-negative integer)
inStock: boolean (optional)
tags: string (optional, comma-separated tags)
images: file[] (optional, 1-5 image files, max 5MB each)
removeImages: string[] (optional, array of image URLs to remove)
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "product": {
      "_id": "product_id",
      "name": "Updated Premium T-Shirt",
      "slug": "updated-premium-t-shirt",
      "description": "Updated high-quality cotton t-shirt",
      "price": 34.99,
      "colour": "Red",
      "size": "lg",
      "totalStock": 150,
      "inStock": true,
      "images": [
        "http://localhost:5000/uploads/products/product-987654321.jpg"
      ],
      "tags": ["casual", "cotton", "premium"],
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 5. Delete Product (Admin Only)
**DELETE** `/products/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Parameters:**
```
id: string (required, valid MongoDB ObjectId)
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

### 6. Get Product Statistics (Admin Only)
**GET** `/products/stats`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalProducts": 150,
      "inStockProducts": 120,
      "outOfStockProducts": 30,
      "averagePrice": 45.67,
      "totalValue": 6850.50,
      "topTags": [
        { "tag": "casual", "count": 45 },
        { "tag": "cotton", "count": 38 }
      ],
      "sizeDistribution": {
        "sm": 25,
        "md": 50,
        "lg": 45,
        "xl": 30
      }
    }
  }
}
```

### 7. Get Product Tags
**GET** `/products/tags`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "tags": [
      "casual",
      "cotton",
      "comfortable",
      "premium",
      "summer",
      "winter"
    ]
  }
}
```

## Cart APIs

### 1. Get User Cart
**GET** `/cart`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "cart": {
      "_id": "cart_id",
      "userId": "user_id",
      "items": [
        {
          "_id": "cart_item_id",
          "productId": {
            "_id": "product_id",
            "name": "Premium T-Shirt",
            "slug": "premium-t-shirt",
            "price": 29.99,
            "images": ["http://localhost:5000/uploads/products/product-123.jpg"],
            "inStock": true
          },
          "quantity": 2,
          "selectedColour": "Blue",
          "selectedSize": "md",
          "itemTotal": 59.98
        }
      ],
      "totalItems": 2,
      "totalAmount": 59.98,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 2. Get Cart Count
**GET** `/cart/count`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

### 3. Add Item to Cart
**POST** `/cart/add`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "productId": "product_id",
  "quantity": 2,
  "selectedColour": "Blue",
  "selectedSize": "md"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Item added to cart successfully",
  "data": {
    "cart": {
      "_id": "cart_id",
      "userId": "user_id",
      "items": [
        {
          "_id": "cart_item_id",
          "productId": "product_id",
          "quantity": 2,
          "selectedColour": "Blue",
          "selectedSize": "md",
          "itemTotal": 59.98
        }
      ],
      "totalItems": 2,
      "totalAmount": 59.98
    }
  }
}
```

### 4. Update Cart Item
**PUT** `/cart/item/:itemId`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Parameters:**
```
itemId: string (required, valid MongoDB ObjectId)
```

**Body:**
```json
{
  "quantity": 3
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Cart item updated successfully",
  "data": {
    "cart": {
      "_id": "cart_id",
      "userId": "user_id",
      "items": [
        {
          "_id": "cart_item_id",
          "productId": "product_id",
          "quantity": 3,
          "selectedColour": "Blue",
          "selectedSize": "md",
          "itemTotal": 89.97
        }
      ],
      "totalItems": 3,
      "totalAmount": 89.97
    }
  }
}
```

### 5. Remove Item from Cart
**DELETE** `/cart/item/:itemId`

**Headers:**
```
Authorization: Bearer <token>
```

**Parameters:**
```
itemId: string (required, valid MongoDB ObjectId)
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Item removed from cart successfully",
  "data": {
    "cart": {
      "_id": "cart_id",
      "userId": "user_id",
      "items": [],
      "totalItems": 0,
      "totalAmount": 0
    }
  }
}
```

### 6. Clear Cart
**DELETE** `/cart`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Cart cleared successfully",
  "data": {
    "cart": {
      "_id": "cart_id",
      "userId": "user_id",
      "items": [],
      "totalItems": 0,
      "totalAmount": 0
    }
  }
}
```

## Checkout & Orders APIs

### 1. Get Checkout Summary
**GET** `/checkout/summary`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "items": [
        {
          "_id": "cart_item_id",
          "product": {
            "_id": "product_id",
            "name": "Premium T-Shirt",
            "price": 29.99,
            "images": ["http://localhost:5000/uploads/products/product-123.jpg"]
          },
          "quantity": 2,
          "selectedColour": "Blue",
          "selectedSize": "md",
          "itemTotal": 59.98
        }
      ],
      "subtotal": 59.98,
      "shipping": 5.99,
      "tax": 5.40,
      "total": 71.37,
      "totalItems": 2
    }
  }
}
```

### 2. Process Checkout
**POST** `/checkout/process`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "shippingAddress": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "address": "123 Main Street, Apt 4B",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "United States"
  },
  "paymentMethod": "stripe"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "order": {
      "_id": "order_id",
      "orderNumber": "ORD-2024-001234",
      "userId": "user_id",
      "items": [
        {
          "productId": "product_id",
          "productName": "Premium T-Shirt",
          "quantity": 2,
          "price": 29.99,
          "selectedColour": "Blue",
          "selectedSize": "md",
          "itemTotal": 59.98
        }
      ],
      "shippingAddress": {
        "fullName": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "address": "123 Main Street, Apt 4B",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "United States"
      },
      "paymentMethod": "stripe",
      "subtotal": 59.98,
      "shipping": 5.99,
      "tax": 5.40,
      "total": 71.37,
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 3. Get User Orders
**GET** `/checkout/orders`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
```
page: number (optional, default: 1)
limit: number (optional, default: 10)
status: string (optional, filter by order status)
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "order_id",
        "orderNumber": "ORD-2024-001234",
        "items": [
          {
            "productName": "Premium T-Shirt",
            "quantity": 2,
            "price": 29.99,
            "itemTotal": 59.98
          }
        ],
        "total": 71.37,
        "status": "delivered",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalOrders": 25,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 4. Get Order by Order Number
**GET** `/checkout/orders/:orderNumber`

**Headers:**
```
Authorization: Bearer <token>
```

**Parameters:**
```
orderNumber: string (required, order number)
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "order": {
      "_id": "order_id",
      "orderNumber": "ORD-2024-001234",
      "userId": "user_id",
      "items": [
        {
          "productId": "product_id",
          "productName": "Premium T-Shirt",
          "quantity": 2,
          "price": 29.99,
          "selectedColour": "Blue",
          "selectedSize": "md",
          "itemTotal": 59.98,
          "productImages": ["http://localhost:5000/uploads/products/product-123.jpg"]
        }
      ],
      "shippingAddress": {
        "fullName": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "address": "123 Main Street, Apt 4B",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "United States"
      },
      "paymentMethod": "stripe",
      "subtotal": 59.98,
      "shipping": 5.99,
      "tax": 5.40,
      "total": 71.37,
      "status": "delivered",
      "statusHistory": [
        {
          "status": "pending",
          "timestamp": "2024-01-01T00:00:00.000Z"
        },
        {
          "status": "processing",
          "timestamp": "2024-01-01T01:00:00.000Z"
        },
        {
          "status": "shipped",
          "timestamp": "2024-01-02T00:00:00.000Z"
        },
        {
          "status": "delivered",
          "timestamp": "2024-01-05T00:00:00.000Z"
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-05T00:00:00.000Z"
    }
  }
}
```

## Health Check
**GET** `/health`

**Success Response (200):**
```json
{
  "success": true,
  "message": "ShopHub API is running!",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

## Error Responses

### Common Error Codes:
- **400**: Bad Request (validation errors, duplicate data)
- **401**: Unauthorized (invalid credentials, missing/invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found (resource not found)
- **500**: Internal Server Error

### Error Response Format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Optional validation errors array
}
```

### Validation Error Example:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      "param": "password",
      "location": "body"
    },
    {
      "msg": "Username must be between 3 and 30 characters",
      "param": "username", 
      "location": "body"
    }
  ]
}
```

## Authentication Flow

1. **Register/Login**: Get JWT token and refresh token
2. **Store Token**: Save token securely (localStorage/cookies)
3. **API Calls**: Include token in Authorization header: `Bearer <token>`
4. **Token Expiry**: Use refresh token to get new access token (if implemented)

## Admin vs User Roles

### User Role (`role: "user"`):
- Can register, login, update profile
- Can browse products, add to cart, checkout
- Can view their own orders
- Cannot access admin endpoints

### Admin Role (`role: "admin"`):
- All user permissions
- Can create, update, delete products
- Can view product statistics
- Can access admin dashboard
- Multiple admins can now be created

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (@$!%*?&)

## File Upload

### Profile Images:
- **Path**: `/uploads/profiles/`
- **Max Size**: 5MB
- **Formats**: All image types (jpg, png, gif, webp, etc.)
- **URL**: `http://localhost:5000/uploads/profiles/filename.jpg`

### Product Images:
- **Path**: `/uploads/products/`
- **Max Size**: 5MB per image
- **Max Count**: 5 images per product
- **Formats**: All image types
- **URL**: `http://localhost:5000/uploads/products/filename.jpg`

## Product Sizes & Colors

### Available Sizes:
- `sm` - Small
- `md` - Medium  
- `lg` - Large
- `xl` - Extra Large

### Color Format:
- String format (e.g., "Blue", "Red", "Black")
- No restrictions on color names

## Order Status Flow

1. **pending** - Order placed, awaiting processing
2. **processing** - Order being prepared
3. **shipped** - Order dispatched
4. **delivered** - Order completed
5. **cancelled** - Order cancelled

## Testing the APIs

You can test these APIs using:
- **Postman**: Import the endpoints and test
- **cURL**: Command line testing
- **Thunder Client**: VS Code extension
- **Frontend**: Integrate with your React/Next.js app

### Example cURL Commands:

#### User Registration:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -F "username=johndoe" \
  -F "email=john@example.com" \
  -F "password=Password@123" \
  -F "confirmPassword=Password@123" \
  -F "phone=+1234567890" \
  -F "profileImage=@/path/to/image.jpg"
```

#### User Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Password@123"}'
```

#### Admin Login:
```bash
curl -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@123"}'
```

#### Create Admin:
```bash
curl -X POST http://localhost:5000/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@example.com","password":"Admin@123","phone":"+1234567890"}'
```

#### Get Products:
```bash
curl -X GET "http://localhost:5000/api/products?page=1&limit=10&minPrice=10&maxPrice=100"
```

#### Add to Cart (requires auth token):
```bash
curl -X POST http://localhost:5000/api/cart/add \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"productId":"PRODUCT_ID","quantity":2,"selectedColour":"Blue","selectedSize":"md"}'
```

#### Create Product (Admin only):
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -F "name=Premium T-Shirt" \
  -F "description=High-quality cotton t-shirt" \
  -F "price=29.99" \
  -F "colour=Blue" \
  -F "size=md" \
  -F "totalStock=100" \
  -F "tags=casual,cotton,comfortable" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"
```

## Rate Limiting & Security

- **Rate Limiting**: Not implemented (consider adding for production)
- **CORS**: Configured for frontend domains
- **Input Validation**: Comprehensive validation using express-validator
- **File Upload Security**: File type and size restrictions
- **Password Security**: Bcrypt hashing with salt rounds
- **JWT Security**: Tokens expire and should be refreshed

## Environment Variables

Make sure to set these environment variables:
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/shophub
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d
```

## API Versioning

Current API version: **v1**
All endpoints are prefixed with `/api/`

Future versions will use `/api/v2/`, `/api/v3/`, etc.

---

**Last Updated**: December 2024  
**API Version**: 1.0  
**Backend Framework**: Node.js + Express + MongoDB  
**Frontend**: Next.js + TypeScript
