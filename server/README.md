# AfriVogue Backend API

A production-grade Node.js/Express API server for the AfriVogue platform, replacing Supabase with a custom backend for complete control over business logic and data management.

## Overview

This is the core backend for AfriVogue, a premium African fashion platform. The API handles:
- User authentication and authorization
- Product catalog and inventory management
- E-commerce operations (orders, cart, checkout)
- Email marketing and newsletter campaigns
- User profiles and preferences
- Editorial content and trend forecasting
- Admin dashboards and analytics

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MySQL 8.0+
- **Email**: Nodemailer with Hostinger SMTP
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Database Driver**: mysql2/promise
- **Utilities**: uuid, dotenv, cors, express-json-larger-body

## Prerequisites

- Node.js 18.0 or higher
- MySQL 8.0 or higher
- Hostinger SMTP credentials (or compatible SMTP server)
- A registered domain or local development setup

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Copy the `.env.example` file to `.env` and fill in your actual values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=afrivogue_db

# Email / SMTP
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_email@afrivogue.com
SMTP_PASS=your_smtp_password
EMAIL_FROM_NAME=AfriVogue
EMAIL_FROM_ADDRESS=no-reply@afrivogue.com

# JWT & Security
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRE=7d

# Site URLs
SITE_URL=https://afrivogue.com
ADMIN_PANEL_URL=https://admin.afrivogue.com

