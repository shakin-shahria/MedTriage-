import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Login from './Login'
import Register from './Register'
import Profile from './Profile'
import Admin from './Admin'
import AdminDashboard from './AdminDashboard'
import HeartTriage from './HeartTriage'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [username, setUsername] = useState(null)
  const [role, setRole] = useState(null)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const res = await fetch('http://127.0.0.1:8000/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` },
          })
          setIsAuthenticated(res.ok)
          if (res.ok) {
            try {
              const data = await res.json()
              setUsername(data.username)
              setRole(data.role || null)
            } catch (e) {
              // ignore parse errors
            }
          }
        } catch {
          setIsAuthenticated(false)
        }
      } else {
        setIsAuthenticated(false)
      }
      setAuthLoading(false)
    }
    
    checkAuth()
    
    // Listen for storage changes (in case token is set in another tab)
    const handleStorageChange = () => checkAuth()
    const handleAuthChange = () => checkAuth()
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('auth-change', handleAuthChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('auth-change', handleAuthChange)
    }
  }, [])

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/admin" element={isAuthenticated && role === 'admin' ? <Admin /> : <Navigate to={isAuthenticated ? "/profile" : "/login"} />} />
          <Route path="/admin-dashboard" element={isAuthenticated && role === 'admin' ? <AdminDashboard /> : <Navigate to={isAuthenticated ? "/profile" : "/login"} />} />
          <Route path="/heart" element={isAuthenticated ? <HeartTriage /> : <Navigate to="/login" />} />
          <Route path="/" element={isAuthenticated ? ((role === 'admin') ? <Navigate to="/admin-dashboard" replace={true} /> : <TriageApp />) : <Navigate to="/login" />} />
        </Routes>
      </div>
    </div>
  )
}

