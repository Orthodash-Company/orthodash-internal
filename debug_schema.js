// Simple script to parse GraphQL schema and find available query fields
import fs from 'fs';

try {
  const data = JSON.parse(fs.readFileSync('schema.json', 'utf8'));
  const schema = data.__schema;
  const queryTypeName = schema.queryType.name;
  
  console.log(`Query Root Type: ${queryTypeName}`);
  console.log('\nAvailable Query Fields:');
  
  // Find the query root type definition
  const queryType = schema.types.find(t => t.name === queryTypeName);
  if (queryType && queryType.fields) {
    queryType.fields.forEach((field, index) => {
      if (index < 15) { // Show first 15 fields
        console.log(`  - ${field.name}: ${field.type.name || field.type.kind}`);
      }
    });
    
    if (queryType.fields.length > 15) {
      console.log(`  ... and ${queryType.fields.length - 15} more fields`);
    }
  }
} catch (error) {
  console.error('Error parsing schema:', error.message);
}