import React, { useState, useEffect } from 'react'

export default function App() {
  const [text, setText] = useState('')
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-12">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-semibold mb-4">MedTriage Demo</h1>
        <form onSubmit={submit} className="space-y-4">
          <textarea
            className="w-full p-3 border rounded h-32"
            placeholder="Describe symptoms, e.g. 'fever and chest pain'"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              disabled={loading || !text.trim()}
            >
              {loading ? 'Checking…' : 'Triage'}
            </button>
            <button
              type="button"
              className="px-4 py-2 border rounded"
              onClick={() => { setText(''); setResult(null); setError(null) }}
            >
              Clear
            </button>
          </div>
        </form>

        <div className="mt-6">
          {error && <div className="text-red-600">Error: {error}</div>}
          {result && (
            <div className="space-y-3">
              <div><strong>Risk:</strong> {result.risk}</div>
              <div><strong>Recommendation:</strong> {result.suggestion || result.next_step}</div>
              <div>
                <strong>Conditions:</strong>
                <ul className="list-disc ml-6">
                  {(result.conditions || result.predicted_conditions || []).map((c, i) => (
                    <li key={i}>{typeof c === 'string' ? c : (c.name || JSON.stringify(c))}</li>
                  ))}
                </ul>
              </div>
              <pre className="text-xs bg-gray-100 p-2 rounded">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
        
        <div className="mt-8 border-t pt-6">
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
        </div>
      </div>
    </div>
  )
}

