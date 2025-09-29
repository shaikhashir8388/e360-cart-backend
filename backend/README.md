# e360 Cart - Full Stack E-commerce Platform

A modern, full-stack e-commerce application built with Next.js, Node.js, Express, and MongoDB. Features a responsive frontend with admin dashboard and a robust REST API backend.

## 🚀 Project Overview

**Frontend**: Next.js 14 + TypeScript + Tailwind CSS  
**Backend**: Node.js + Express + MongoDB  
**Authentication**: JWT-based with role management  
**File Upload**: Multer for images  
**UI Components**: shadcn/ui  

## 📁 Project Structure

```
e360-cart/
├── project/              # Next.js Frontend
│   ├── app/             # App Router pages
│   ├── components/      # React components
│   ├── context/         # React contexts
│   ├── hooks/           # Custom hooks
│   └── lib/             # Utilities & API client
├── backend/             # Node.js Backend
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── uploads/         # File uploads
│   └── utils/           # Backend utilities
└── README.md           # This file
```

## ✨ Features

### 🛒 E-commerce Core
- **Product Catalog**: Browse products with filtering and search
- **Shopping Cart**: Add, update, remove items
- **Checkout Process**: Complete order flow with shipping info
- **Order Management**: Track order history and status
- **User Authentication**: Register, login, profile management

### 👨‍💼 Admin Dashboard
- **Product Management**: Create, edit, delete products
- **Image Upload**: Multiple product images
- **Admin Authentication**: Separate admin login
- **Product Statistics**: Dashboard with analytics
- **Multi-Admin Support**: Multiple admin accounts

### 🎨 UI/UX
- **Responsive Design**: Mobile-first approach
- **Modern UI**: Clean, professional interface
- **Loading States**: Smooth user experience
- **Error Handling**: Comprehensive error messages
- **Toast Notifications**: Real-time feedback

### 🔐 Security
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Server-side validation
- **File Upload Security**: Type and size restrictions
- **CORS Protection**: Configured for security

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud)
- npm or yarn

### 1. Clone Repository
```bash
git clone <repository-url>
cd e360-cart
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure environment variables
# Edit .env with your MongoDB URI, JWT secrets, etc.

# Start development server
npm run dev
```

### 3. Frontend Setup
```bash
cd project

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/e360cart
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 🚀 Getting Started

### 1. Start Backend Server
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

### 2. Start Frontend Server
```bash
cd project
npm run dev
# App runs on http://localhost:3000
```

### 3. Create Admin Account
```bash
# Using the API directly
curl -X POST http://localhost:5000/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com", 
    "password": "Admin@123",
    "phone": "+1234567890"
  }'
```

Or visit: `http://localhost:3000/admin/setup`

## 📚 API Documentation

Comprehensive API documentation is available at:
- **File**: `backend/API_DOCUMENTATION.md`
- **Health Check**: `http://localhost:5000/api/health`

### Key API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/create-admin` - Create admin account

#### Products
- `GET /api/products` - Get all products (public)
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

#### Cart & Orders
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `POST /api/checkout/process` - Process checkout
- `GET /api/checkout/orders` - Get user orders

## 🎯 Usage Guide

### For Customers
1. **Browse Products**: Visit homepage to see product catalog
2. **Register/Login**: Create account or sign in
3. **Add to Cart**: Select products with size/color options
4. **Checkout**: Complete purchase with shipping details
5. **Track Orders**: View order history and status

### For Admins
1. **Admin Setup**: Create admin account at `/admin/setup`
2. **Admin Login**: Sign in at `/admin/login`
3. **Dashboard**: Access admin dashboard at `/admin`
4. **Manage Products**: Create, edit, delete products
5. **View Analytics**: Check product statistics

## 🏗️ Architecture

### Frontend Architecture
- **App Router**: Next.js 14 app directory structure
- **Server Components**: Optimized performance
- **Client Components**: Interactive UI elements
- **Context API**: State management for auth/cart
- **TypeScript**: Type safety throughout
- **Tailwind CSS**: Utility-first styling

### Backend Architecture
- **MVC Pattern**: Organized code structure
- **Middleware**: Authentication, validation, error handling
- **RESTful API**: Standard HTTP methods and status codes
- **MongoDB**: Document-based data storage
- **JWT**: Stateless authentication

## 📱 Responsive Design

The application is fully responsive and works on:
- **Desktop**: Full-featured experience
- **Tablet**: Optimized layout
- **Mobile**: Touch-friendly interface

## 🔧 Development

### Available Scripts

#### Backend
```bash
npm run dev        # Start development server
npm start          # Start production server
npm run lint       # Run ESLint
npm test           # Run tests (if configured)
```

#### Frontend
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
npm run type-check # TypeScript checking
```

### Code Quality
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Husky**: Git hooks (if configured)

## 🚀 Deployment

### Backend Deployment
1. **Environment**: Set production environment variables
2. **Database**: Use MongoDB Atlas or similar
3. **File Storage**: Configure cloud storage for uploads
4. **Server**: Deploy to Heroku, Railway, or VPS

### Frontend Deployment
1. **Build**: Run `npm run build`
2. **Environment**: Set production API URLs
3. **Platform**: Deploy to Vercel, Netlify, or similar
4. **Domain**: Configure custom domain

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Common Issues

#### Backend Issues
- **MongoDB Connection**: Check MONGODB_URI in .env
- **Port Conflicts**: Change PORT in .env if 5000 is occupied
- **File Uploads**: Ensure uploads/ directory exists and has write permissions

#### Frontend Issues
- **API Connection**: Verify NEXT_PUBLIC_API_URL points to backend
- **Build Errors**: Run `npm run type-check` to find TypeScript issues
- **Styling Issues**: Check Tailwind CSS configuration

### Getting Help
- **Documentation**: Check API_DOCUMENTATION.md
- **Issues**: Create GitHub issue with details
- **Debug**: Check browser console and server logs

## 📊 Performance

### Frontend Optimizations
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic route-based splitting
- **Static Generation**: Pre-rendered pages where possible
- **Lazy Loading**: Components loaded on demand

### Backend Optimizations
- **Database Indexing**: Optimized MongoDB queries
- **Caching**: Response caching where appropriate
- **Compression**: Gzip compression enabled
- **Rate Limiting**: API rate limiting implemented

## 🔮 Future Enhancements

### Planned Features
- **Payment Integration**: Stripe/PayPal integration
- **Email Notifications**: Order confirmations and updates
- **Inventory Management**: Stock level tracking
- **Reviews & Ratings**: Product review system
- **Wishlist**: Save items for later
- **Multi-language**: Internationalization support

### Technical Improvements
- **Testing**: Unit and integration tests
- **CI/CD**: Automated deployment pipeline
- **Monitoring**: Error tracking and analytics
- **Performance**: Further optimization

---

**Built with ❤️ by [M Ashir]**  
**Version**: 1.0.0  
**Last Updated**: December 2024

## 📞 Contact

- **Email**: shaikhashir871@gmail.com
- **GitHub**: https://github.com/shaikhashir8388/
- **LinkedIn**: https://www.linkedin.com/in/ashir-shaikh-482244245/