function TriageApp() {
  const [text, setText] = useState('')
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const headers = { 'Content-Type': 'application/json' }
      try {
        const stored = localStorage.getItem('token')
        if (stored) headers['Authorization'] = `Bearer ${stored}`
      } catch (err) {
        // ignore localStorage access errors
      }

      const res = await fetch('http://127.0.0.1:8000/triage', {
        method: 'POST',
        headers,
        body: JSON.stringify({ symptom: text }),
      })
      if (!res.ok) throw new Error(`status ${res.status}`)
      const data = await res.json()
      setResult(data)
      // show success toast if session_id present
      if (data && data.session_id) {
        setToast({ message: `Assessment saved (session #${data.session_id})`, id: data.session_id })
        setTimeout(() => setToast(null), 4500)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (risk) => {
    if (risk === 'High') return 'text-red-600 bg-red-100'
    if (risk === 'Medium') return 'text-yellow-600 bg-yellow-100'
    if (risk === 'Low') return 'text-green-600 bg-green-100'
    return 'text-gray-600 bg-gray-100'
  }

  const getSuggestionText = (suggestion) => {
    if (suggestion.includes('ER')) return 'Visit ER immediately'
    if (suggestion.includes('Telehealth')) return 'Telehealth consultation'
    if (suggestion.includes('Self-care')) return 'Self-care at home'
    return suggestion
  }

  return (
    <div>
      <div className="w-full">
        <div className="flex justify-end mb-4 mt-3">
          <div className="flex gap-3">
            {/* Heart Triage button moved to Profile page */}
            <button
              onClick={() => navigate('/profile')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700"
            >
              ← Back to Profile
            </button>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            MedTriage
            <span className="block text-xl md:text-2xl font-normal text-gray-600">AI-Powered Symptom Checker</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Describe your symptoms and get instant triage recommendations with confidence scoring.
          </p>
        </motion.div>

        {/* Toast */}
        {toast && (
          <div className="fixed top-6 right-6 z-50">
            <div className="bg-emerald-600 text-white px-4 py-2 rounded shadow">{toast.message}</div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Symptom Assessment</h2>
            
            <form onSubmit={submit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Please describe your symptoms in detail
                </label>
                <textarea
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                  placeholder="e.g., 'Severe chest pain, shortness of breath, and dizziness'"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={5}
                />
              </div>
              
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200"
                  disabled={loading || !text.trim()}
                  type="submit"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Analyzing Symptoms...
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      Analyze Symptoms
                    </>
                  )}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"
                  onClick={() => { setText(''); setResult(null); setError(null) }}
                >
                  Clear
                </motion.button>
              </div>
            </form>
          </motion.div>

          {/* Results Section */}
          <div className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-red-500 text-xl">⚠️</span>
                  <p className="text-red-800 font-medium">Error: {error}</p>
                </div>
              </motion.div>
            )}

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3, type: "spring", stiffness: 100 }}
                className="bg-white rounded-xl shadow-xl p-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  className="text-center mb-6"
                >
                  <span className="text-4xl">✅</span>
                  <h2 className="text-2xl font-bold text-gray-800 mt-2">Triage Complete</h2>
                </motion.div>
                
                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gray-50 rounded-lg p-4"
                  >
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Your Symptoms</h3>
                    <p className="text-gray-900 font-medium">{text}</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                  >
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">🩺 Primary Diagnosis</h3>
                    <motion.div
                      initial={{ scale: 0.8, rotate: -5 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🔬</span>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">{result.disease || result.risk}</h4>
                          <p className="text-sm text-gray-600">Evidence-based medical diagnosis</p>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                  >
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">💊 Treatment Protocol</h3>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-900 font-medium">{result.treatment || result.suggestion || result.next_step}</p>
                    </div>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.0 }}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">🎯 AI Confidence</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Low</span>
                          <span className="font-medium">{Math.round((result.confidence || result.score || 0) * 100)}%</span>
                          <span>High</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(result.confidence || result.score || 0) * 100}%` }}
                            transition={{ duration: 1.5, delay: 1.1, ease: "easeOut" }}
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-4 rounded-full shadow-sm"
                          ></motion.div>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 }}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">⚡ Key Symptoms</h3>
                      <div className="flex flex-wrap gap-2">
                        {(result.symptoms || result.conditions || []).slice(0, 6).map((symptom, index) => (
                          <motion.span
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1.3 + 0.05 * index, type: "spring", stiffness: 200 }}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 font-medium"
                          >
                            {typeof symptom === 'string' ? symptom : (symptom.name || JSON.stringify(symptom))}
                          </motion.span>
                        ))}
                      </div>
                    </motion.div>
                  </div>

                  {(result.differential && result.differential.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.4 }}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">🔍 Differential Diagnosis</h3>
                      <div className="space-y-3">
                        {result.differential.slice(0, 3).map((diagnosis, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.5 + 0.1 * index, type: "spring", stiffness: 100 }}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">
                                {diagnosis.includes('🚨') ? '🚨' :
                                 diagnosis.includes('⚠️') ? '⚠️' :
                                 diagnosis.includes('👨‍⚕️') ? '👨‍⚕️' : '🏠'}
                              </span>
                              <div>
                                <p className="font-medium text-gray-900">{diagnosis.split(' (')[0]}</p>
                                <p className="text-sm text-gray-600">{diagnosis.split(' (')[1]?.replace(')', '') || ''}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">
                                {diagnosis.match(/(\d+\.\d+%)/)?.[1] || ''}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.6 }}
                    className="bg-amber-50 border border-amber-200 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-amber-600 text-xl">⚠️</span>
                      <div>
                        <h4 className="text-sm font-medium text-amber-800 mb-1">Medical Disclaimer</h4>
                        <p className="text-sm text-amber-700">
                          This AI-powered assessment is for informational purposes only and should not replace professional medical advice.
                          Always consult qualified healthcare providers for diagnosis and treatment decisions.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {!result && !error && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl shadow-xl p-8 text-center"
              >
                <div className="text-6xl mb-4">🏥</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Ready for Assessment</h3>
                <p className="text-gray-600">Enter your symptoms on the left to get AI-powered triage results.</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

