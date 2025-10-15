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

      <div className="min-h-screen flex items-center justify-end py-12 px-4 bg-transparent relative overflow-hidden">

      <div className="relative z-10 max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Left: Professional brand panel (replaces cartoon SVG) */}
        <div className="bg-white p-8 flex flex-col items-start justify-center space-y-6 border-r border-gray-100">
          <div className="flex items-center space-x-3">
            {/* Simple logo mark */}
            <div className="w-12 h-12 flex items-center justify-center rounded-md bg-indigo-600 text-white font-bold text-lg">MT</div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">MedTriage</h2>
              <p className="text-sm text-gray-500">Secure clinical triage platform</p>
            </div>
          </div>

          <div className="w-full max-w-xs">
            <h3 className="text-2xl font-semibold text-gray-800">Welcome back</h3>
            <p className="mt-2 text-sm text-gray-600">Sign in to access patient triage, clinical decision support, and secure records.</p>

            <ul className="mt-6 space-y-3 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="mr-3 text-indigo-600 mt-0.5">•</span>
                <span>HIPAA-minded access controls</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-indigo-600 mt-0.5">•</span>
                <span>Encrypted sessions</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-indigo-600 mt-0.5">•</span>
                <span>Audit-ready logs</span>
              </li>
            </ul>
          </div>

          <div className="mt-4 text-xs text-gray-400">
            <p>For organization sign-in, use your institution credentials. Need help? Contact <a href="mailto:support@medtriage.example" className="text-indigo-600">support</a>.</p>
          </div>
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