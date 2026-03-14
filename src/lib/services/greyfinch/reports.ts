// Greyfinch Reports API — confirmed via Postman, March 2026
// Flow: executeReport → poll reportExecution (status: "DONE") → fetch S3 URL → parse JSON

import { greyfinchService } from './client'
import { GQL_EXECUTE_REPORT, GQL_POLL_REPORT } from './queries'

const POLL_INTERVAL_MS = 2000
const MAX_POLLS = 45 // 90 seconds max

export type ReportType =
  | 'PRACTICE_MONITOR'
  | 'PATIENT_REFERRALS'
  | 'PRODUCTION'
  | 'COLLECTIONS'
  | 'PRACTICE_EFFICIENCY'

export interface ReportParams {
  locationIds: string[]
  startDate: string // 'YYYY-MM-DD'
  endDate: string   // 'YYYY-MM-DD'
  financialPayorTypes?: string[]
}

export interface ReportData {
  columns: string[]
  values: unknown[][]
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function executeReport(type: ReportType, params: ReportParams): Promise<string> {
  const result = await greyfinchService.makeGraphQLRequest(GQL_EXECUTE_REPORT, { type, params } as Record<string, unknown>)
  const executionId = (result as { executeReport?: { reportExecutionId?: string } })?.executeReport?.reportExecutionId
  if (!executionId) {
    throw new Error(`executeReport did not return reportExecutionId for ${type}`)
  }
  return executionId
}

async function pollUntilDone(executionId: string): Promise<string> {
  for (let i = 0; i < MAX_POLLS; i++) {
    await sleep(POLL_INTERVAL_MS)
    const result = await greyfinchService.makeGraphQLRequest(GQL_POLL_REPORT, { id: executionId } as Record<string, unknown>)
    const execution = (result as { reportExecution?: { status?: string; url?: string } })?.reportExecution
    if (!execution) {
      throw new Error(`reportExecution(${executionId}) returned null`)
    }
    if (execution.status === 'DONE') {
      if (!execution.url) {
        throw new Error(`Report ${executionId} is DONE but has no URL`)
      }
      return execution.url
    }
    console.log(`[greyfinch-reports] Polling ${executionId}: ${execution.status} (${i + 1}/${MAX_POLLS})`)
  }
  throw new Error(`Report ${executionId} did not complete within ${(MAX_POLLS * POLL_INTERVAL_MS) / 1000}s`)
}

async function fetchS3Report(url: string): Promise<ReportData> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`S3 fetch failed: ${response.status}`)
  }
  const json = await response.json()
  // S3 response shape: { columns: string[], values: unknown[][] }
  if (!Array.isArray(json.columns) || !Array.isArray(json.values)) {
    throw new Error('Unexpected S3 report shape — missing columns or values')
  }
  return { columns: json.columns, values: json.values }
}

export async function fetchReport(type: ReportType, params: ReportParams): Promise<ReportData> {
  console.log(`[greyfinch-reports] Starting ${type} report`)
  const executionId = await executeReport(type, params)
  console.log(`[greyfinch-reports] ${type} executionId: ${executionId}`)
  const s3Url = await pollUntilDone(executionId)
  console.log(`[greyfinch-reports] ${type} DONE, fetching S3 URL`)
  return fetchS3Report(s3Url)
}
