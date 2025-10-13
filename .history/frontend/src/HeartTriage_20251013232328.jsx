import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const DEFAULT = { age: '63', sex: '1', cp: '3', trestbps: '145', chol: '233', fbs: '1', thalach: '150', exang: '0', oldpeak: '2.3' }

export default function HeartTriage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(DEFAULT)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    if (e) e.preventDefault()
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const headers = { 'Content-Type': 'application/json' }
      try {
        const token = localStorage.getItem('token')
        if (token) headers['Authorization'] = `Bearer ${token}`
      } catch (err) {
        // ignore localStorage access errors
      }

      const res = await fetch('http://127.0.0.1:8000/triage_heart', {
        method: 'POST', headers, body: JSON.stringify(form),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `status ${res.status}`)
      }

      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message || String(err))
    } finally { setLoading(false) }
  }

  const applyPreset = (preset) => setForm({ ...preset })

  const reset = () => { setForm(DEFAULT); setResult(null); setError(null) }

  const prettyPercent = (v) => `${Math.round((v || 0) * 100)}%`

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white shadow text-sm">
              ← Back
            </button>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-gray-800">Heart Attack Triage</h1>
            <p className="text-sm text-gray-500">Evidence-based risk prediction with explainable output</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <motion.form
            onSubmit={submit}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Patient Parameters</h2>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => applyPreset(DEFAULT)} className="px-3 py-1 text-sm rounded bg-gray-100">Default</button>
                <button type="button" onClick={() => applyPreset({ age: '72', sex: '1', cp: '4', trestbps: '160', chol: '270', fbs: '0', thalach: '120', exang: '1', oldpeak: '3.2' })} className="px-3 py-1 text-sm rounded bg-red-100 text-red-700">High Risk</button>
                <button type="button" onClick={() => applyPreset({ age: '45', sex: '0', cp: '1', trestbps: '120', chol: '190', fbs: '0', thalach: '170', exang: '0', oldpeak: '0.0' })} className="px-3 py-1 text-sm rounded bg-green-100 text-green-700">Low Risk</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Age</label>
                <input name="age" value={form.age} onChange={handleChange} type="number" min="1" max="120" className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Sex (0=F,1=M)</label>
                <select name="sex" value={form.sex} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  <option value="0">Female (0)</option>
                  <option value="1">Male (1)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Chest Pain Type (cp)</label>
                <select name="cp" value={form.cp} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  <option value="1">Typical angina (1)</option>
                  <option value="2">Atypical angina (2)</option>
                  <option value="3">Non-anginal pain (3)</option>
                  <option value="4">Asymptomatic (4)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Resting BP</label>
                <input name="trestbps" value={form.trestbps} onChange={handleChange} type="number" className="mt-1 w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Cholesterol</label>
                <input name="chol" value={form.chol} onChange={handleChange} type="number" className="mt-1 w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Fasting BS (0/1)</label>
                <select name="fbs" value={form.fbs} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-md">
                  <option value="0">0</option>
                  <option value="1">1</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Max Heart Rate</label>
                <input name="thalach" value={form.thalach} onChange={handleChange} type="number" className="mt-1 w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Exercise Induced Angina (0/1)</label>
                <select name="exang" value={form.exang} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-md">
                  <option value="0">0</option>
                  <option value="1">1</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">ST Depression (oldpeak)</label>
                <input name="oldpeak" value={form.oldpeak} onChange={handleChange} type="number" step="0.1" className="mt-1 w-full px-3 py-2 border rounded-md" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button type="submit" disabled={loading} className="flex items-center gap-3 px-5 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 disabled:opacity-60">
                {loading ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Checking...</>) : 'Run Heart Risk' }
              </button>
              <button type="button" onClick={reset} className="px-4 py-2 border rounded-md">Reset</button>
              <div className="ml-auto text-sm text-gray-500">Model: <span className="font-medium">HeartClassifier v1</span></div>
            </div>
          </motion.form>

          {/* Right column: results & info */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Quick Help</h3>
              <p className="text-sm text-gray-700">This tool uses a trained classifier to estimate the probability of coronary heart disease using common clinical features. Use presets to try typical scenarios. If the model is not available the API will fall back to the rule-based triage.</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Latest Result</h3>

              {!result && (
                <div className="text-center text-gray-500">No result yet. Run an assessment to see predictions and explainability.</div>
              )}

              {result && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500">Prediction</div>
                      <div className="text-lg font-semibold">{result.prediction || result.risk || '—'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Confidence</div>
                      <div className="text-lg font-semibold">{prettyPercent(result.confidence || result.score)}</div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div className={`h-3 rounded-full ${ (result.confidence || result.score) > 0.6 ? 'bg-red-500' : (result.confidence || result.score) > 0.35 ? 'bg-yellow-400' : 'bg-green-400' }`} style={{ width: `${((result.confidence || result.score) || 0) * 100}%` }} />
                  </div>

                  {/* Suggested action if available (backend may provide a suggestion based on band) */}
                  {result.suggestion && (
                    <div className="mt-2 p-3 rounded bg-indigo-50 text-indigo-800 text-sm">
                      <strong>Suggested action:</strong> {result.suggestion}
                    </div>
                  )}

                  {result.details && result.details.top_features && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-600">Top contributing features</h4>
                      <ul className="mt-2 space-y-2">
                        {result.details.top_features.slice(0,5).map((f, i) => (
                          <li key={i} className="flex items-center justify-between text-sm">
                            <span className="text-gray-800">{f[0]}</span>
                            <span className="text-gray-500">{f[1]}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.fallback_to_rule && (
                    <div className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded">Model not available — returned rule-based assessment.</div>
                  )}

                  <details className="text-xs text-gray-500 mt-2">
                    <summary className="cursor-pointer">Raw response</summary>
                    <pre className="text-xs mt-2 bg-gray-50 p-2 rounded max-h-48 overflow-auto">{JSON.stringify(result, null, 2)}</pre>
                  </details>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
