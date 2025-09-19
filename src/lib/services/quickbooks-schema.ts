// QuickBooks Desktop API Schema and Query Definitions
// This file contains all the GraphQL queries and mutations for QuickBooks Desktop API

export interface QuickBooksConfig {
  consumerKey: string
  consumerSecret: string
  accessToken?: string
  accessTokenSecret?: string
  companyId?: string
  sandbox?: boolean
}

export interface QuickBooksRevenueData {
  id: string
  date: string
  amount: number
  location: string
  customer: string
  item: string
  description: string
  type: 'invoice' | 'payment' | 'credit_memo' | 'refund'
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
}

export interface QuickBooksCustomerData {
  id: string
  name: string
  email: string
  phone: string
  address: string
  location: string
  totalRevenue: number
  lastPaymentDate: string
  outstandingBalance: number
}

export interface QuickBooksLocationData {
  id: string
  name: string
  totalRevenue: number
  monthlyRevenue: number
  customerCount: number
  averageRevenuePerCustomer: number
  lastUpdated: string
}

// QuickBooks Desktop API Queries
export const QUICKBOOKS_QUERIES = {
  // Get revenue data by date range and location
  GET_REVENUE_DATA: `
    query GetRevenueData($startDate: String!, $endDate: String!, $location: String) {
      # Get invoices and payments for revenue tracking
      invoices(where: { 
        date: { gte: $startDate, lte: $endDate }
        ${location ? 'location: { eq: $location }' : ''}
      }) {
        id
        date
        amount
        customer {
          id
          name
          location
        }
        items {
          id
          name
          amount
          description
        }
        status
        createdAt
        updatedAt
      }
      
      # Get payments for revenue tracking
      payments(where: { 
        date: { gte: $startDate, lte: $endDate }
        ${location ? 'location: { eq: $location }' : ''}
      }) {
        id
        date
        amount
        customer {
          id
          name
          location
        }
        invoice {
          id
          amount
        }
        paymentMethod
        status
        createdAt
        updatedAt
      }
      
      # Get credit memos and refunds
      creditMemos(where: { 
        date: { gte: $startDate, lte: $endDate }
        ${location ? 'location: { eq: $location }' : ''}
      }) {
        id
        date
        amount
        customer {
          id
          name
          location
        }
        reason
        status
        createdAt
        updatedAt
      }
    }
  `,

  // Get customer data with revenue metrics
  GET_CUSTOMER_DATA: `
    query GetCustomerData($location: String) {
      customers(where: { 
        ${location ? 'location: { eq: $location }' : ''}
        isActive: { eq: true }
      }) {
        id
        name
        email
        phone
        address
        location
        totalRevenue
        outstandingBalance
        lastPaymentDate
        invoiceCount
        averageInvoiceAmount
        createdAt
        updatedAt
      }
    }
  `,

  // Get location-based revenue summary
  GET_LOCATION_REVENUE: `
    query GetLocationRevenue($startDate: String!, $endDate: String!) {
      locations {
        id
        name
        address
        isActive
        totalRevenue
        monthlyRevenue
        customerCount
        averageRevenuePerCustomer
        lastUpdated
      }
      
      # Get revenue by location for the date range
      revenueByLocation(where: { 
        date: { gte: $startDate, lte: $endDate }
      }) {
        locationId
        locationName
        totalRevenue
        invoiceCount
        paymentCount
        averageInvoiceAmount
        monthlyRevenue
        weeklyRevenue
        dailyRevenue
      }
    }
  `,

  // Get detailed financial reports
  GET_FINANCIAL_REPORTS: `
    query GetFinancialReports($startDate: String!, $endDate: String!, $reportType: String!) {
      financialReport(
        startDate: $startDate
        endDate: $endDate
        reportType: $reportType
      ) {
        reportId
        reportType
        startDate
        endDate
        totalRevenue
        totalExpenses
        netIncome
        grossProfit
        grossProfitMargin
        locationBreakdown {
          locationId
          locationName
          revenue
          expenses
          netIncome
          profitMargin
        }
        monthlyBreakdown {
          month
          revenue
          expenses
          netIncome
        }
        weeklyBreakdown {
          week
          revenue
          expenses
          netIncome
        }
        topCustomers {
          customerId
          customerName
          revenue
          invoiceCount
        }
        topItems {
          itemId
          itemName
          revenue
          quantity
        }
        generatedAt
      }
    }
  `,

  // Get real-time revenue metrics
  GET_REVENUE_METRICS: `
    query GetRevenueMetrics($location: String) {
      revenueMetrics(where: { 
        ${location ? 'location: { eq: $location }' : ''}
      }) {
        totalRevenue
        monthlyRevenue
        weeklyRevenue
        dailyRevenue
        averageRevenuePerCustomer
        averageRevenuePerInvoice
        revenueGrowth
        revenueGrowthPercentage
        topRevenueSources {
          source
          revenue
          percentage
        }
        revenueByMonth {
          month
          revenue
          growth
        }
        revenueByWeek {
          week
          revenue
          growth
        }
        lastUpdated
      }
    }
  `
}

