# Dummy Data Documentation

## Overview
This document describes the dummy data that has been created for the NKC e-commerce system to help with testing and development.

## 🎯 What's Included

### 👥 Users (13 total)
- **1 Admin Account**: Full system access
- **8 Retail Customers**: Regular shopping accounts
- **4 Wholesale Customers**: Business accounts with special privileges

### 🛋️ Products (6 items)
- Modern Grey Sofa (Featured, In Stock)
- Oak Dining Table (Featured, In Stock)
- King Size Bed Frame (In Stock)
- Ergonomic Office Chair (In Stock)
- 5-Tier Wooden Bookshelf (In Stock)
- Glass Coffee Table (Out of Stock)

### 📦 Orders (15 total)
- Various statuses: Pending, Confirmed, Shipped, Delivered, Cancelled
- Random dates within the last 30 days
- Different order totals and item quantities

### 🛒 Shopping Carts (5 active carts)
- Pre-filled carts for 5 retail customers
- Various products and quantities

### 📝 Inquiries (6 submissions)
- Different inquiry types: General, Product consultation, Bulk orders, Wholesale account requests
- Mix of individual and business inquiries

### 🏢 Business Profiles (4 profiles)
- Attached to wholesale customers
- Company names, tax IDs, and verification status

## 🔑 Login Credentials

### Admin Account
- **Email**: `admin@nkc.com`
- **Password**: `admin123`
- **Role**: Admin (full access)

### Sample Retail Customer
- **Email**: `alice@example.com`
- **Password**: `password123`
- **Role**: Retail customer

### Sample Wholesale Customer
- **Email**: `john@bigstore.com`
- **Password**: `password123`
- **Role**: Wholesale customer
- **Company**: Big Store Inc.

### All Other Customers
- **Password**: `password123` (for all dummy accounts)
- **Emails**: See the user list in admin panel

## 🛠️ Data Management Commands

### Create Fresh Dummy Data
```bash
npm run data:create
```
This will clear existing data and create fresh dummy data.

### View Data Summary
```bash
npm run data:summary
```
Shows current database statistics and counts.

### Clear All Data
```bash
npm run data:clear
```
⚠️ **Warning**: This will delete ALL data from the database!

## 📊 Testing Scenarios

### Admin Testing
1. Login as admin (`admin@nkc.com`)
2. View user management with real data
3. Check product catalog with various statuses
4. Review order management with different statuses
5. Analyze business metrics and statistics

### Customer Testing
1. Login as retail customer (`alice@example.com`)
2. Browse product catalog
3. Add items to cart (some carts are pre-filled)
4. View profile information

### Wholesale Testing
1. Login as wholesale customer (`john@bigstore.com`)
2. Access wholesale features
3. View business profile information
4. Check special pricing (if implemented)

### Inquiry Testing
1. Visit contact or services pages
2. Submit new inquiries
3. Check admin panel for inquiry management

## 🔄 Data Relationships

The dummy data includes realistic relationships:
- Users have appropriate roles and permissions
- Orders contain multiple items from the product catalog
- Shopping carts belong to specific users
- Business profiles are linked to wholesale customers
- Inquiries include both individual and business requests

## 📈 Analytics Data

The dummy data provides realistic metrics for testing:
- User growth over time
- Product performance (featured vs regular)
- Order status distribution
- Inquiry type analysis
- Revenue calculations

## 🚀 Next Steps

With this dummy data, you can:
1. Test all admin functionality
2. Verify customer workflows
3. Check data visualization components
4. Test search and filtering features
5. Validate business logic and calculations

## 🔧 Customization

To modify the dummy data:
1. Edit `scripts/create-dummy-data.ts`
2. Adjust user counts, product details, or other parameters
3. Run `npm run data:create` to apply changes

## 📝 Notes

- All passwords are set to `password123` for easy testing
- Product images reference placeholder paths
- Company information is fictional
- Dates are randomized within realistic ranges
- All financial data uses realistic pricing
