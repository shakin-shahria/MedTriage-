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
    <div className="min-h-screen flex items-center justify-between py-0 px-0 bg-white relative overflow-hidden">
        {/* Left: Heart Disease Statistics */}
        <div className="flex-1 flex items-center justify-center pr-8 bg-gradient-to-br from-red-50 to-pink-50">
          <div className="max-w-lg w-full p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Heart Disease Facts</h2>
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-red-600 mb-2">1 in 4</div>
                <p className="text-gray-600">deaths in the US are due to heart disease</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-red-600 mb-2">659,000</div>
                <p className="text-gray-600">Americans die from heart disease each year</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-red-600 mb-2">805,000</div>
                <p className="text-gray-600">heart attacks occur annually in the US</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-red-600 mb-2">50%</div>
                <p className="text-gray-600">of heart attacks happen outside hospitals</p>
              </div>
            </div>
            <p className="mt-6 text-sm text-gray-500 text-center">Early detection saves lives. Use MedTriage for instant triage.</p>
          </div>
        </div>

        {/* Right: Login Card */}
        <div className="flex-1 flex items-center justify-end">

      <div className="relative z-10 max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Left: Professional brand panel (replaces cartoon SVG) */}
        <div className="bg-white p-8 flex flex-col items-start justify-center space-y-6">
          <div className="flex items-center space-x-3">
            {/* Simple logo mark */}
            <div className="w-12 h-12 flex items-center justify-center rounded-md bg-slate-800 text-white font-bold text-lg">MT</div>
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
                <span className="mr-3 text-slate-600 mt-0.5">•</span>
                <span>HIPAA-minded access controls</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-slate-600 mt-0.5">•</span>
                <span>Encrypted sessions</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-slate-600 mt-0.5">•</span>
                <span>Audit-ready logs</span>
              </li>
            </ul>
          </div>

          <div className="mt-4 text-xs text-gray-400">
            <p>For organization sign-in, use your institution credentials. Need help? Contact <a href="mailto:support@medtriage.example" className="text-indigo-600">support</a>.</p>
          </div>
        </div>

        {/* Right: Form */}
        <div className="p-8 flex items-center justify-center border-t border-gray-100">
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
                className="w-full px-6 py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <div className="flex items-center justify-between text-sm text-slate-600">
                <Link to="/register" className="text-slate-600 hover:underline">Create account</Link>
                <a href="#" className="hover:underline">Forgot password?</a>
              </div>
            </form>
            <p className="mt-6 text-xs text-gray-400">By signing in you agree to our terms and privacy policy.</p>
          </div>
        </div>
      </div>
    </div>
  )
}