// QuickBooks Desktop API Mutations
export const QUICKBOOKS_MUTATIONS = {
  // Create or update customer
  UPSERT_CUSTOMER: `
    mutation UpsertCustomer($input: CustomerInput!) {
      upsertCustomer(input: $input) {
        id
        name
        email
        phone
        address
        location
        isActive
        createdAt
        updatedAt
      }
    }
  `,

  // Create invoice
  CREATE_INVOICE: `
    mutation CreateInvoice($input: InvoiceInput!) {
      createInvoice(input: $input) {
        id
        date
        amount
        customer {
          id
          name
        }
        items {
          id
          name
          amount
        }
        status
        createdAt
        updatedAt
      }
    }
  `,

  // Record payment
  RECORD_PAYMENT: `
    mutation RecordPayment($input: PaymentInput!) {
      recordPayment(input: $input) {
        id
        date
        amount
        customer {
          id
          name
        }
        invoice {
          id
          amount
        }
        paymentMethod
        status
        createdAt
        updatedAt
      }
    }
  `,

  // Sync revenue data
  SYNC_REVENUE_DATA: `
    mutation SyncRevenueData($input: RevenueSyncInput!) {
      syncRevenueData(input: $input) {
        success
        message
        syncedRecords
        errors
        lastSyncDate
      }
    }
  `
}

