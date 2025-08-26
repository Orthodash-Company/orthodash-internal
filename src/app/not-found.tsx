export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
        
        {/* Giphy GIF */}
        <div className="mb-6 flex justify-center">
          <img 
            src="/giphy.gif" 
            alt="404 Animation" 
            className="max-w-md w-full h-auto rounded-lg shadow-lg"
          />
        </div>
        
        <a 
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic';
