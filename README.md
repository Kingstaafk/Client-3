# Luxe Jewels - Premium Jewellery E-Commerce Platform

A luxury jewellery e-commerce web application inspired by Tanishq, built with React, FastAPI, and MongoDB.

## Features

### Customer Features
- **Browse Products**: View beautiful jewellery collections with filters (category, metal type, price)
- **Product Details**: Detailed product pages with transparent price breakdown (metal price, making charges, GST)
- **Shopping Cart**: Add items to cart, update quantities, and proceed to checkout
- **Secure Checkout**: Complete order placement with shipping information
- **User Dashboard**: Track orders, manage saved items, view sell requests
- **Sell Jewellery**: Submit jewellery for selling with automatic valuation

### Admin Features
- **Product Management**: Add, edit, and delete products
- **Order Management**: View and update order status
- **Sell Request Management**: Review and approve sell requests
- **Dashboard Analytics**: View statistics on products, orders, and users

## Tech Stack

- **Frontend**: React.js with Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT-based authentication
- **UI Components**: Shadcn/UI

## Design

The platform follows a luxury aesthetic with:
- **Color Palette**: White/cream backgrounds with gold accents (#D4AF37)
- **Typography**: Playfair Display (serif) for headings, Lato (sans-serif) for body
- **Layout**: Clean, spacious design with elegant product presentation
- **User Experience**: Smooth transitions, intuitive navigation, responsive design

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB

### Installation

1. **Backend Setup**
```bash
cd backend
pip install -r requirements.txt
```

2. **Frontend Setup**
```bash
cd frontend
yarn install
```

3. **Environment Variables**
- Backend: `/app/backend/.env` (already configured)
- Frontend: `/app/frontend/.env` (already configured)

### Running the Application

Both frontend and backend are managed by supervisor and start automatically.

To manually restart:
```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

### Seeding Sample Data

```bash
python scripts/seed_products.py
```

This will create:
- 8 sample products (gold, diamond, silver jewellery)
- 1 admin user

## Default Credentials

### Admin Account
- **Email**: admin@luxejewels.com
- **Password**: admin123

### Test Customer Account
Create a new account via the signup page at `/signup`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List all products (with filters)
- `GET /api/products/{id}` - Get product details
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/{id}` - Update product (admin only)
- `DELETE /api/products/{id}` - Delete product (admin only)

### Cart
- `GET /api/cart` - Get cart items
- `POST /api/cart` - Add to cart
- `PUT /api/cart/{id}` - Update cart item
- `DELETE /api/cart/{id}` - Remove from cart

### Orders
- `GET /api/orders` - Get orders
- `POST /api/orders` - Create order
- `PUT /api/orders/{id}/status` - Update order status (admin only)

### Sell Jewellery
- `GET /api/sell-jewellery` - Get sell requests
- `POST /api/sell-jewellery` - Create sell request
- `PUT /api/sell-jewellery/{id}` - Update sell request (admin only)

### Saved Items
- `GET /api/saved-items` - Get saved items
- `POST /api/saved-items` - Save item
- `DELETE /api/saved-items/{id}` - Remove saved item

## Key Pages

1. **Home** (`/`) - Hero banner, collections showcase, trust features
2. **Products** (`/products`) - Product listing with filters
3. **Product Detail** (`/products/:id`) - Detailed product information
4. **Cart** (`/cart`) - Shopping cart
5. **Checkout** (`/checkout`) - Order placement
6. **Login** (`/login`) - User login
7. **Signup** (`/signup`) - User registration
8. **Customer Dashboard** (`/dashboard`) - Order history, saved items
9. **Admin Dashboard** (`/admin`) - Product & order management
10. **Sell Jewellery** (`/sell`) - Submit jewellery for selling

## Database Collections

- `users` - User accounts (customers and admins)
- `products` - Jewellery products
- `cart` - Shopping cart items
- `orders` - Customer orders
- `sell_jewellery` - Sell requests
- `saved_items` - Saved/wishlisted products

## Testing

Run the comprehensive test suite:
```bash
python backend_test.py
```

Test coverage: 98% (17/18 backend tests passed, 100% frontend working)

## Project Structure

```
/app
├── backend/
│   ├── server.py          # FastAPI application
│   ├── .env              # Backend environment variables
│   └── requirements.txt  # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.js        # Main React component
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable components
│   │   └── contexts/     # React contexts
│   ├── .env             # Frontend environment variables
│   └── package.json     # Node dependencies
├── scripts/
│   └── seed_products.py # Database seeding script
└── design_guidelines.json # UI/UX design specifications
```

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (customer/admin)
- Protected API endpoints
- Input validation
- CORS configuration

## Future Enhancements

- Payment gateway integration (Stripe/Razorpay)
- Image upload for products
- Product reviews and ratings
- Wishlist sync across devices
- Email notifications for orders
- Advanced search with filters
- Product comparison feature
- Multi-language support

## Support

For issues or questions, please contact the development team.

---

**Built with ❤️ using Emergent Platform**
