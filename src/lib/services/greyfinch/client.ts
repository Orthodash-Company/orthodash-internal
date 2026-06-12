import { GQL_LOGIN, GQL_TEST_CONNECTION } from './queries'

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
  private readonly maxRetries: number

  constructor() {
    this.apiUrl = 'https://connect-api.greyfinch.com/v1/graphql'
    this.apiKey = process.env.GREYFINCH_API_KEY || ''
    this.apiSecret = process.env.GREYFINCH_API_SECRET || ''
    this.requestTimeoutMs = 120000
    this.maxRetries = 3
  }

  private createTimeoutController(externalSignal?: AbortSignal) {
    const controller = new AbortController()
    let timedOut = false
    const timeoutId = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, this.requestTimeoutMs)
    const abortFromExternal = () => controller.abort(externalSignal?.reason)
    externalSignal?.addEventListener('abort', abortFromExternal, { once: true })
    return {
      controller,
      timedOut: () => timedOut,
      cleanup: () => {
        clearTimeout(timeoutId)
        externalSignal?.removeEventListener('abort', abortFromExternal)
      },
    }
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
    jwtToken?: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<T> {
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      options.signal?.throwIfAborted()
      const result = await this.tryPostGraphQL<T>(body, jwtToken, attempt, options)
      if (result.retryAfterMs == null) return result.data
      await this.sleep(result.retryAfterMs, options.signal)
    }

    throw new Error('Greyfinch rate limit retries exhausted')
  }

  private sleep(ms: number, signal?: AbortSignal) {
    return new Promise<void>((resolve, reject) => {
      if (signal?.aborted) {
        reject(signal.reason ?? new DOMException('Aborted', 'AbortError'))
        return
      }
      const timeoutId = setTimeout(resolve, ms)
      const onAbort = () => {
        clearTimeout(timeoutId)
        reject(signal?.reason ?? new DOMException('Aborted', 'AbortError'))
      }
      signal?.addEventListener('abort', onAbort, { once: true })
    })
  }

  private async tryPostGraphQL<T>(
    body: { query: string; variables?: Record<string, unknown> },
    jwtToken: string | undefined,
    attempt: number,
    options: { signal?: AbortSignal },
  ): Promise<{ data: T; retryAfterMs?: undefined } | { data?: undefined; retryAfterMs: number }> {
    const { controller, timedOut, cleanup } = this.createTimeoutController(options.signal)
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
      const remaining = Number(response.headers.get('x-ratelimit-remaining'))
      const resetSeconds = Number(response.headers.get('x-ratelimit-reset'))

      if (response.status === 429) {
        const retryAfterSeconds = Number(response.headers.get('retry-after')) || resetSeconds || 5
        console.warn(`[greyfinch] 429 rate limited. Retrying in ${retryAfterSeconds}s`)
        return { retryAfterMs: retryAfterSeconds * 1000 }
      }

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`GraphQL request failed: ${response.status} - ${errorText}`)
      }
      const data = await this.parseGraphQLResponse<T>(response)

      if (Number.isFinite(remaining) && remaining <= 5 && Number.isFinite(resetSeconds) && resetSeconds > 0 && attempt < this.maxRetries) {
        const pauseMs = Math.min(resetSeconds * 1000, 5000)
        console.warn(`[greyfinch] Low rate limit remaining (${remaining}). Pausing ${pauseMs}ms`)
        await this.sleep(pauseMs)
      }

      return { data }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        if (timedOut()) {
          throw new Error(`Greyfinch request timed out after ${this.requestTimeoutMs / 1000}s`)
        }
        throw error
      }
      throw error
    } finally {
      cleanup()
    }
  }

  private async ensureJwtToken(options: { signal?: AbortSignal } = {}): Promise<string> {
    if (this.jwtToken) return this.jwtToken
    this.jwtToken = await this.getJWTToken(options)
    if (!this.jwtToken) throw new Error('Failed to obtain JWT token')
    return this.jwtToken
  }

  private async getJWTToken(options: { signal?: AbortSignal } = {}): Promise<string | null> {
    try {
      const data = await this.postGraphQL<{ apiLogin?: { accessToken?: string } }>({
        query: GQL_LOGIN,
        variables: { key: this.apiKey, secret: this.apiSecret },
      }, undefined, options)
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

  async makeGraphQLRequest(query: string, variables: Record<string, unknown> = {}, options: { signal?: AbortSignal } = {}) {
    const jwtToken = await this.ensureJwtToken(options)
    return this.postGraphQL<Record<string, unknown>>({ query, variables }, jwtToken, options)
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
