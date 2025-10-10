import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Login from './Login'
import Register from './Register'
import Profile from './Profile'
import Admin from './Admin'

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
      <div className="max-w-6xl mx-auto px-4 py-6">
        <nav className="flex items-center justify-between py-3 px-4 mb-6 rounded-lg bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-orange-400 shadow-md text-white">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold ring-2 ring-white/30">MT</div>
            <div className="text-lg font-semibold">MedTriage</div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-sm text-white/90">Signed in as <span className="font-medium">{username || 'User'}</span></div>
            {role === 'admin' && (
              <a href="/admin" className="text-sm text-white/90 underline ml-2">Admin</a>
            )}
            <div className="h-8 w-8 rounded-full bg-white/30 flex items-center justify-center text-sm font-semibold text-white ring-2 ring-white/40">{username?.charAt(0)?.toUpperCase() || 'U'}</div>
          </div>
        </nav>

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/admin" element={isAuthenticated && role === 'admin' ? <Admin /> : <Navigate to={isAuthenticated ? "/profile" : "/login"} />} />
          <Route path="/" element={isAuthenticated ? (role === 'admin' ? <Navigate to="/admin" replace={true} /> : <TriageApp />) : <Navigate to="/login" />} />
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
  // Admin UI state
  const [adminToken, setAdminToken] = useState('')
  const [sessions, setSessions] = useState([])
  const [adminError, setAdminError] = useState(null)
  const [filterRisk, setFilterRisk] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalSessions, setTotalSessions] = useState(0)
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showToken, setShowToken] = useState(false)

  const STORAGE_KEY = 'medtriage_admin_token'

  useEffect(() => {
    try {
      const t = localStorage.getItem(STORAGE_KEY)
      if (t) {
        setAdminToken(t)
        setIsLoggedIn(true)
        setShowToken(false)
      }
    } catch (e) {
      // ignore localStorage errors
    }
  }, [])

  async function fetchSessions(){
    setAdminError(null)
    setLoadingSessions(true)
    try{
      const headers = {}
      // prefer persisted token if present
      const tokenToUse = (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY)) || adminToken
      if(tokenToUse){
        // allow either raw token (X-Admin-Token) or Bearer JWT
        if(tokenToUse.startsWith('Bearer ')){
          headers['Authorization'] = tokenToUse
        } else {
          headers['X-Admin-Token'] = tokenToUse
        }
      }

      // build query params for pagination + filtering
      const params = new URLSearchParams()
      // use page-based pagination by default for the UI
      params.set('page', String(page || 1))
      params.set('page_size', String(pageSize || 20))
      if(filterRisk && filterRisk !== 'all') params.set('risk', filterRisk)

      const url = `http://127.0.0.1:8000/admin/sessions?${params.toString()}`
      const res = await fetch(url, { headers })
      if(!res.ok) throw new Error('status ' + res.status)
      const body = await res.json()

      // backend returns either an array (legacy) or a paginated object
      if(Array.isArray(body)){
        setSessions(body)
        setTotalSessions(body.length)
        setPage(1)
        setPageSize(body.length)
      } else if(body && body.items){
        setSessions(body.items)
        setTotalSessions(body.total || 0)
        setPage(body.page || page)
        setPageSize(body.page_size || pageSize)
      } else {
        // unknown shape: set raw
        setSessions(body)
        setTotalSessions(Array.isArray(body) ? body.length : 0)
      }
    }catch(e){
      setAdminError(e.message)
    } finally {
      setLoadingSessions(false)
    }
  }

  function loginToken(){
    if(!adminToken || !adminToken.trim()){
      setAdminError('Enter a token to login')
      return
    }
    try{
      localStorage.setItem(STORAGE_KEY, adminToken.trim())
      setIsLoggedIn(true)
      setAdminError(null)
      // fetch sessions immediately after login
      fetchSessions()
    }catch(e){
      setAdminError('Could not persist token')
    }
  }

  function logout(){
    try{
      localStorage.removeItem(STORAGE_KEY)
    }catch(e){}
    setAdminToken('')
    setIsLoggedIn(false)
    setSessions([])
  }

  function exportCsv(){
    if(!sessions || sessions.length===0) return
    const rows = []
    const cols = ['session_id','created_at','risk_level','next_step','confidence_score','input_text']
    rows.push(cols.join(','))
    sessions.forEach(s => {
      const vals = cols.map(c => '"' + String(s[c] ?? '').replace(/"/g,'""') + '"')
      rows.push(vals.join(','))
    })
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'sessions.csv'; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url)
  }

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('http://127.0.0.1:8000/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptom: text }),
      })
      if (!res.ok) throw new Error(`status ${res.status}`)
      const data = await res.json()
      setResult(data)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => navigate('/profile')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700"
          >
            ← Back to Profile
          </button>
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Risk Level</h3>
                      <motion.div
                        initial={{ scale: 0.8, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-lg ${getRiskColor(result.risk)} shadow-md`}
                      >
                        <span className="text-2xl">
                          {result.risk === 'High' ? '🔴' : result.risk === 'Medium' ? '🟡' : '🟢'}
                        </span>
                        {result.risk}
                      </motion.div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 }}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Recommended Action</h3>
                      <p className="text-lg font-semibold text-gray-900">{getSuggestionText(result.suggestion || result.next_step)}</p>
                    </motion.div>
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                  >
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">AI Confidence Score</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Low</span>
                        <span className="font-medium">{Math.round((result.score || 0) * 100)}%</span>
                        <span>High</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(result.score || 0) * 100}%` }}
                          transition={{ duration: 1.5, delay: 1.1, ease: "easeOut" }}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full shadow-sm"
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
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Possible Conditions</h3>
                    <motion.ul className="space-y-2">
                      {(result.conditions || result.predicted_conditions || []).map((condition, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.3 + 0.1 * index, type: "spring", stiffness: 100 }}
                          className="flex items-center gap-2 text-gray-900"
                        >
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          {typeof condition === 'string' ? condition : (condition.name || JSON.stringify(condition))}
                        </motion.li>
                      ))}
                    </motion.ul>
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
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-12 bg-white rounded-xl shadow-xl p-8"
        >
          <h2 className="text-lg font-semibold mb-2">Admin — Sessions</h2>
          <div className="flex gap-2 mb-3 items-center">
            <input className="flex-1 p-2 border rounded" placeholder="Paste JWT (Bearer ...) or X-Admin-Token" value={showToken ? adminToken : (adminToken ? '••••••••••••••••' : '')} onChange={e=>setAdminToken(e.target.value)} />
            {isLoggedIn && (
              <button className="px-2 py-1 border rounded text-sm" onClick={()=>{ setShowToken(!showToken) }}>{showToken ? 'Hide' : 'Reveal'}</button>
            )}
            {isLoggedIn && (
              <button className="px-2 py-1 border rounded text-sm" onClick={()=>{ navigator.clipboard?.writeText(adminToken); }}>Copy</button>
            )}
            {!isLoggedIn ? (
              <>
                <button className="px-3 py-2 bg-emerald-600 text-white rounded" onClick={loginToken}>Login</button>
                <button className="px-3 py-2 bg-sky-600 text-white rounded" onClick={fetchSessions}>Fetch</button>
              </>
            ) : (
              <>
                <button className="px-3 py-2 border rounded" onClick={logout}>Logout</button>
                <button className="px-3 py-2 bg-sky-600 text-white rounded" onClick={fetchSessions}>Refresh</button>
              </>
            )}
            <button className="px-3 py-2 border rounded" onClick={exportCsv}>Export CSV</button>
          </div>
          {adminError && <div className="text-red-600">Admin error: {adminError}</div>}
          <div className="flex items-center gap-3 mb-2">
            <label className="text-sm">Filter:</label>
            <select value={filterRisk} onChange={e=>setFilterRisk(e.target.value)} className="p-1 border rounded">
              <option value="all">All</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <label className="text-sm">Page size:</label>
            <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }} className="p-1 border rounded">
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <div className="ml-2 flex items-center gap-2">
              <button className="px-2 py-1 border rounded" onClick={()=>{ if(page>1) { setPage(page-1); fetchSessions(); } }} disabled={page<=1 || loadingSessions}>Prev</button>
              <div className="text-sm">Page {page} {totalSessions?`of ${Math.max(1, Math.ceil(totalSessions/pageSize))}`:''}</div>
              <button className="px-2 py-1 border rounded" onClick={()=>{ const maxp = totalSessions?Math.max(1, Math.ceil(totalSessions/pageSize)):page+1; if(page<maxp){ setPage(page+1); fetchSessions(); } }} disabled={loadingSessions || (totalSessions && page>=Math.ceil(totalSessions/pageSize))}>Next</button>
            </div>
          </div>

          <div className="space-y-2">
            {(sessions || []).filter(s => filterRisk==='all' ? true : (String(s.risk_level).toLowerCase()===filterRisk.toLowerCase())).map((s) => (
              <div key={s.session_id} className="p-3 bg-gray-50 border rounded">
                <div className="flex justify-between"><div className="text-sm text-slate-700">#{s.session_id} — {s.risk_level}</div><div className="text-xs text-slate-500">{s.created_at}</div></div>
                <div className="text-sm">Next: {s.next_step} — Confidence: {s.confidence_score}</div>
                <div className="text-xs text-slate-600 mt-2">{s.input_text}</div>
              </div>
            ))}
            {(!sessions || sessions.length===0) && <div className="text-sm text-slate-500">No sessions yet</div>}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

