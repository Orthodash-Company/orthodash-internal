// Confirmed GraphQL queries for Greyfinch API (verified via Postman, March 2026)

// The two active dashboard locations — all data fetches are scoped to these UUIDs only
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
