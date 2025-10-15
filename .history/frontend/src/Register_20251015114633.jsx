import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

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
    <div className="min-h-screen w-screen flex items-center py-0 px-0 bg-white relative overflow-hidden">
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
            <p className="mt-6 text-sm text-gray-500 text-center">Join MedTriage to help save lives through early detection.</p>
          </div>
        </div>

        {/* Right: Register Card */}
        <div className="flex-1 flex items-center justify-end">
          <div className="relative z-10 max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Top: Professional brand panel */}
            <div className="bg-white p-8 flex flex-col items-start justify-center space-y-6">
              <div className="flex items-center space-x-3">
                {/* Simple logo mark */}
                <div className="w-12 h-12 flex items-center justify-center rounded-md bg-indigo-600 text-white font-bold text-lg">MT</div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">MedTriage</h2>
                  <p className="text-sm text-gray-500">Secure clinical triage platform</p>
                </div>
              </div>

              <div className="w-full max-w-xs">
                <h3 className="text-2xl font-semibold text-gray-800">Create your account</h3>
                <p className="mt-2 text-sm text-gray-600">Join our platform to access advanced triage tools and contribute to better patient outcomes.</p>

                <ul className="mt-6 space-y-3 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="mr-3 text-indigo-600 mt-0.5">•</span>
                    <span>Free registration</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-indigo-600 mt-0.5">•</span>
                    <span>Secure data handling</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-indigo-600 mt-0.5">•</span>
                    <span>Professional tools</span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 text-xs text-gray-400">
                <p>By registering, you agree to our terms and privacy policy.</p>
              </div>
            </div>

            {/* Bottom: Form */}
            <div className="p-8 flex items-center justify-center border-t border-gray-100">
              <div className="w-full max-w-md">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">Sign up for MedTriage</h1>
                <p className="text-sm text-gray-500 mb-6">Get started with your free account.</p>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                    <input
                      id="username"
                      type="text"
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={form.email}
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
                    {loading ? 'Creating account...' : 'Create account'}
                  </button>

                  <div className="flex items-center justify-center text-sm text-slate-600">
                    <Link to="/login" className="text-indigo-600 hover:underline">Already have an account? Sign in</Link>
                  </div>
                </form>
                <p className="mt-6 text-xs text-gray-400">Secure registration powered by HIPAA-compliant systems.</p>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}