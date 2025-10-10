import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Admin() {
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

  const navigate = useNavigate()
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-12">
      <div className="px-4">
        {/* Top navbar */}
        <nav className="flex items-center justify-between py-3 px-4 mb-6 rounded-lg bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-orange-400 shadow-md text-white">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold ring-2 ring-white/30">MT</div>
            <div className="text-lg font-semibold">MedTriage Admin</div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-sm text-white/90">Admin: <span className="font-medium">{/* We could add username here if needed */}</span></div>
            <div className="h-8 w-8 rounded-full bg-white/30 flex items-center justify-center text-sm font-semibold text-white ring-2 ring-white/40">A</div>
          </div>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor and manage triage sessions</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8">
          <h2 className="text-lg font-semibold mb-6">Session Management</h2>
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
          {adminError && <div className="text-red-600 mb-4">Admin error: {adminError}</div>}
          <div className="flex items-center gap-3 mb-6">
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
        </div>
      </div>
    </div>
  )
}