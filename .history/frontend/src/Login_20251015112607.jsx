import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const [form, setForm] = useState({ username_or_email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('http://127.0.0.1:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error(`Login failed: ${res.status}`)
      const data = await res.json()
      localStorage.setItem('token', data.access_token)
      // Notify other components that auth state changed
      window.dispatchEvent(new Event('auth-change'))
      // After storing the token, probe the profile endpoint to detect the
      // user's role so admins can be sent straight to the Admin dashboard.
      try {
        const profileRes = await fetch('http://127.0.0.1:8000/auth/profile', {
          headers: { 'Authorization': `Bearer ${data.access_token}` },
        })
        if (profileRes.ok) {
          const profile = await profileRes.json()
          if (profile.role === 'admin') {
              // Persist admin token for Admin UI convenience and replace history so back doesn't go to login
              try { localStorage.setItem('medtriage_admin_token', `Bearer ${data.access_token}`) } catch (e) {}
              navigate('/admin-dashboard', { replace: true })
            return
          }
        }
      } catch (e) {
        // ignore profile fetch errors and fall back to profile page
      }

      navigate('/profile')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Diagnostic-themed background SVG: faint grid + ECG waveform + medical icons */}
      <svg aria-hidden="true" className="fixed inset-0 pointer-events-none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
        <defs>
          <linearGradient id="ecgGrad" x1="0" x2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f1f5f9" />
          </linearGradient>
        </defs>
        <rect width="1200" height="800" fill="url(#ecgGrad)" />

        {/* faint clinical grid */}
        <g stroke="#0f172a" strokeWidth="1" opacity="0.04">
          {Array.from({ length: 25 }).map((_, i) => {
            const x = i * 48
            return <line key={`vx-${i}`} x1={x} y1={0} x2={x} y2={800} />
          })}
          {Array.from({ length: 17 }).map((_, i) => {
            const y = i * 48
            return <line key={`hy-${i}`} x1={0} y1={y} x2={1200} y2={y} />
          })}
        </g>

        {/* ECG waveform path - low contrast and centered */}
        <g transform="translate(80,420)" stroke="#0f172a" strokeWidth="3" fill="none" opacity="0.12">
          <path d="M0 0 L40 0 L56 -36 L72 48 L88 -48 L120 0 L200 0 L216 -24 L232 12 L248 -60 L280 0 L360 0 L376 -20 L392 8 L408 -40 L444 0 L520 0 L560 -50 L600 60 L640 -20 L680 0 L760 0" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* small medical icons (cross, stethoscope circle) */}
        <g transform="translate(920,120)" opacity="0.06" fill="#0f172a">
          <rect x="0" y="0" width="160" height="160" rx="20" />
          <g transform="translate(40,40)" fill="#fff">
            <rect x="30" y="0" width="20" height="60" rx="3" />
            <rect x="0" y="20" width="80" height="20" rx="3" />
          </g>
        </g>

        {/* subtle pulse circles */}
        <g opacity="0.05" fill="#0f172a">
          <circle cx="1000" cy="640" r="60" />
          <circle cx="110" cy="700" r="90" />
        </g>
      </svg>

      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-transparent relative overflow-hidden">

      <div className="relative z-10 max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left: Cartoon illustration panel */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center rounded-l-2xl overflow-hidden">
          <svg viewBox="0 0 400 600" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#dbeafe" />
                <stop offset="100%" stopColor="#e0e7ff" />
              </linearGradient>
            </defs>
            <rect width="400" height="600" fill="url(#bgGrad)" />

            {/* Cartoon Doctor */}
            <g transform="translate(150,150)">
              <circle cx="50" cy="40" r="35" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
              <circle cx="45" cy="35" r="3" fill="#000" />
              <circle cx="55" cy="35" r="3" fill="#000" />
              <path d="M50 45 Q45 50 50 55 Q55 50 50 45" fill="#000" />
              <rect x="35" y="55" width="30" height="45" fill="#3b82f6" rx="5" />
              <rect x="25" y="55" width="10" height="25" fill="#1f2937" rx="2" />
              <rect x="65" y="55" width="10" height="25" fill="#1f2937" rx="2" />
              <rect x="40" y="100" width="20" height="30" fill="#10b981" rx="2" />
            </g>

            {/* Stethoscope */}
            <g transform="translate(100,200)">
              <circle cx="50" cy="50" r="8" fill="#ef4444" />
              <line x1="50" y1="58" x2="50" y2="80" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
              <line x1="42" y1="65" x2="58" y2="65" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
              <circle cx="30" cy="65" r="5" fill="#ef4444" />
              <circle cx="70" cy="65" r="5" fill="#ef4444" />
            </g>

            {/* ECG Waveform */}
            <g transform="translate(50,350)" stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M0 0 L40 0 L50 -15 L60 25 L70 -25 L90 0 L130 0 L140 -10 L150 8 L160 -30 L180 0 L220 0 L240 -20 L260 15 L280 -10 L300 0 L340 0" />
            </g>

            {/* Heart Icon */}
            <g transform="translate(300,400)">
              <path d="M10 20 C10 15, 5 10, 0 15 C-5 10, -10 15, -10 20 C-10 25, -5 30, 0 25 C5 30, 10 25, 10 20 Z" fill="#ef4444" />
            </g>

            {/* Welcome Text */}
            <text x="200" y="480" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" fill="#1f2937" textAnchor="middle">Welcome to MedTriage</text>
            <text x="200" y="505" fontFamily="Arial, sans-serif" fontSize="14" fill="#6b7280" textAnchor="middle">AI-Powered Medical Triage</text>
            <text x="200" y="525" fontFamily="Arial, sans-serif" fontSize="12" fill="#9ca3af" textAnchor="middle">Secure • Fast • Reliable</text>
          </svg>
        </div>

        {/* Right: Form */}
        <div className="p-8 flex items-center justify-center">
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Sign in to MedTriage</h1>
            <p className="text-sm text-gray-500 mb-6">Fast. Secure. Professional.</p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="username_or_email" className="block text-sm font-medium text-gray-700 mb-2">Username or Email</label>
                <input
                  id="username_or_email"
                  type="text"
                  name="username_or_email"
                  value={form.username_or_email}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  required
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <Link to="/register" className="text-indigo-600 hover:underline">Create account</Link>
                <a href="#" className="hover:underline">Forgot password?</a>
              </div>
            </form>
            <p className="mt-6 text-xs text-gray-400">By signing in you agree to our terms and privacy policy.</p>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}