# Server
PORT=3000
NODE_ENV=production
```

### 3. Initialize the Database

Run the MySQL schema to set up all required tables:

```bash
mysql -u your_mysql_user -p afrivogue_db < schema.sql
```

When prompted, enter your MySQL password. The schema will create all necessary tables with proper indexes and relationships.

### 4. Start the Server

**Development Mode** (with auto-reload via nodemon):
```bash
npm run dev
```

**Production Mode**:
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## Hostinger Deployment

### Prerequisites
- Hostinger account with Node.js hosting
- FTP or file manager access
- SSH access (recommended)

### Deployment Steps

#### 1. Upload Files via FTP or File Manager
- Connect to your Hostinger file manager or FTP client
- Navigate to the public_html directory
- Upload the entire `server/` folder

#### 2. Create Node.js Application in hPanel

1. Log in to your Hostinger account
2. Go to **Hosting** → **Manage**
3. Click **Node.js** in the left sidebar
4. Click **Create Application**
5. Configure:
   - **Application Name**: AfriVogue API
   - **Application Root**: `/server` (the uploaded folder path)
   - **Startup File**: `index.js`
   - **Node.js Version**: 18.x or higher

#### 3. Set Environment Variables

In hPanel:
1. Select your application
2. Click **Environment Variables**
3. Add all variables from your `.env` file:
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
   - `JWT_SECRET`, `SITE_URL`, `PORT`, etc.

#### 4. Install Dependencies

In hPanel terminal or SSH:
```bash
cd /server
npm install
```

#### 5. Start the Application

Click the **Start** button in hPanel. The application will start and be accessible at your domain.

#### 6. Monitor Logs

Check application logs in hPanel to debug any issues.

## API Endpoint Reference

### Authentication
- `POST /api/auth/register` - Create a new user account
- `POST /api/auth/login` - Login and receive JWT token
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Invalidate current session

### Users & Profiles
- `GET /api/users/profile` - Get current user profile
- `PATCH /api/users/profile` - Update profile information
- `POST /api/users/password` - Change password

### Products
- `GET /api/products` - List products with filters
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)
- `PATCH /api/products/:id` - Update product (admin)

### Orders
- `POST /api/orders` - Create a new order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order details

### Email
- `POST /api/email/send` - Send template email (admin)
- `POST /api/email/test` - Send test email (admin)
- `POST /api/email/unsubscribe` - Unsubscribe from newsletters
- `GET /api/email/log` - Email send log (admin)

### Newsletters
- `POST /api/newsletters/subscribe` - Subscribe to newsletter
- `POST /api/newsletters/campaigns` - Create campaign (admin)
- `POST /api/newsletters/send` - Send campaign (admin)

For complete endpoint documentation, see individual route files in `/routes`.

## Environment Variables Reference

### Database Configuration
- `DB_HOST` - MySQL server hostname (default: localhost)
- `DB_PORT` - MySQL server port (default: 3306)
- `DB_USER` - MySQL username
- `DB_PASSWORD` - MySQL password
- `DB_NAME` - Database name (default: afrivogue_db)

### SMTP/Email Configuration
- `SMTP_HOST` - SMTP server hostname (default: smtp.hostinger.com)
- `SMTP_PORT` - SMTP port (default: 465 for secure, 587 for TLS)
- `SMTP_SECURE` - Use SSL (default: true)
- `SMTP_USER` - SMTP username/email
- `SMTP_PASS` - SMTP password
- `EMAIL_FROM_NAME` - Display name for emails (default: AfriVogue)
- `EMAIL_FROM_ADDRESS` - From email address

### Security
- `JWT_SECRET` - Secret key for signing JWT tokens (use strong, random value in production)
- `JWT_EXPIRE` - JWT expiration time (default: 7d)
- `BCRYPT_ROUNDS` - Number of bcrypt salt rounds (default: 12)

### Application URLs
- `SITE_URL` - Main website URL (e.g., https://afrivogue.com)
- `ADMIN_PANEL_URL` - Admin dashboard URL (e.g., https://admin.afrivogue.com)

### Server Configuration
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development, production, test)
- `CORS_ORIGIN` - CORS allowed origins (comma-separated for multiple)

## Project Structure

```
server/
├── config/
│   └── database.js         # MySQL connection pool
├── middleware/
│   ├── auth.js             # JWT authentication
│   ├── admin.js            # Admin role check
│   └── errorHandler.js     # Global error handling
├── routes/
│   ├── auth.js             # Authentication endpoints
│   ├── email.js            # Email operations
│   ├── products.js         # Product catalog
│   ├── orders.js           # Orders & checkout
│   ├── newsletters.js      # Newsletter management
│   └── ...
├── services/
│   ├── email.js            # Email sending logic
│   ├── auth.js             # Authentication logic
│   └── ...
├── index.js                # Application entry point
├── schema.sql              # Database schema
├── .env.example            # Environment variables template
└── README.md               # This file
```

## Development Workflow

1. **Local Development**: Run `npm run dev` for auto-reload with nodemon
2. **Database Changes**: Update `schema.sql` and re-run migrations
3. **Testing**: Run tests with `npm test` (when implemented)
4. **Linting**: Check code with `npm run lint` (when configured)

## Security Best Practices

1. **Environment Variables**: Never commit `.env` to version control
2. **JWT Secret**: Use a strong, random value in production
3. **Database Passwords**: Use strong passwords and rotate regularly
4. **HTTPS**: Always use HTTPS in production
5. **CORS**: Configure CORS_ORIGIN carefully for your domain
6. **Rate Limiting**: Consider implementing rate limiting for production
7. **Input Validation**: All endpoints validate input parameters
8. **SQL Injection**: Using parameterized queries throughout

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running and accessible
- Check `DB_HOST`, `DB_USER`, `DB_PASSWORD` in `.env`
- Ensure the database `DB_NAME` exists

### Email Not Sending
- Verify SMTP credentials are correct
- Check email is not in suppression list
- Review email logs at `GET /api/email/log`
- Test connection with `GET /api/email/test`

### JWT Token Errors
- Ensure `JWT_SECRET` is set in `.env`
- Check token hasn't expired (default 7 days)
- Verify token format in Authorization header: `Bearer <token>`

### Port Already in Use
- Change `PORT` in `.env` to an available port
- Or kill the process using the port: `lsof -i :3000`

## Support & Maintenance

For issues or questions, refer to:
- Application logs in `/server/logs/`
- Database error logs
- Hostinger hPanel control panel
- Your hosting provider's support team

---

**AfriVogue Backend** | Built with Node.js & Express
