# QuickBooks Desktop API Integration Guide

This guide will help you set up QuickBooks Desktop API integration to pull real revenue data into your OrthoDash application.

## 📋 Prerequisites

1. **QuickBooks Desktop** (Pro, Premier, or Enterprise)
2. **Intuit Developer Account** (free)
3. **QuickBooks Desktop API Subscription** (required for production)

## 🚀 Step 1: Create Intuit Developer Account

1. Go to [Intuit Developer](https://developer.intuit.com/)
2. Sign up for a free developer account
3. Verify your email address

## 🔧 Step 2: Create a QuickBooks Desktop App

1. Log into your Intuit Developer account
2. Click "Create an App"
3. Select "QuickBooks Desktop" as the platform
4. Fill in the app details:
   - **App Name**: OrthoDash Integration
   - **Description**: Revenue data integration for orthodontic practice management
   - **Contact Email**: Your email address
5. Select the scopes you need:
   - `com.intuit.quickbooks.accounting` (for invoices, payments, customers)
   - `com.intuit.quickbooks.payment` (for payment processing)
6. Save your app

## 🔑 Step 3: Get Your API Credentials

After creating your app, you'll receive:

1. **Consumer Key** (Client ID)
2. **Consumer Secret** (Client Secret)
3. **Sandbox Company ID** (for testing)

## 💻 Step 4: Configure OrthoDash

1. **Add Environment Variables** to your `.env.local` file:

```env
# QuickBooks Desktop API Configuration
QUICKBOOKS_CONSUMER_KEY=your_consumer_key_here
QUICKBOOKS_CONSUMER_SECRET=your_consumer_secret_here
QUICKBOOKS_ACCESS_TOKEN=your_access_token_here
QUICKBOOKS_ACCESS_TOKEN_SECRET=your_refresh_token_here
QUICKBOOKS_COMPANY_ID=your_company_id_here
QUICKBOOKS_SANDBOX=true
```

2. **Start your development server**:
   ```bash
   npm run dev
   ```

## 🔗 Step 5: Connect QuickBooks

1. **Open OrthoDash** in your browser
2. **Click "Setup QuickBooks"** in the QuickBooks Revenue Integration section
3. **Enter your credentials**:
   - Consumer Key
   - Consumer Secret
   - Company ID (for production)
4. **Click "Generate Auth URL"**
5. **Authorize the app** with QuickBooks
6. **Test the connection**

## 📊 Step 6: Verify Data Integration

Once connected, you should see:

- ✅ **Connection Status**: Connected
- 📈 **Revenue Data**: Real data from QuickBooks
- 🏢 **Location Breakdown**: Revenue by location
- 📋 **Transaction Count**: Number of invoices/payments

## 🎯 What Data Gets Pulled

The integration pulls the following data from QuickBooks:

### Revenue Data
- **Invoices**: All invoices with amounts, dates, and customer info
- **Payments**: Payment records with amounts and methods
- **Credit Memos**: Refunds and credits
- **Location Data**: Revenue breakdown by location

### Customer Data
- **Customer Information**: Names, emails, phone numbers
- **Account Balances**: Outstanding balances
- **Revenue History**: Total revenue per customer

### Financial Reports
- **Profit & Loss**: Revenue vs expenses
- **Revenue Metrics**: Growth rates, averages
- **Location Performance**: Revenue by location

## 🔄 Data Sync

- **Real-time**: Data is fetched when you load the dashboard
- **Date Range**: Configurable date ranges for analysis
- **Caching**: Data is cached for performance

## 🛠️ Troubleshooting

### Common Issues

1. **"Connection Failed"**
   - Verify your Consumer Key and Secret
   - Check if QuickBooks Desktop is running
   - Ensure your app is approved for the required scopes

2. **"No Revenue Data"**
   - Check your date range selection
   - Verify you have invoices/payments in QuickBooks
   - Ensure your Company ID is correct

3. **"OAuth Authorization Failed"**
   - Clear browser cache and try again
   - Check if your redirect URL is correct
   - Verify your app is in sandbox mode for testing

### Debug Mode

Enable debug mode by checking the browser console for detailed error messages.

## 📱 Production Setup

For production use:

1. **Upgrade to Production App** in Intuit Developer
2. **Get Production Credentials**
3. **Set `QUICKBOOKS_SANDBOX=false`**
4. **Update Company ID** to production company
5. **Test thoroughly** before going live

## 🔒 Security Best Practices

- **Never commit** your `.env` file to version control
- **Use environment variables** for all credentials
- **Rotate keys** regularly
- **Monitor API usage** for unusual activity

## 📞 Support

If you encounter issues:

1. Check the [QuickBooks Desktop API Documentation](https://developer.intuit.com/app/developer/qbdesktop/docs/get-started)
2. Review the [Intuit Developer Forums](https://help.developer.intuit.com/)
3. Contact Intuit Support for API-specific issues

## 🎉 Success!

Once set up, your OrthoDash will display real revenue data from QuickBooks instead of the $0 fallback values. You'll be able to:

- Track real revenue over time
- Analyze performance by location
- Generate accurate financial reports
- Make data-driven business decisions

The integration provides a seamless bridge between your QuickBooks financial data and your practice management analytics.
