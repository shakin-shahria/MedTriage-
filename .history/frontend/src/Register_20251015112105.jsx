import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
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
      const res = await fetch('http://127.0.0.1:8000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error(`Registration failed: ${res.status}`)
      await res.json()
      navigate('/login')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center py-12 px-4">
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
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Register</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account? <a href="/login" className="text-blue-600 hover:underline">Login</a>
        </p>
      </div>
    </div>
  )
}