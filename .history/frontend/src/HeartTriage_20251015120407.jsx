import React, { useState } from 'react'import React, { useState } from 'react'

import { useNavigate } from 'react-router-dom'import { useNavigate } from 'react-router-dom'

import { motion } from 'framer-motion'import { motion } from 'framer-motion'



const DEFAULT = { age: '63', sex: '1', cp: '3', trestbps: '145', chol: '233', fbs: '1', thalach: '150', exang: '0', oldpeak: '2.3' }const DEFAULT = { age: '63', sex: '1', cp: '3', trestbps: '145', chol: '233', fbs: '1', thalach: '150', exang: '0', oldpeak: '2.3' }



export default function HeartTriage() {export default function HeartTriage() {

  const navigate = useNavigate()  const navigate = useNavigate()

  const [form, setForm] = useState(DEFAULT)  const [form, setForm] = useState(DEFAULT)

  const [result, setResult] = useState(null)  const [result, setResult] = useState(null)

  const [loading, setLoading] = useState(false)  const [loading, setLoading] = useState(false)

  const [error, setError] = useState(null)  const [error, setError] = useState(null)

  const [toast, setToast] = useState(null)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {

  const submit = async (e) => {    if (e) e.preventDefault()

    if (e) e.preventDefault()    setLoading(true)

    setLoading(true)    setResult(null)

    setResult(null)    setError(null)

    setError(null)

    try {

    try {      const headers = { 'Content-Type': 'application/json' }

      const headers = { 'Content-Type': 'application/json' }      try {

      try {        const token = localStorage.getItem('token')

        const token = localStorage.getItem('token')        if (token) headers['Authorization'] = `Bearer ${token}`

        if (token) headers['Authorization'] = `Bearer ${token}`      } catch (err) {

      } catch (err) {        // ignore localStorage access errors

        // ignore localStorage access errors      }

      }

      const res = await fetch('http://127.0.0.1:8000/triage_heart', {

      const res = await fetch('http://127.0.0.1:8000/triage_heart', {        method: 'POST', headers, body: JSON.stringify(form),

        method: 'POST', headers, body: JSON.stringify(form),      })

      })

      if (!res.ok) {

      if (!res.ok) {        const text = await res.text().catch(() => '')

        const text = await res.text().catch(() => '')        throw new Error(text || `status ${res.status}`)

        throw new Error(text || `status ${res.status}`)      }

      }

      const data = await res.json()

      const data = await res.json()      setResult(data)

      setResult(data)    } catch (err) {

      // show success toast      setError(err.message || String(err))

      setToast({ message: 'Heart risk assessment completed', type: 'success' })    } finally { setLoading(false) }

      setTimeout(() => setToast(null), 4500)  }

    } catch (err) {

      setError(err.message || String(err))  const applyPreset = (preset) => setForm({ ...preset })

      setToast({ message: 'Assessment failed', type: 'error' })

      setTimeout(() => setToast(null), 4500)  const reset = () => { setForm(DEFAULT); setResult(null); setError(null) }

    } finally { setLoading(false) }

  }  const prettyPercent = (v) => `${Math.round((v || 0) * 100)}%`



  const applyPreset = (preset) => setForm({ ...preset })  const getRiskColor = (confidence) => {

    if (confidence > 0.6) return 'text-red-600 bg-red-100'

  const reset = () => { setForm(DEFAULT); setResult(null); setError(null) }    if (confidence > 0.35) return 'text-yellow-600 bg-yellow-100'

    return 'text-green-600 bg-green-100'

  const prettyPercent = (v) => `${Math.round((v || 0) * 100)}%`  }



  const getRiskColor = (confidence) => {  const getRiskIcon = (confidence) => {

    if (confidence > 0.6) return 'text-red-600 bg-red-100'    if (confidence > 0.6) return '🔴'

    if (confidence > 0.35) return 'text-yellow-600 bg-yellow-100'    if (confidence > 0.35) return '🟡'

    return 'text-green-600 bg-green-100'    return '🟢'

  }  }

  const [result, setResult] = useState(null)

  const getRiskIcon = (confidence) => {  const [loading, setLoading] = useState(false)

    if (confidence > 0.6) return '🔴'  const [error, setError] = useState(null)

    if (confidence > 0.35) return '🟡'  const [toast, setToast] = useState(null)

    return '🟢'

  }  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })



  return (  const submit = async (e) => {

    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">    if (e) e.preventDefault()

      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">    setLoading(true)

    setResult(null)

        {/* Toast */}    setError(null)

        {toast && (

          <div className="fixed top-6 right-6 z-50">    try {

            <div className={`px-4 py-2 rounded shadow ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>      const headers = { 'Content-Type': 'application/json' }

              {toast.message}      try {

            </div>        const token = localStorage.getItem('token')

          </div>        if (token) headers['Authorization'] = `Bearer ${token}`

        )}      } catch (err) {

        // ignore localStorage access errors

        <div className="w-full">      }

          <div className="flex justify-end mb-4 mt-3">

            <div className="flex gap-3">      const res = await fetch('http://127.0.0.1:8000/triage_heart', {

              <button        method: 'POST', headers, body: JSON.stringify(form),

                onClick={() => navigate('/profile')}      })

                className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700"

              >      if (!res.ok) {

                ← Back to Profile        const text = await res.text().catch(() => '')

              </button>        throw new Error(text || `status ${res.status}`)

            </div>      }

          </div>

      const data = await res.json()

          <motion.div      setResult(data)

            initial={{ opacity: 0, y: -30 }}      // show success toast

            animate={{ opacity: 1, y: 0 }}      setToast({ message: 'Heart risk assessment completed', type: 'success' })

            transition={{ duration: 0.8, ease: "easeOut" }}      setTimeout(() => setToast(null), 4500)

            className="text-center mb-12"    } catch (err) {

          >      setError(err.message || String(err))

            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">      setToast({ message: 'Assessment failed', type: 'error' })

              Heart Risk Assessment      setTimeout(() => setToast(null), 4500)

              <span className="block text-xl md:text-2xl font-normal text-gray-600">AI-Powered Cardiovascular Evaluation</span>    } finally { setLoading(false) }

            </h1>  }

            <p className="text-lg text-gray-600 max-w-2xl mx-auto">

              Advanced machine learning analysis of cardiac risk factors with evidence-based predictions.  const applyPreset = (preset) => setForm({ ...preset })

            </p>

          </motion.div>  const reset = () => { setForm(DEFAULT); setResult(null); setError(null) }



          <div className="grid lg:grid-cols-2 gap-8">  const prettyPercent = (v) => `${Math.round((v || 0) * 100)}%`

            {/* Form Section */}

            <motion.div  const getRiskColor = (confidence) => {

              initial={{ opacity: 0, x: -50 }}    if (confidence > 0.6) return 'text-red-600 bg-red-100'

              animate={{ opacity: 1, x: 0 }}    if (confidence > 0.35) return 'text-yellow-600 bg-yellow-100'

              transition={{ duration: 0.6, delay: 0.2 }}    return 'text-green-600 bg-green-100'

              className="bg-white rounded-xl shadow-xl p-8"  }

            >

              <h2 className="text-2xl font-semibold mb-6 text-gray-800">Patient Parameters</h2>  const getRiskIcon = (confidence) => {

    if (confidence > 0.6) return '🔴'

              <div className="flex items-center gap-2 mb-6">    if (confidence > 0.35) return '🟡'

                <span className="text-sm text-gray-600">Quick presets:</span>    return '🟢'

                <motion.button  }

                  whileHover={{ scale: 1.05 }}

                  whileTap={{ scale: 0.95 }}  return (

                  type="button"    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">

                  onClick={() => applyPreset(DEFAULT)}      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">

                  className="px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200 transition-colors"

                >        {/* Toast */}

                  Default        {toast && (

                </motion.button>          <div className="fixed top-6 right-6 z-50">

                <motion.button            <div className={`px-4 py-2 rounded shadow ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>

                  whileHover={{ scale: 1.05 }}              {toast.message}

                  whileTap={{ scale: 0.95 }}            </div>

                  type="button"          </div>

                  onClick={() => applyPreset({ age: '72', sex: '1', cp: '4', trestbps: '160', chol: '270', fbs: '0', thalach: '120', exang: '1', oldpeak: '3.2' })}        )}

                  className="px-3 py-1 text-sm rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors"

                >        <div className="w-full">

                  High Risk          <div className="flex justify-end mb-4 mt-3">

                </motion.button>            <div className="flex gap-3">

                <motion.button              <button

                  whileHover={{ scale: 1.05 }}                onClick={() => navigate('/profile')}

                  whileTap={{ scale: 0.95 }}                className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700"

                  type="button"              >

                  onClick={() => applyPreset({ age: '45', sex: '0', cp: '1', trestbps: '120', chol: '190', fbs: '0', thalach: '170', exang: '0', oldpeak: '0.0' })}                ← Back to Profile

                  className="px-3 py-1 text-sm rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors"              </button>

                >            </div>

                  Low Risk          </div>

                </motion.button>

              </div>          <motion.div

            initial={{ opacity: 0, y: -30 }}

              <form onSubmit={submit} className="space-y-6">            animate={{ opacity: 1, y: 0 }}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">            transition={{ duration: 0.8, ease: "easeOut" }}

                  <div>            className="text-center mb-12"

                    <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>          >

                    <input            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">

                      name="age"              Heart Risk Assessment

                      value={form.age}              <span className="block text-xl md:text-2xl font-normal text-gray-600">AI-Powered Cardiovascular Evaluation</span>

                      onChange={handleChange}            </h1>

                      type="number"            <p className="text-lg text-gray-600 max-w-2xl mx-auto">

                      min="1"              Advanced machine learning analysis of cardiac risk factors with evidence-based predictions.

                      max="120"            </p>

                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"          </motion.div>

                    />

                  </div>          <div className="grid lg:grid-cols-2 gap-8">

                  <div>            {/* Form Section */}

                    <label className="block text-sm font-medium text-gray-700 mb-2">Sex</label>            <motion.div

                    <select              initial={{ opacity: 0, x: -50 }}

                      name="sex"              animate={{ opacity: 1, x: 0 }}

                      value={form.sex}              transition={{ duration: 0.6, delay: 0.2 }}

                      onChange={handleChange}              className="bg-white rounded-xl shadow-xl p-8"

                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"            >

                    >              <h2 className="text-2xl font-semibold mb-6 text-gray-800">Patient Parameters</h2>

                      <option value="0">Female</option>

                      <option value="1">Male</option>              <div className="flex items-center gap-2 mb-6">

                    </select>                <span className="text-sm text-gray-600">Quick presets:</span>

                  </div>                <motion.button

                </div>                  whileHover={{ scale: 1.05 }}

                  whileTap={{ scale: 0.95 }}

                <div>                  type="button"

                  <label className="block text-sm font-medium text-gray-700 mb-2">Chest Pain Type</label>                  onClick={() => applyPreset(DEFAULT)}

                  <select                  className="px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200 transition-colors"

                    name="cp"                >

                    value={form.cp}                  Default

                    onChange={handleChange}                </motion.button>

                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"                <motion.button

                  >                  whileHover={{ scale: 1.05 }}

                    <option value="1">Typical angina</option>                  whileTap={{ scale: 0.95 }}

                    <option value="2">Atypical angina</option>                  type="button"

                    <option value="3">Non-anginal pain</option>                  onClick={() => applyPreset({ age: '72', sex: '1', cp: '4', trestbps: '160', chol: '270', fbs: '0', thalach: '120', exang: '1', oldpeak: '3.2' })}

                    <option value="4">Asymptomatic</option>                  className="px-3 py-1 text-sm rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors"

                  </select>                >

                </div>                  High Risk

                </motion.button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">                <motion.button

                  <div>                  whileHover={{ scale: 1.05 }}

                    <label className="block text-sm font-medium text-gray-700 mb-2">Resting Blood Pressure</label>                  whileTap={{ scale: 0.95 }}

                    <input                  type="button"

                      name="trestbps"                  onClick={() => applyPreset({ age: '45', sex: '0', cp: '1', trestbps: '120', chol: '190', fbs: '0', thalach: '170', exang: '0', oldpeak: '0.0' })}

                      value={form.trestbps}                  className="px-3 py-1 text-sm rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors"

                      onChange={handleChange}                >

                      type="number"                  Low Risk

                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"                </motion.button>

                    />              </div>

                  </div>

                  <div>              <form onSubmit={submit} className="space-y-6">

                    <label className="block text-sm font-medium text-gray-700 mb-2">Cholesterol (mg/dL)</label>                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <input                  <div>

                      name="chol"                    <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>

                      value={form.chol}                    <input

                      onChange={handleChange}                      name="age"

                      type="number"                      value={form.age}

                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"                      onChange={handleChange}

                    />                      type="number"

                  </div>                      min="1"

                </div>                      max="120"

                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">                    />

                  <div>                  </div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">Fasting Blood Sugar &gt; 120 mg/dL</label>                  <div>

                    <select                    <label className="block text-sm font-medium text-gray-700 mb-2">Sex</label>

                      name="fbs"                    <select

                      value={form.fbs}                      name="sex"

                      onChange={handleChange}                      value={form.sex}

                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"                      onChange={handleChange}

                    >                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"

                      <option value="0">No</option>                    >

                      <option value="1">Yes</option>                      <option value="0">Female</option>

                    </select>                      <option value="1">Male</option>

                  </div>                    </select>

                  <div>                  </div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Heart Rate</label>                </div>

                    <input

                      name="thalach"                <div>

                      value={form.thalach}                  <label className="block text-sm font-medium text-gray-700 mb-2">Chest Pain Type</label>

                      onChange={handleChange}                  <select

                      type="number"                    name="cp"

                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"                    value={form.cp}

                    />                    onChange={handleChange}

                  </div>                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"

                </div>                  >

                    <option value="1">Typical angina</option>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">                    <option value="2">Atypical angina</option>

                  <div>                    <option value="3">Non-anginal pain</option>

                    <label className="block text-sm font-medium text-gray-700 mb-2">Exercise Induced Angina</label>                    <option value="4">Asymptomatic</option>

                    <select                  </select>

                      name="exang"                </div>

                      value={form.exang}

                      onChange={handleChange}                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"                  <div>

                    >                    <label className="block text-sm font-medium text-gray-700 mb-2">Resting Blood Pressure</label>

                      <option value="0">No</option>                    <input

                      <option value="1">Yes</option>                      name="trestbps"

                    </select>                      value={form.trestbps}

                  </div>                      onChange={handleChange}

                  <div>                      type="number"

                    <label className="block text-sm font-medium text-gray-700 mb-2">ST Depression</label>                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"

                    <input                    />

                      name="oldpeak"                  </div>

                      value={form.oldpeak}                  <div>

                      onChange={handleChange}                    <label className="block text-sm font-medium text-gray-700 mb-2">Cholesterol (mg/dL)</label>

                      type="number"                    <input

                      step="0.1"                      name="chol"

                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"                      value={form.chol}

                    />                      onChange={handleChange}

                  </div>                      type="number"

                </div>                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"

                    />

                <div className="flex gap-4">                  </div>

                  <motion.button                </div>

                    whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)" }}

                    whileTap={{ scale: 0.95 }}                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200"                  <div>

                    disabled={loading}                    <label className="block text-sm font-medium text-gray-700 mb-2">Fasting Blood Sugar &gt; 120 mg/dL</label>

                    type="submit"                    <select

                  >                      name="fbs"

                    {loading ? (                      value={form.fbs}

                      <>                      onChange={handleChange}

                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"

                        Analyzing Risk...                    >

                      </>                      <option value="0">No</option>

                    ) : (                      <option value="1">Yes</option>

                      <>                    </select>

                        <span>❤️</span>                  </div>

                        Assess Heart Risk                  <div>

                      </>                    <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Heart Rate</label>

                    )}                    <input

                  </motion.button>                      name="thalach"

                      value={form.thalach}

                  <motion.button                      onChange={handleChange}

                    whileHover={{ scale: 1.05 }}                      type="number"

                    whileTap={{ scale: 0.95 }}                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"

                    type="button"                    />

                    className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"                  </div>

                    onClick={reset}                </div>

                  >

                    Reset                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  </motion.button>                  <div>

                </div>                    <label className="block text-sm font-medium text-gray-700 mb-2">Exercise Induced Angina</label>

                    <select

                <div className="text-center text-sm text-gray-500">                      name="exang"

                  Model: <span className="font-medium">HeartClassifier v1</span>                      value={form.exang}

                </div>                      onChange={handleChange}

              </form>                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"

            </motion.div>                    >

                      <option value="0">No</option>

            {/* Results Section */}                      <option value="1">Yes</option>

            <div className="space-y-6">                    </select>

              {error && (                  </div>

                <motion.div                  <div>

                  initial={{ opacity: 0, scale: 0.9, y: 20 }}                    <label className="block text-sm font-medium text-gray-700 mb-2">ST Depression</label>

                  animate={{ opacity: 1, scale: 1, y: 0 }}                    <input

                  className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-lg"                      name="oldpeak"

                >                      value={form.oldpeak}

                  <div className="flex items-center gap-3">                      onChange={handleChange}

                    <span className="text-red-500 text-xl">⚠️</span>                      type="number"

                    <p className="text-red-800 font-medium">Error: {error}</p>                      step="0.1"

                  </div>                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"

                </motion.div>                    />

              )}                  </div>

                </div>

              {result && (

                <motion.div                <div className="flex gap-4">

                  initial={{ opacity: 0, y: 30, scale: 0.95 }}                  <motion.button

                  animate={{ opacity: 1, y: 0, scale: 1 }}                    whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)" }}

                  transition={{ duration: 0.6, delay: 0.3, type: "spring", stiffness: 100 }}                    whileTap={{ scale: 0.95 }}

                  className="bg-white rounded-xl shadow-xl p-8"                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200"

                >                    disabled={loading}

                  <motion.div                    type="submit"

                    initial={{ scale: 0 }}                  >

                    animate={{ scale: 1 }}                    {loading ? (

                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}                      <>

                    className="text-center mb-6"                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>

                  >                        Analyzing Risk...

                    <span className="text-4xl">✅</span>                      </>

                    <h2 className="text-2xl font-bold text-gray-800 mt-2">Assessment Complete</h2>                    ) : (

                  </motion.div>                      <>

                        <span>❤️</span>

                  <div className="space-y-6">                        Assess Heart Risk

                    <motion.div                      </>

                      initial={{ opacity: 0, y: 20 }}                    )}

                      animate={{ opacity: 1, y: 0 }}                  </motion.button>

                      transition={{ delay: 0.6 }}

                      className="bg-white border border-gray-200 rounded-lg p-4"                  <motion.button

                    >                    whileHover={{ scale: 1.05 }}

                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Risk Assessment</h3>                    whileTap={{ scale: 0.95 }}

                      <motion.div                    type="button"

                        initial={{ scale: 0.8, rotate: -10 }}                    className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"

                        animate={{ scale: 1, rotate: 0 }}                    onClick={reset}

                        transition={{ delay: 0.7, type: "spring", stiffness: 200 }}                  >

                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-lg ${getRiskColor(result.confidence || result.score)} shadow-md`}                    Reset

                      >                  </motion.button>

                        <span className="text-2xl">                </div>

                          {getRiskIcon(result.confidence || result.score)}

                        </span>                <div className="text-center text-sm text-gray-500">

                        {result.prediction || result.risk || 'Unknown'}                  Model: <span className="font-medium">HeartClassifier v1</span>

                      </motion.div>                </div>

                    </motion.div>              </form>

            </motion.div>

                    <motion.div

                      initial={{ opacity: 0, y: 20 }}            {/* Results Section */}

                      animate={{ opacity: 1, y: 0 }}            <div className="space-y-6">

                      transition={{ delay: 0.8 }}              {error && (

                      className="bg-white border border-gray-200 rounded-lg p-4"                <motion.div

                    >                  initial={{ opacity: 0, scale: 0.9, y: 20 }}

                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">AI Confidence Score</h3>                  animate={{ opacity: 1, scale: 1, y: 0 }}

                      <div className="space-y-2">                  className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-lg"

                        <div className="flex justify-between text-sm text-gray-600">                >

                          <span>Low</span>                  <div className="flex items-center gap-3">

                          <span className="font-medium">{prettyPercent(result.confidence || result.score)}</span>                    <span className="text-red-500 text-xl">⚠️</span>

                          <span>High</span>                    <p className="text-red-800 font-medium">Error: {error}</p>

                        </div>                  </div>

                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">                </motion.div>

                          <motion.div              )}

                            initial={{ width: 0 }}

                            animate={{ width: `${((result.confidence || result.score) || 0) * 100}%` }}              {result && (

                            transition={{ duration: 1.5, delay: 0.9, ease: "easeOut" }}                <motion.div

                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full shadow-sm"                  initial={{ opacity: 0, y: 30, scale: 0.95 }}

                          ></motion.div>                  animate={{ opacity: 1, y: 0, scale: 1 }}

                        </div>                  transition={{ duration: 0.6, delay: 0.3, type: "spring", stiffness: 100 }}

                      </div>                  className="bg-white rounded-xl shadow-xl p-8"

                    </motion.div>                >

                  <motion.div

                    {result.details && result.details.top_features && (                    initial={{ scale: 0 }}

                      <motion.div                    animate={{ scale: 1 }}

                        initial={{ opacity: 0, y: 20 }}                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}

                        animate={{ opacity: 1, y: 0 }}                    className="text-center mb-6"

                        transition={{ delay: 1.0 }}                  >

                        className="bg-white border border-gray-200 rounded-lg p-4"                    <span className="text-4xl">✅</span>

                      >                    <h2 className="text-2xl font-bold text-gray-800 mt-2">Assessment Complete</h2>

                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Key Contributing Factors</h3>                  </motion.div>

                        <motion.ul className="space-y-2">

                          {result.details.top_features.slice(0,5).map((f, i) => (                  <div className="space-y-6">

                            <motion.li                    <motion.div

                              key={i}                      initial={{ opacity: 0, y: 20 }}

                              initial={{ opacity: 0, x: -20 }}                      animate={{ opacity: 1, y: 0 }}

                              animate={{ opacity: 1, x: 0 }}                      transition={{ delay: 0.6 }}

                              transition={{ delay: 1.1 + 0.1 * i, type: "spring", stiffness: 100 }}                      className="bg-white border border-gray-200 rounded-lg p-4"

                              className="flex items-center justify-between text-gray-900"                    >

                            >                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Risk Assessment</h3>

                              <span className="flex items-center gap-2">                      <motion.div

                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>                        initial={{ scale: 0.8, rotate: -10 }}

                                {f[0]}                        animate={{ scale: 1, rotate: 0 }}

                              </span>                        transition={{ delay: 0.7, type: "spring", stiffness: 200 }}

                              <span className="text-gray-500 text-sm">{f[1]}</span>                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-lg ${getRiskColor(result.confidence || result.score)} shadow-md`}

                            </motion.li>                      >

                          ))}                        <span className="text-2xl">

                        </motion.ul>                          {getRiskIcon(result.confidence || result.score)}

                      </motion.div>                        </span>

                    )}                        {result.prediction || result.risk || 'Unknown'}

                      </motion.div>

                    {result.suggestion && (                    </motion.div>

                      <motion.div

                        initial={{ opacity: 0, y: 20 }}                    <motion.div

                        animate={{ opacity: 1, y: 0 }}                      initial={{ opacity: 0, y: 20 }}

                        transition={{ delay: 1.2 }}                      animate={{ opacity: 1, y: 0 }}

                        className="bg-indigo-50 border border-indigo-200 rounded-lg p-4"                      transition={{ delay: 0.8 }}

                      >                      className="bg-white border border-gray-200 rounded-lg p-4"

                        <h3 className="text-sm font-medium text-indigo-800 uppercase tracking-wide mb-2">Recommended Action</h3>                    >

                        <p className="text-indigo-900">{result.suggestion}</p>                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">AI Confidence Score</h3>

                      </motion.div>                      <div className="space-y-2">

                    )}                        <div className="flex justify-between text-sm text-gray-600">

                          <span>Low</span>

                    {result.fallback_to_rule && (                          <span className="font-medium">{prettyPercent(result.confidence || result.score)}</span>

                      <motion.div                          <span>High</span>

                        initial={{ opacity: 0, y: 20 }}                        </div>

                        animate={{ opacity: 1, y: 0 }}                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">

                        transition={{ delay: 1.3 }}                          <motion.div

                        className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"                            initial={{ width: 0 }}

                      >                            animate={{ width: `${((result.confidence || result.score) || 0) * 100}%` }}

                        <div className="flex items-center gap-2">                            transition={{ duration: 1.5, delay: 0.9, ease: "easeOut" }}

                          <span className="text-yellow-600">⚠️</span>                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full shadow-sm"

                          <p className="text-yellow-800 text-sm">Model not available — returned rule-based assessment.</p>                          ></motion.div>

                        </div>                        </div>

                      </motion.div>                      </div>

                    )}                    </motion.div>

                  </div>

                </motion.div>                    {result.details && result.details.top_features && (

              )}                      <motion.div

                        initial={{ opacity: 0, y: 20 }}

              {!result && !error && (                        animate={{ opacity: 1, y: 0 }}

                <motion.div                        transition={{ delay: 1.0 }}

                  initial={{ opacity: 0, y: 30 }}                        className="bg-white border border-gray-200 rounded-lg p-4"

                  animate={{ opacity: 1, y: 0 }}                      >

                  transition={{ delay: 0.4 }}                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Key Contributing Factors</h3>

                  className="bg-white rounded-xl shadow-xl p-8 text-center"                        <motion.ul className="space-y-2">

                >                          {result.details.top_features.slice(0,5).map((f, i) => (

                  <div className="text-6xl mb-4">❤️</div>                            <motion.li

                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Ready for Heart Assessment</h3>                              key={i}

                  <p className="text-gray-600">Enter patient parameters on the left to get AI-powered cardiovascular risk analysis.</p>                              initial={{ opacity: 0, x: -20 }}

                </motion.div>                              animate={{ opacity: 1, x: 0 }}

              )}                              transition={{ delay: 1.1 + 0.1 * index, type: "spring", stiffness: 100 }}

                              className="flex items-center justify-between text-gray-900"

              <motion.div                            >

                initial={{ opacity: 0, y: 30 }}                              <span className="flex items-center gap-2">

                animate={{ opacity: 1, y: 0 }}                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>

                transition={{ delay: 0.5 }}                                {f[0]}

                className="bg-white rounded-xl shadow-xl p-6"                              </span>

              >                              <span className="text-gray-500 text-sm">{f[1]}</span>

                <h3 className="text-lg font-semibold text-gray-800 mb-3">About This Assessment</h3>                            </motion.li>

                <p className="text-sm text-gray-600 mb-4">                          ))}

                  This tool uses advanced machine learning to analyze traditional cardiac risk factors and provide evidence-based predictions.                        </motion.ul>

                  Results should be interpreted by qualified healthcare professionals and used as part of comprehensive patient evaluation.                      </motion.div>

                </p>                    )}

                <div className="text-xs text-gray-500">

                  <p>• Based on Cleveland Heart Disease dataset</p>                    {result.suggestion && (

                  <p>• Features include clinical measurements and patient history</p>                      <motion.div

                  <p>• Model provides explainable predictions with confidence scores</p>                        initial={{ opacity: 0, y: 20 }}

                </div>                        animate={{ opacity: 1, y: 0 }}

              </motion.div>                        transition={{ delay: 1.2 }}

            </div>                        className="bg-indigo-50 border border-indigo-200 rounded-lg p-4"

          </div>                      >

        </div>                        <h3 className="text-sm font-medium text-indigo-800 uppercase tracking-wide mb-2">Recommended Action</h3>

      </div>                        <p className="text-indigo-900">{result.suggestion}</p>

    </div>                      </motion.div>

  )                    )}

}
                    {result.fallback_to_rule && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.3 }}
                        className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-600">⚠️</span>
                          <p className="text-yellow-800 text-sm">Model not available — returned rule-based assessment.</p>
                        </div>
                      </motion.div>
                    )}
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
                  <div className="text-6xl mb-4">❤️</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Ready for Heart Assessment</h3>
                  <p className="text-gray-600">Enter patient parameters on the left to get AI-powered cardiovascular risk analysis.</p>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-xl shadow-xl p-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-3">About This Assessment</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This tool uses advanced machine learning to analyze traditional cardiac risk factors and provide evidence-based predictions.
                  Results should be interpreted by qualified healthcare professionals and used as part of comprehensive patient evaluation.
                </p>
                <div className="text-xs text-gray-500">
                  <p>• Based on Cleveland Heart Disease dataset</p>
                  <p>• Features include clinical measurements and patient history</p>
                  <p>• Model provides explainable predictions with confidence scores</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
}
