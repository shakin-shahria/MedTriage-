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

    
    </div>
    </>
  )
}