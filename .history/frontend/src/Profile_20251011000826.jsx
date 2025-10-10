import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const [user, setUser] = useState(null)
  const [sessions, setSessions] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    const fetchData = async () => {
      try {
        // Fetch user profile
        const profileRes = await fetch('http://127.0.0.1:8000/auth/profile', {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        if (!profileRes.ok) throw new Error('Failed to fetch profile')
        const userData = await profileRes.json()
        setUser(userData)

        // Fetch user sessions (mock data for now)
        const sessionsRes = await fetch('http://127.0.0.1:8000/auth/sessions', {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        const sessionsData = await sessionsRes.json()
        setSessions(sessionsData)

        // Calculate analytics
        const analyticsData = calculateAnalytics(sessionsData)
        setAnalytics(analyticsData)

      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [navigate])

  const calculateAnalytics = (sessions) => {
    if (!sessions || sessions.length === 0) {
      return {
        totalTests: 0,
        avgRisk: 'N/A',
        riskDistribution: { high: 0, medium: 0, low: 0 },
        recentActivity: 'No tests yet'
      }
    }

    const totalTests = sessions.length
    const riskLevels = sessions.map(s => s.risk_level?.toLowerCase() || 'unknown')
    const riskCounts = riskLevels.reduce((acc, risk) => {
      acc[risk] = (acc[risk] || 0) + 1
      return acc
    }, {})

    const avgRisk = riskLevels.length > 0 ? 
      riskLevels.filter(r => r === 'high').length > riskLevels.filter(r => r === 'medium').length ? 'High' :
      riskLevels.filter(r => r === 'medium').length > riskLevels.filter(r => r === 'low').length ? 'Medium' : 'Low' : 'N/A'

    const recentActivity = sessions.length > 0 ? 
      `Last test: ${new Date(sessions[0].created_at).toLocaleDateString()}` : 'No recent activity'

    return {
      totalTests,
      avgRisk,
      riskDistribution: {
        high: riskCounts.high || 0,
        medium: riskCounts.medium || 0,
        low: riskCounts.low || 0
      },
      recentActivity
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.dispatchEvent(new Event('auth-change'))
    navigate('/login')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-12">
  <div className="max-w-5xl mx-auto px-2">
        {/* Top navbar */}
  <nav className="flex items-center justify-between py-3 px-2 mb-4 rounded-none bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-orange-400 shadow-md text-white">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold ring-2 ring-white/30">MT</div>
            <div className="text-lg font-semibold">MedTriage</div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-sm text-white/90">Signed in as <span className="font-medium">{user?.username}</span></div>
            <div className="h-8 w-8 rounded-full bg-white/30 flex items-center justify-center text-sm font-semibold text-white ring-2 ring-white/40">{user?.username?.charAt(0)?.toUpperCase() || 'U'}</div>
          </div>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Health Profile</h1>
          <p className="text-gray-600">Track your symptom assessments and health insights</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* User Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-xl p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Personal Information</h2>
              {user && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Username</label>
                    <p className="text-gray-900">{user.username}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Member Since</label>
                    <p className="text-gray-900">{new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                >
                  Logout
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  New Assessment
                </button>
              </div>
            </div>

            {/* Recent Assessments (moved under profile, same width) */}
            <div className="mt-6 bg-white rounded-xl shadow-xl p-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Recent Assessments</h3>
              {sessions && sessions.length > 0 ? (
                <div className="space-y-3">
                  {sessions.slice(0, 5).map((session, index) => (
                    <div key={session.session_id || index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            session.risk_level?.toLowerCase() === 'high' ? 'bg-red-100 text-red-800' :
                            session.risk_level?.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {session.risk_level || 'Unknown'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">{session.created_at ? new Date(session.created_at).toLocaleDateString() : '—'}</div>
                      </div>
                      <div className="text-sm text-gray-700">{session.input_text ? session.input_text.substring(0, 120) + (session.input_text.length > 120 ? '...' : '') : '—'}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No assessments yet.</div>
              )}
            </div>
          </div>

          {/* Analytics */}
          <div className="lg:col-span-2 space-y-8">
            {/* Health Analytics */}
            <div className="bg-white rounded-xl shadow-xl p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Health Analytics</h2>
              {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{analytics.totalTests}</div>
                    <div className="text-sm text-gray-600">Total Assessments</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{analytics.avgRisk}</div>
                    <div className="text-sm text-gray-600">Average Risk Level</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">{analytics.recentActivity}</div>
                  </div>
                </div>
              )}

              {analytics && analytics.totalTests > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">Risk Level Distribution</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-red-600">High Risk</span>
                      <span>{analytics.riskDistribution.high}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-600">Medium Risk</span>
                      <span>{analytics.riskDistribution.medium}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">Low Risk</span>
                      <span>{analytics.riskDistribution.low}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Important Messages */}
            <div className="bg-white rounded-xl shadow-xl p-6">
              {/* Extra content: Trends and Saved Reports */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-white border rounded">
                  <div className="text-sm font-medium text-gray-800 mb-2">Trends (confidence)</div>
                  <div className="h-12">
                    <svg viewBox="0 0 100 20" className="w-full h-full">
                      {(() => {
                        const vals = sessions.slice(0, 10).map(s => s.confidence_score || 0)
                        if (vals.length === 0) return null
                        const max = Math.max(...vals, 0.01)
                        const points = vals.map((v, i) => `${(i / (vals.length - 1 || 1)) * 100},${20 - (v / max) * 18}`).join(' ')
                        return <polyline points={points} fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      })()}
                    </svg>
                  </div>
                </div>

                <div className="p-3 bg-white border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-gray-800">Saved Reports</div>
                    <button className="text-xs text-indigo-600">Manage</button>
                  </div>
                  <ul className="text-sm text-gray-700">
                    <li>Weekly summary · {analytics?.totalTests ?? 0} assessments</li>
                    <li>High risk watchlist</li>
                  </ul>
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Health Insights</h2>
              <div className="space-y-4">
                {analytics && analytics.totalTests === 0 && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-sm text-blue-700">
                          <strong>Welcome!</strong> You haven't taken any symptom assessments yet. 
                          Regular health check-ins can help you stay informed about your well-being.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {analytics && analytics.riskDistribution.high > 0 && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-sm text-red-700">
                          <strong>Important:</strong> You've had {analytics.riskDistribution.high} high-risk assessment(s). 
                          Please consult with a healthcare professional for proper evaluation.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-green-50 border-l-4 border-green-400 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-green-700">
                        <strong>Remember:</strong> This tool provides preliminary triage guidance only. 
                        Always seek professional medical advice for health concerns.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <strong>Tip:</strong> Keep track of your symptoms over time. 
                        Patterns can be important for healthcare providers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column - extra content intentionally removed to keep Recent Assessments under Profile for consistent width */}
          </div>
        </div>
      </div>
    </div>
  )
}