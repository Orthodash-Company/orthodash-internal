export default function NotFound() {
  return (
    <div style={{
      margin: 0,
      padding: 0,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f9fafb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>404</h1>
        <p style={{ color: '#4b5563', marginBottom: '2rem' }}>Page not found</p>
        <a 
          href="/" 
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            textDecoration: 'none',
            display: 'inline-block'
          }}
        >
          Go Home
        </a>
      </div>
    </div>
  )
}
