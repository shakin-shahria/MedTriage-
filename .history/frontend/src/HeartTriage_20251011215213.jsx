import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function HeartTriage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    age: '63', sex: '1', cp: '3', trestbps: '145', chol: '233', fbs: '1', thalach: '150', exang: '0', oldpeak: '2.3'
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => setForm({...form, [e.target.name]: e.target.value})

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch('http://127.0.0.1:8000/triage_heart', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form)})
      if (!res.ok) throw new Error(`status ${res.status}`)
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between mb-4">
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-200 rounded">← Back</button>
      </div>
      <h2 className="text-2xl font-semibold mb-4">Heart Attack Triage</h2>
      <form onSubmit={submit} className="space-y-3 bg-white p-6 rounded shadow">
        <div className="grid grid-cols-2 gap-3">
          <label>Age<input name="age" value={form.age} onChange={handleChange} className="w-full"/></label>
          <label>Sex (0/1)<input name="sex" value={form.sex} onChange={handleChange} className="w-full"/></label>
          <label>Chest Pain Type (cp)<input name="cp" value={form.cp} onChange={handleChange} className="w-full"/></label>
          <label>Rest BP<input name="trestbps" value={form.trestbps} onChange={handleChange} className="w-full"/></label>
          <label>Cholesterol<input name="chol" value={form.chol} onChange={handleChange} className="w-full"/></label>
          <label>Fasting BS (0/1)<input name="fbs" value={form.fbs} onChange={handleChange} className="w-full"/></label>
          <label>Max HR<thalach><input name="thalach" value={form.thalach} onChange={handleChange} className="w-full"/></label>
          <label>Exercise Angina (0/1)<input name="exang" value={form.exang} onChange={handleChange} className="w-full"/></label>
          <label>ST Depression (oldpeak)<input name="oldpeak" value={form.oldpeak} onChange={handleChange} className="w-full"/></label>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading} type="submit">{loading ? 'Checking...' : 'Check Heart Risk'}</button>
          <button type="button" onClick={() => { setForm({age:'63',sex:'1',cp:'3',trestbps:'145',chol:'233',fbs:'1',thalach:'150',exang:'0',oldpeak:'2.3'}); setResult(null); setError(null)}} className="px-4 py-2 border rounded">Reset</button>
        </div>
      </form>

      {error && <div className="mt-4 p-4 bg-red-50 border border-red-200">Error: {error}</div>}

      {result && (
        <div className="mt-4 p-4 bg-white rounded shadow">
          <h3 className="text-lg font-semibold">Result</h3>
          <pre className="text-sm mt-2">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
