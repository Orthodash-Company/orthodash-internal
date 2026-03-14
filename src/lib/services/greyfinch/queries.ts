// Confirmed GraphQL queries for Greyfinch API (verified via Postman, March 2026)


// Confirmed via Postman — all dashboard locations share this timezone
export const PRACTICE_TZ = 'America/Phoenix'

export const GQL_LOGIN = `
  mutation Login($key: String!, $secret: String!) {
    apiLogin(key: $key, secret: $secret) {
      accessToken
      status
      accessTokenExpiresIn
    }
  }
`

export const GQL_LOCATIONS = `
  query GetLocations {
    locations {
      id
      name
      timeZone
    }
  }
`

export const GQL_BASIC_COUNTS = `
  query GetBasicCounts {
    patients {
      id
    }
    leads {
      id
    }
    appointmentBookings {
      id
    }
  }
`

export const GQL_TEST_CONNECTION = `
  query TestConnection {
    __typename
  }
`

// ─── Report mutations ─────────────────────────────────────────────────────────

export const GQL_EXECUTE_REPORT = `
  mutation ExecReport($type: ReportTypeEnum!, $params: jsonb!) {
    executeReport(type: $type, params: $params) {
      reportExecutionId
    }
  }
`

export const GQL_POLL_REPORT = `
  query PollReport($id: uuid!) {
    reportExecution(id: $id) {
      status
      url
    }
  }
`
