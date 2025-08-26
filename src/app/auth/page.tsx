export default function Auth() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Redirecting...</h1>
        <p className="text-gray-600">Please wait while we redirect you to the login page.</p>
        <script dangerouslySetInnerHTML={{
          __html: `
            setTimeout(() => {
              window.location.href = '/login';
            }, 1000);
          `
        }} />
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic';
