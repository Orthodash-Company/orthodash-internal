import { GQL_LOGIN, GQL_TEST_CONNECTION } from './greyfinch-queries'

type GraphQLResponse<T> = {
  data?: T
  errors?: Array<{ message?: string }>
}

export class GreyfinchService {
  private readonly apiUrl: string
  private apiKey: string
  private apiSecret: string
  private jwtToken: string | null = null
  private readonly requestTimeoutMs: number

  constructor() {
    this.apiUrl = 'https://connect-api.greyfinch.com/v1/graphql'
    this.apiKey = process.env.GREYFINCH_API_KEY || ''
    this.apiSecret = process.env.GREYFINCH_API_SECRET || ''
    this.requestTimeoutMs = 120000
  }

  private createTimeoutController() {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeoutMs)
    return { controller, cleanup: () => clearTimeout(timeoutId) }
  }

  private async parseGraphQLResponse<T>(response: Response): Promise<T> {
    const responseText = await response.text()
    let data: GraphQLResponse<T>
    try {
      data = JSON.parse(responseText) as GraphQLResponse<T>
    } catch {
      throw new Error('Invalid JSON response from Greyfinch')
    }
    if (data.errors?.length) {
      throw new Error(
        `GraphQL errors: ${data.errors.map((e) => e.message || 'Unknown GraphQL error').join(', ')}`
      )
    }
    if (!data.data) {
      throw new Error('Missing data in Greyfinch response')
    }
    return data.data
  }

  private async postGraphQL<T>(
    body: { query: string; variables?: Record<string, unknown> },
    jwtToken?: string
  ): Promise<T> {
    const { controller, cleanup } = this.createTimeoutController()
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {}),
        },
        signal: controller.signal,
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`GraphQL request failed: ${response.status} - ${errorText}`)
      }
      return await this.parseGraphQLResponse<T>(response)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error(`Greyfinch request timed out after ${this.requestTimeoutMs / 1000}s`)
      }
      throw error
    } finally {
      cleanup()
    }
  }

  private async ensureJwtToken(): Promise<string> {
    if (this.jwtToken) return this.jwtToken
    this.jwtToken = await this.getJWTToken()
    if (!this.jwtToken) throw new Error('Failed to obtain JWT token')
    return this.jwtToken
  }

  private async getJWTToken(): Promise<string | null> {
    try {
      const data = await this.postGraphQL<{ apiLogin?: { accessToken?: string } }>({
        query: GQL_LOGIN,
        variables: { key: this.apiKey, secret: this.apiSecret },
      })
      if (data.apiLogin?.accessToken) {
        this.jwtToken = data.apiLogin.accessToken
        console.log('[greyfinch] JWT obtained')
        return data.apiLogin.accessToken
      }
      return null
    } catch (error) {
      console.error('[greyfinch] JWT error:', error)
      return null
    }
  }

  updateCredentials(apiKey: string, apiSecret?: string) {
    this.apiKey = apiKey
    if (apiSecret) this.apiSecret = apiSecret
    this.jwtToken = null
  }

  async makeGraphQLRequest(query: string, variables: Record<string, unknown> = {}) {
    const jwtToken = await this.ensureJwtToken()
    return this.postGraphQL<Record<string, unknown>>({ query, variables }, jwtToken)
  }

  async testConnection() {
    try {
      if (!this.apiKey) {
        return { success: false, message: 'Greyfinch API key is not configured.', error: 'MISSING_API_KEY', data: null }
      }
      const data = await this.makeGraphQLRequest(GQL_TEST_CONNECTION)
      return { success: true, data, message: 'Connected to Greyfinch API', error: null }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
        error: 'CONNECTION_FAILED',
        data: null,
      }
    }
  }
}

export const greyfinchService = new GreyfinchService()
