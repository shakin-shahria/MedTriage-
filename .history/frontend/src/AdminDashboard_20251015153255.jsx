import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AdminDashboard(){
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [filterRisk, setFilterRisk] = useState('all')
  const [analytics, setAnalytics] = useState({ totalUsers: 0, totalSessions: 0, highRisk: 0, avgConfidence: 0 })
  const [auditLogs, setAuditLogs] = useState([])
  const [adminProfile, setAdminProfile] = useState(null)

  const STORAGE_KEY = 'medtriage_admin_token'

  useEffect(() => {
    fetchSessions()
    fetchUsers()
    fetchProfile()
    // load a small audit log placeholder
    setAuditLogs([{
      id:1,
      text: 'Admin logged in',
      time: new Date().toISOString()
    }])
  }, [page, pageSize, filterRisk])

  // derived analytics from auditLogs
  const auditAnalytics = React.useMemo(() => {
    const total = auditLogs.length
    const exports = auditLogs.filter(a => /export/i.test(a.text)).length
    const actors = new Set(auditLogs.map(a => a.actor || a.user || a.by || 'admin'))
    const last = auditLogs.length ? auditLogs.reduce((a,b) => (new Date(a.time) > new Date(b.time) ? a : b)).time : null
    return { total, exports, uniqueActors: actors.size, last }
  }, [auditLogs])

  async function fetchUsers(){
    try{
      const headers = {}
      const token = (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY))
      if(token){
        if(token.startsWith('Bearer ')) headers['Authorization'] = token
        else headers['X-Admin-Token'] = token
      }

      const res = await fetch('http://127.0.0.1:8000/admin/users', { headers })
      if(!res.ok) return
      const body = await res.json()
      const totalUsers = body.total || 0
      
      // Update analytics with total users
      setAnalytics(prev => ({ ...prev, totalUsers }))
    }catch(e){
      // ignore errors, will fall back to session-based calculation
    }
  }

  async function fetchSessions(){
    setLoading(true); setError(null)
    try{
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('page_size', String(pageSize))
      if(filterRisk && filterRisk !== 'all') params.set('risk', filterRisk)

      const headers = {}
      const token = (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY))
      if(token){
        if(token.startsWith('Bearer ')) headers['Authorization'] = token
        else headers['X-Admin-Token'] = token
      }

      const res = await fetch(`http://127.0.0.1:8000/admin/sessions?${params.toString()}`, { headers })
      if(!res.ok){
        if(res.status===401) throw new Error('Unauthorized: please login as admin')
        if(res.status===403) throw new Error('Forbidden: you are not an admin')
        throw new Error('Failed to fetch sessions: ' + res.status)
      }
      const body = await res.json()
      if(Array.isArray(body)){
        setSessions(body)
        setTotal(body.length)
      } else if(body && body.items){
        setSessions(body.items)
        setTotal(body.total || 0)
      } else {
        setSessions(body)
        setTotal(Array.isArray(body)?body.length:0)
      }

      // build some lightweight analytics from returned sessions
      const totalSessions = (Array.isArray(body) ? body.length : (body.total || 0))
      const highs = (Array.isArray(body) ? body.filter(s => String(s.risk_level).toLowerCase() === 'high').length : (body.items ? body.items.filter(s=>String(s.risk_level).toLowerCase()==='high').length : 0))
      const avgConf = (Array.isArray(body) ? (body.reduce((acc,s)=>acc + (s.confidence_score||0),0) / Math.max(1, body.length)) : (body.items ? (body.items.reduce((acc,s)=>acc + (s.confidence_score||0),0) / Math.max(1, body.items.length)) : 0))
      
      // Update analytics (totalUsers is set by fetchUsers)
      setAnalytics(prev => ({ 
        ...prev, 
        totalSessions, 
        highRisk: highs, 
        avgConfidence: avgConf ? Number(avgConf.toFixed(2)) : 0 
      }))

    }catch(e){
      setError(e.message)
    } finally { setLoading(false) }
  }

  function exportCsv(){
    if(!sessions || sessions.length === 0) return
    const cols = ['session_id','created_at','user_email','risk_level','confidence_score','method','input_text']
    const rows = [cols.join(',')]
    sessions.forEach(s=>{
      const vals = cols.map(c => '"' + String(s[c] ?? '').replace(/"/g,'""') + '"')
      rows.push(vals.join(','))
    })
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'admin-sessions.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
    // add audit log
    setAuditLogs(prev => [{ id: Date.now(), text: 'Admin exported CSV', time: new Date().toISOString() }, ...prev].slice(0,50))
  }

  function gotoProfile(){ navigate('/profile') }

  function handleLogout(){
    localStorage.removeItem('token')
    localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new Event('auth-change'))
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-12">
  <div className="max-w-6xl mx-auto px-4">
        {/* Top navbar (same as Profile.jsx) */}
        <nav className="flex items-center justify-between py-3 px-2 mb-4 rounded-none bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-orange-400 shadow-md text-white">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold ring-2 ring-white/30">MT</div>
            <div className="text-lg font-semibold">MedTriage</div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-sm text-white/90">Signed in as <span className="font-medium">{adminProfile?.username || adminProfile?.email || 'Admin'}</span></div>
            <div className="h-8 w-8 rounded-full bg-white/30 flex items-center justify-center text-sm font-semibold text-white ring-2 ring-white/40">{(adminProfile?.username || adminProfile?.email || 'A').charAt(0)?.toUpperCase()}</div>
          </div>
        </nav>

        {/* Header */}
        <header className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">MT</div>
            <div>
          <div className="text-lg font-semibold">MedTriage Admin</div>
            <div className="text-sm text-gray-500">Welcome{adminProfile?.email ? `, ${adminProfile.email}` : ', Admin'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* <button onClick={gotoProfile} className="px-3 py-2 border rounded">Profile</button> */}
            <button onClick={handleLogout} className="px-3 py-2 bg-red-600 text-white rounded">Logout</button>
          </div>
        </header>

        {/* Analytics cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">Total Users</div>
            <div className="text-2xl font-bold">{analytics.totalUsers ?? '-'}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">Total Sessions</div>
            <div className="text-2xl font-bold">{analytics.totalSessions}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">High Risk Cases</div>
            <div className="text-2xl font-bold text-red-600">{analytics.highRisk}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">Avg Confidence</div>
            <div className="text-2xl font-bold">{analytics.avgConfidence ?? '-'}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Triage Sessions</h2>
              <div className="flex items-center gap-2">
                <select className="p-1 border rounded" value={filterRisk} onChange={e=>{ setFilterRisk(e.target.value); setPage(1) }}>
                  <option value="all">All Risks</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <select className="p-1 border rounded" value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1) }}>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <button className="px-3 py-1 border rounded" onClick={()=>{ setPage(Math.max(1,page-1)); fetchSessions() }} disabled={page<=1}>Prev</button>
                <div className="text-sm">Page {page}{total?` of ${Math.max(1, Math.ceil(total/pageSize))}`:''}</div>
                <button className="px-3 py-1 border rounded" onClick={()=>{ setPage(page+1); fetchSessions() }} disabled={total && page>=Math.ceil(total/pageSize)}>Next</button>
                <button className="px-3 py-1 bg-sky-600 text-white rounded" onClick={exportCsv}>Export CSV</button>
              </div>
            </div>

            {error && <div className="text-red-600 mb-3">{error}</div>}
            {loading && <div className="text-sm text-gray-500">Loading...</div>}

            <div className="space-y-3">
              {sessions && sessions.length>0 ? sessions.map(s=> (
                <div key={s.session_id} className="p-3 border rounded flex justify-between items-start">
                  <div>
                    <div className="text-sm text-gray-600">{new Date(s.created_at).toLocaleString?.() ?? s.created_at}</div>
                    <div className="font-medium text-gray-900">{(s.user && (s.user.user_email || s.user.username)) || s.user_email || s.user || '—'}</div>
                    {(s.user && s.user.username) ? (
                      <div className="text-sm text-gray-500">{s.user.username}</div>
                    ) : ((s.username || s.user_name || s.user_display_name) && (
                      <div className="text-sm text-gray-500">{s.username || s.user_name || s.user_display_name}</div>
                    ))}
                    <div className="text-sm text-gray-700 mt-1">{s.input_text ? (s.input_text.length>120 ? s.input_text.substring(0,120)+'...' : s.input_text) : '—'}</div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-block px-3 py-1 rounded-full font-semibold ${String(s.risk_level).toLowerCase()==='high'?'bg-red-100 text-red-700':String(s.risk_level).toLowerCase()==='medium'?'bg-yellow-100 text-yellow-700':'bg-green-100 text-green-700'}`}>{s.risk_level || 'Unknown'}</div>
                    <div className="text-xs text-gray-500 mt-2">Conf: {s.confidence_score ?? '—'}</div>
                    <div className="text-xs text-gray-500">Method: {s.method || s.source || 'Rule'}</div>
                  </div>
                </div>
              )) : <div className="text-sm text-gray-500">No sessions found</div> }
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-3">User Management</h3>
              <p className="text-sm text-gray-600 mb-3">(Placeholder) List users, deactivate or delete accounts.</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div>john@demo.com</div>
                  <div className="text-xs text-gray-500">3 sessions · last: 2025-10-06</div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div>alice@demo.com</div>
                  <div className="text-xs text-gray-500">1 session · last: 2025-09-30</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-3">Audit Logs</h3>
              <div className="space-y-2 text-sm text-gray-700 max-h-48 overflow-auto">
                {auditLogs.map(a=> (
                  <div key={a.id} className="border-b py-2">
                    <div className="text-xs text-gray-500">{new Date(a.time).toLocaleString?.()}</div>
                    <div>{a.text}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-3">Audit Analytics</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 border rounded">
                  <div className="text-xs text-gray-500">Total Events</div>
                  <div className="text-lg font-bold">{auditAnalytics.total}</div>
                </div>
                <div className="p-3 border rounded">
                  <div className="text-xs text-gray-500">Exports</div>
                  <div className="text-lg font-bold">{auditAnalytics.exports}</div>
                </div>
                <div className="p-3 border rounded">
                  <div className="text-xs text-gray-500">Unique Actors</div>
                  <div className="text-lg font-bold">{auditAnalytics.uniqueActors}</div>
                </div>
                <div className="p-3 border rounded">
                  <div className="text-xs text-gray-500">Last Action</div>
                  <div className="text-sm text-gray-700">{auditAnalytics.last ? new Date(auditAnalytics.last).toLocaleString() : '—'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
