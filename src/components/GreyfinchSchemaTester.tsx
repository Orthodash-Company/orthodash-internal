'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Search, Code, AlertTriangle, CheckCircle } from 'lucide-react'

export function GreyfinchSchemaTester() {
  const [typeName, setTypeName] = useState('Patient')
  const [query, setQuery] = useState('query GetPatients { patients { id firstName lastName } }')
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const testSchemaIntrospection = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/greyfinch/schema?action=introspect&type=${typeName}`)
      const data = await response.json()
      
      if (data.success) {
        setResult(data.data)
        toast({
          title: "Schema Introspection",
          description: `Successfully introspected type: ${typeName}`,
        })
      } else {
        toast({
          title: "Schema Introspection Failed",
          description: data.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to introspect schema",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testQueryValidation = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/greyfinch/schema?action=validate&query=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (data.success) {
        setResult(data.data)
        if (data.data.isValid) {
          toast({
            title: "Query Validation",
            description: "Query is valid!",
          })
        } else {
          toast({
            title: "Query Validation Failed",
            description: `Found ${data.data.errors.length} errors`,
            variant: "destructive"
          })
        }
      } else {
        toast({
          title: "Validation Failed",
          description: data.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to validate query",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testCustomQuery = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/greyfinch/schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })
      const data = await response.json()
      
      if (data.success) {
        setResult(data.data)
        toast({
          title: "Query Execution",
          description: "Query executed successfully!",
        })
      } else {
        toast({
          title: "Query Execution Failed",
          description: data.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to execute query",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getFieldPatterns = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/greyfinch/schema?action=patterns')
      const data = await response.json()
      
      if (data.success) {
        setResult(data.data)
        toast({
          title: "Field Patterns",
          description: "Retrieved field patterns successfully!",
        })
      } else {
        toast({
          title: "Failed to Get Patterns",
          description: data.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get field patterns",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Greyfinch GraphQL Schema Tester
          </CardTitle>
          <CardDescription>
            Test and explore the Greyfinch GraphQL API schema, validate queries, and discover field patterns.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Schema Introspection */}
          <div className="space-y-2">
            <Label htmlFor="typeName">Type Name</Label>
            <div className="flex gap-2">
              <Input
                id="typeName"
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
                placeholder="e.g., Patient, Location, Appointment"
              />
              <Button 
                onClick={testSchemaIntrospection}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Introspect
              </Button>
            </div>
          </div>

          {/* Query Validation */}
          <div className="space-y-2">
            <Label htmlFor="query">GraphQL Query</Label>
            <Textarea
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your GraphQL query here..."
              rows={4}
            />
            <div className="flex gap-2">
              <Button 
                onClick={testQueryValidation}
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Validate
              </Button>
              <Button 
                onClick={testCustomQuery}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Code className="h-4 w-4" />
                Execute
              </Button>
            </div>
          </div>

          {/* Field Patterns */}
          <div className="space-y-2">
            <Button 
              onClick={getFieldPatterns}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Get Field Patterns
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-sm overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Field Naming Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Field Naming Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Key Principles:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>All field names use <code>camelCase</code> (e.g., <code>birthDate</code>, <code>patientId</code>)</li>
                <li>Types are GraphQL scalar types (e.g., <code>String</code>, <code>date</code>, <code>uuid</code>)</li>
                <li>Enums and objects have specific types (e.g., <code>Gender</code>, <code>Title</code>)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Common Field Corrections:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><code>first_name</code> → <code>firstName</code></div>
                <div><code>last_name</code> → <code>lastName</code></div>
                <div><code>birth_date</code> → <code>birthDate</code></div>
                <div><code>patient_id</code> → <code>patientId</code></div>
                <div><code>location_id</code> → <code>locationId</code></div>
                <div><code>created_at</code> → <code>createdAt</code></div>
                <div><code>updated_at</code> → <code>updatedAt</code></div>
                <div><code>is_active</code> → <code>isActive</code></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
