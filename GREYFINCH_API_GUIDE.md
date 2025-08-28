# Greyfinch GraphQL API Integration Guide

## Overview

This guide covers the integration with **Greyfinch Connect GraphQL API** (v1.0 beta) for accessing practice management data including patients, treatments, appointments, documents, and more.

## Field Naming Conventions

### Key Principles

1. **All field names use `camelCase`** (e.g., `birthDate`, `patientId`, `firstName`)
2. **Types are GraphQL scalar types** (e.g., `String`, `date`, `uuid`, `Boolean`)
3. **Enums and objects have specific types** (e.g., `Gender`, `Title`, `AppointmentStatus`)

### Common Field Patterns

#### Patient Fields
```graphql
{
  id: "uuid"
  firstName: "String"
  lastName: "String"
  middleName: "String"
  birthDate: "date"
  gender: "Gender"
  title: "Title"
  email: "String"
  phone: "String"
  address: "String"
  primaryLocation: "Location"
  createdAt: "timestamp"
  updatedAt: "timestamp"
}
```

#### Location Fields
```graphql
{
  id: "uuid"
  name: "String"
  address: "String"
  phone: "String"
  email: "String"
  isActive: "Boolean"
  createdAt: "timestamp"
  updatedAt: "timestamp"
}
```

#### Appointment Fields
```graphql
{
  id: "uuid"
  patientId: "uuid"
  locationId: "uuid"
  appointmentType: "String"
  status: "AppointmentStatus"
  scheduledDate: "timestamp"
  actualDate: "timestamp"
  duration: "Integer"
  notes: "String"
  createdAt: "timestamp"
  updatedAt: "timestamp"
}
```

## Schema Introspection

### Using the Schema Endpoint

The application provides a schema introspection endpoint at `/api/greyfinch/schema` for exploring the API:

#### Get Full Schema
```bash
GET /api/greyfinch/schema
```

#### Introspect Specific Type
```bash
GET /api/greyfinch/schema?action=introspect&type=Patient
```

#### Get Available Fields for Type
```bash
GET /api/greyfinch/schema?action=fields&type=Patient
```

#### Validate Query
```bash
GET /api/greyfinch/schema?action=validate&query=query{patients{id}}
```

#### Get Known Field Patterns
```bash
GET /api/greyfinch/schema?action=patterns
```

### Custom GraphQL Queries

You can also execute custom GraphQL queries via POST:

```bash
POST /api/greyfinch/schema
Content-Type: application/json

{
  "query": "query GetPatients { patients { id firstName lastName } }",
  "variables": {}
}
```

## Common GraphQL Queries

### Basic Patient Query
```graphql
query GetPatients {
  patients {
    id
    firstName
    lastName
    middleName
    birthDate
    gender
    title
    email
    phone
    primaryLocation {
      id
      name
    }
    createdAt
    updatedAt
  }
}
```

### Basic Location Query
```graphql
query GetLocations {
  locations {
    id
    name
    address
    phone
    email
    isActive
    createdAt
    updatedAt
  }
}
```

### Basic Appointment Query
```graphql
query GetAppointments {
  appointments {
    id
    patientId
    locationId
    appointmentType
    status
    scheduledDate
    actualDate
    duration
    notes
    createdAt
    updatedAt
  }
}
```

### Basic Lead Query
```graphql
query GetLeads {
  leads {
    id
    firstName
    lastName
    email
    phone
    source
    status
    createdAt
    updatedAt
  }
}
```

### Basic Booking Query
```graphql
query GetBookings {
  appointmentBookings {
    id
    appointmentId
    startTime
    endTime
    localStartDate
    localStartTime
    timezone
    createdAt
    updatedAt
  }
}
```

## Common Mutations

### Create Patient
```graphql
mutation CreatePatient($input: PatientsSetInput!) {
  addPatient(input: $input) {
    patient {
      id
      firstName
      lastName
      birthDate
      gender
      title
    }
  }
}
```

Variables:
```json
{
  "input": {
    "firstName": "Alice",
    "lastName": "Smith",
    "birthDate": "1990-05-15",
    "gender": "FEMALE",
    "title": "Ms"
  }
}
```

### Update Patient
```graphql
mutation UpdatePatient($id: uuid!, $input: PatientsSetInput!) {
  updatePatient(id: $id, input: $input) {
    patient {
      id
      firstName
      lastName
      birthDate
      gender
      title
    }
  }
}
```

## Error Handling

### Common Error Types

1. **Field Errors**: Incorrect field names or casing
2. **Authentication Errors**: Invalid API credentials
3. **Schema Errors**: Unknown types or invalid queries

### Error Detection and Correction

The application includes automatic error detection and field name correction:

```typescript
import { GreyfinchErrorHandler } from '@/lib/services/greyfinch-schema'

// Check if error is field-related
if (GreyfinchErrorHandler.isFieldError(error)) {
  const fieldName = GreyfinchErrorHandler.getFieldNameFromError(error)
  const suggestion = GreyfinchErrorHandler.suggestCorrection(fieldName)
  console.log(`Field "${fieldName}" should be "${suggestion}"`)
}
```

### Common Field Corrections

| Incorrect | Correct |
|-----------|---------|
| `first_name` | `firstName` |
| `last_name` | `lastName` |
| `birth_date` | `birthDate` |
| `patient_id` | `patientId` |
| `location_id` | `locationId` |
| `appointment_type` | `appointmentType` |
| `scheduled_date` | `scheduledDate` |
| `created_at` | `createdAt` |
| `updated_at` | `updatedAt` |
| `is_active` | `isActive` |

## Development Tools

### Schema Utilities

The application provides utilities for working with the Greyfinch API:

```typescript
import { GreyfinchSchemaUtils } from '@/lib/services/greyfinch-schema'

// Validate field names
const isValid = GreyfinchSchemaUtils.validateFieldName('firstName', 'PATIENT')

// Get field type
const fieldType = GreyfinchSchemaUtils.getFieldType('firstName', 'PATIENT')

// Convert naming conventions
const camelCase = GreyfinchSchemaUtils.toCamelCase('first_name')
const snakeCase = GreyfinchSchemaUtils.toSnakeCase('firstName')

// Introspect schema
const schema = await GreyfinchSchemaUtils.introspectSchema()

// Get type fields
const fields = await GreyfinchSchemaUtils.getTypeFields('Patient')

// Validate query
const validation = GreyfinchSchemaUtils.validateQuery(query)
```

### Query Generation

Generate proper GraphQL queries with validation:

```typescript
const query = GreyfinchSchemaUtils.generateQuery(
  'query',
  'GetPatients',
  {
    'patients': {
      'id': true,
      'firstName': true,
      'lastName': true
    }
  },
  'PATIENT'
)
```

## Troubleshooting

### 1. Field Name Errors

**Problem**: `Cannot query field "first_name" on type "Patient"`

**Solution**: Use camelCase field names
```graphql
# Incorrect
query { patients { first_name } }

# Correct
query { patients { firstName } }
```

### 2. Authentication Errors

**Problem**: `401 Unauthorized`

**Solution**: 
- Verify API key and secret are correct
- Check environment variables: `GREYFINCH_API_KEY`, `GREYFINCH_API_SECRET`
- Ensure credentials are properly stored in database

### 3. Schema Changes

**Problem**: Fields that worked before are now invalid

**Solution**: 
- Check the changelog at [connect.greyfinch.com/changelog](https://connect.greyfinch.com/changelog)
- Use schema introspection to discover current field names
- Update queries to match current schema

### 4. Type Errors

**Problem**: `Unknown type "PatientInput"`

**Solution**:
- Use schema introspection to discover available types
- Check for typos in type names
- Verify the API version you're using

## Best Practices

1. **Always use camelCase** for field names
2. **Validate queries** before execution
3. **Handle errors gracefully** with proper error detection
4. **Use schema introspection** for development
5. **Monitor API changes** via changelog
6. **Test with small queries** before complex operations
7. **Cache schema information** when possible
8. **Use TypeScript** for type safety

## API Reference Links

- [Document Object](https://connect.greyfinch.com/api-reference/types/patient/objects/document)
- [PatientsSetInput](https://connect.greyfinch.com/api-reference/types/miscellaneous/inputs/patients-set-input)
- [AppResourceInput](https://connect.greyfinch.com/api-reference/types/miscellaneous/inputs/app-resource-input)
- [Changelog](https://connect.greyfinch.com/changelog)
- [Troubleshooting](https://connect.greyfinch.com/troubleshooting)

## Example Integration

```typescript
import { greyfinchService } from '@/lib/services/greyfinch'
import { GREYFINCH_QUERIES } from '@/lib/services/greyfinch-schema'

// Pull patient data with proper field naming
const patientData = await greyfinchService.makeGraphQLRequest(
  GREYFINCH_QUERIES.GET_PATIENTS
)

// Handle errors with automatic correction
try {
  const result = await greyfinchService.makeGraphQLRequest(query)
} catch (error) {
  if (GreyfinchErrorHandler.isFieldError(error)) {
    const fieldName = GreyfinchErrorHandler.getFieldNameFromError(error)
    const suggestion = GreyfinchErrorHandler.suggestCorrection(fieldName)
    console.log(`Fix field name: ${fieldName} → ${suggestion}`)
  }
}
```

This guide should help you work effectively with the Greyfinch GraphQL API while avoiding common field naming and schema issues.