// Utility functions for QuickBooks data processing
export class QuickBooksSchemaUtils {
  // Process revenue data into our standard format
  static processRevenueData(qbData: any): QuickBooksRevenueData[] {
    const revenueData: QuickBooksRevenueData[] = []

    // Process invoices
    if (qbData.invoices) {
      qbData.invoices.forEach((invoice: any) => {
        revenueData.push({
          id: invoice.id,
          date: invoice.date,
          amount: parseFloat(invoice.amount) || 0,
          location: invoice.customer?.location || 'Unknown',
          customer: invoice.customer?.name || 'Unknown',
          item: invoice.items?.[0]?.name || 'Invoice',
          description: invoice.items?.[0]?.description || '',
          type: 'invoice',
          status: invoice.status === 'paid' ? 'paid' : 'pending'
        })
      })
    }

    // Process payments
    if (qbData.payments) {
      qbData.payments.forEach((payment: any) => {
        revenueData.push({
          id: payment.id,
          date: payment.date,
          amount: parseFloat(payment.amount) || 0,
          location: payment.customer?.location || 'Unknown',
          customer: payment.customer?.name || 'Unknown',
          item: 'Payment',
          description: `Payment via ${payment.paymentMethod}`,
          type: 'payment',
          status: payment.status === 'completed' ? 'paid' : 'pending'
        })
      })
    }

    // Process credit memos (negative revenue)
    if (qbData.creditMemos) {
      qbData.creditMemos.forEach((creditMemo: any) => {
        revenueData.push({
          id: creditMemo.id,
          date: creditMemo.date,
          amount: -(parseFloat(creditMemo.amount) || 0), // Negative for credit memos
          location: creditMemo.customer?.location || 'Unknown',
          customer: creditMemo.customer?.name || 'Unknown',
          item: 'Credit Memo',
          description: creditMemo.reason || 'Credit memo',
          type: 'credit_memo',
          status: creditMemo.status === 'applied' ? 'paid' : 'pending'
        })
      })
    }

    return revenueData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  // Process customer data
  static processCustomerData(qbData: any): QuickBooksCustomerData[] {
    if (!qbData.customers) return []

    return qbData.customers.map((customer: any) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      location: customer.location || 'Unknown',
      totalRevenue: parseFloat(customer.totalRevenue) || 0,
      lastPaymentDate: customer.lastPaymentDate || '',
      outstandingBalance: parseFloat(customer.outstandingBalance) || 0
    }))
  }

  // Process location data
  static processLocationData(qbData: any): QuickBooksLocationData[] {
    const locationData: QuickBooksLocationData[] = []

    // Process locations
    if (qbData.locations) {
      qbData.locations.forEach((location: any) => {
        locationData.push({
          id: location.id,
          name: location.name,
          totalRevenue: parseFloat(location.totalRevenue) || 0,
          monthlyRevenue: parseFloat(location.monthlyRevenue) || 0,
          customerCount: parseInt(location.customerCount) || 0,
          averageRevenuePerCustomer: parseFloat(location.averageRevenuePerCustomer) || 0,
          lastUpdated: location.lastUpdated || new Date().toISOString()
        })
      })
    }

    // Process revenue by location
    if (qbData.revenueByLocation) {
      qbData.revenueByLocation.forEach((revenue: any) => {
        const existingLocation = locationData.find(loc => loc.id === revenue.locationId)
        if (existingLocation) {
          existingLocation.totalRevenue = parseFloat(revenue.totalRevenue) || 0
          existingLocation.monthlyRevenue = parseFloat(revenue.monthlyRevenue) || 0
        } else {
          locationData.push({
            id: revenue.locationId,
            name: revenue.locationName,
            totalRevenue: parseFloat(revenue.totalRevenue) || 0,
            monthlyRevenue: parseFloat(revenue.monthlyRevenue) || 0,
            customerCount: 0,
            averageRevenuePerCustomer: parseFloat(revenue.averageInvoiceAmount) || 0,
            lastUpdated: new Date().toISOString()
          })
        }
      })
    }

    return locationData
  }

  // Calculate revenue metrics
  static calculateRevenueMetrics(revenueData: QuickBooksRevenueData[]): any {
    const totalRevenue = revenueData.reduce((sum, item) => sum + item.amount, 0)
    const paidRevenue = revenueData.filter(item => item.status === 'paid').reduce((sum, item) => sum + item.amount, 0)
    const pendingRevenue = revenueData.filter(item => item.status === 'pending').reduce((sum, item) => sum + item.amount, 0)

    // Group by location
    const locationBreakdown = revenueData.reduce((acc, item) => {
      if (!acc[item.location]) {
        acc[item.location] = { revenue: 0, count: 0 }
      }
      acc[item.location].revenue += item.amount
      acc[item.location].count += 1
      return acc
    }, {} as Record<string, { revenue: number; count: number }>)

    // Group by month
    const monthlyBreakdown = revenueData.reduce((acc, item) => {
      const month = new Date(item.date).toISOString().substring(0, 7) // YYYY-MM
      if (!acc[month]) {
        acc[month] = { revenue: 0, count: 0 }
      }
      acc[month].revenue += item.amount
      acc[month].count += 1
      return acc
    }, {} as Record<string, { revenue: number; count: number }>)

    return {
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      locationBreakdown,
      monthlyBreakdown,
      averageRevenuePerTransaction: revenueData.length > 0 ? totalRevenue / revenueData.length : 0,
      totalTransactions: revenueData.length
    }
  }
}

export default QuickBooksSchemaUtils
