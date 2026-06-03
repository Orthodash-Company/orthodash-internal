// Confirmed GraphQL queries for Greyfinch API (verified via Postman, March 2026)


// Confirmed via Postman — all dashboard locations share this timezone
export const PRACTICE_TZ = 'America/Phoenix'

// The two active dashboard locations — data comes from Greyfinch, filtered by these UUIDs
export const GILBERT_UUID = '097eb1d8-ec62-45d9-8c21-d08af1cf66c8'
export const PHOENIX_UUID = '4a2bf9bd-222b-4690-9d12-5fc95daa7d93'
export const DASHBOARD_LOCATION_IDS = [GILBERT_UUID, PHOENIX_UUID] as const

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

export const GQL_TEST_CONNECTION = `
  query TestConnection {
    __typename
  }
`

export const GQL_PATIENTS_FOR_PERIOD_WITH_SCHEDULING_STATUS = `
  query GetPatientsForPeriodWithSchedulingStatus(
    $createdAtGte: timestamp!
    $createdAtLt: timestamp!
    $locationIds: [uuid!]!
  ) {
    patients(
      where: {
        createdAt: {
          _gte: $createdAtGte
          _lt: $createdAtLt
        }
        primaryLocation: {
          id: {
            _in: $locationIds
          }
        }
      }
      orderBy: { person: { firstName: ASC } }
    ) {
      id
      createdAt
      person {
        id
        firstName
        lastName
        birthDate
      }
      primaryLocation {
        id
        name
      }
      appointments(orderBy: { createdAt: ASC }) {
        id
        createdAt
        type {
          id
          name
        }
        bookings(orderBy: { startTime: ASC }) {
          id
          startTime
          localStartDate
          localStartTime
          checkInTime
          seatTime
        }
      }
    }
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
