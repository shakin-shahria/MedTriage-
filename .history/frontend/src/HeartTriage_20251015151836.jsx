import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const DEFAULT = { age: '63', sex: '1', cp: '3', trestbps: '145', chol: '233', fbs: '1', thalach: '150', exang: '0', oldpeak: '2.3' }

// Custom Select Component
const CustomSelect = ({ name, value, onChange, options, label, placeholder = "Select..." }) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (optionValue) => {
    onChange({ target: { name, value: optionValue } })
    setIsOpen(false)
  }

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-3 border border-gray-300 rounded-lg bg-white text-left focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 flex items-center justify-between hover:border-gray-400"
        >
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-gray-400"
          >
            ▼
          </motion.span>
        </motion.button>

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
          >
            {options.map((option, index) => (
              <motion.button
                key={option.value}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 ${
                  option.value === value ? 'bg-blue-100 text-blue-900 font-medium' : 'text-gray-700'
                }`}
              >
                {option.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export default function HeartTriage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(DEFAULT)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

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
      // show success toast
      setToast({ message: 'Heart risk assessment completed', type: 'success' })
      setTimeout(() => setToast(null), 4500)
    } catch (err) {
      setError(err.message || String(err))
      setToast({ message: 'Assessment failed', type: 'error' })
      setTimeout(() => setToast(null), 4500)
    } finally { setLoading(false) }
  }

  const applyPreset = (preset) => setForm({ ...preset })

  const reset = () => { setForm(DEFAULT); setResult(null); setError(null) }

  const prettyPercent = (v) => `${Math.round((v || 0) * 100)}%`

  const getRiskColor = (confidence) => {
    if (confidence > 0.6) return 'text-red-600 bg-red-100'
    if (confidence > 0.35) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const getRiskIcon = (confidence) => {
    if (confidence > 0.6) return '🔴'
    if (confidence > 0.35) return '��'
    return '🟢'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-2">

        {/* Toast */}
        {toast && (
          <div className="fixed top-6 right-6 z-50">
            <div className={`px-4 py-2 rounded shadow ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
              {toast.message}
            </div>
          </div>
        )}

        <div className="w-full">
          <div className="flex justify-end mb-1">
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/profile')}
                className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700"
              >
                ← Back to Profile
              </button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-2"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              Heart Risk Assessment
              <span className="block text-lg md:text-xl font-normal text-gray-600">AI-Powered Cardiovascular Evaluation</span>
            </h1>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Advanced machine learning analysis of cardiac risk factors with evidence-based predictions.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Form Section */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-xl shadow-xl p-6"
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Patient Parameters</h2>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-gray-600">Quick presets:</span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => applyPreset(DEFAULT)}
                  className="px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Default
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => applyPreset({ age: '72', sex: '1', cp: '4', trestbps: '160', chol: '270', fbs: '0', thalach: '120', exang: '1', oldpeak: '3.2' })}
                  className="px-3 py-1 text-sm rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                >
                  High Risk
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => applyPreset({ age: '45', sex: '0', cp: '1', trestbps: '120', chol: '190', fbs: '0', thalach: '170', exang: '0', oldpeak: '0.0' })}
                  className="px-3 py-1 text-sm rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                >
                  Low Risk
                </motion.button>
              </div>

              <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                    <input
                      name="age"
                      value={form.age}
                      onChange={handleChange}
                      type="number"
                      min="1"
                      max="120"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sex</label>
                    <CustomSelect
                      name="sex"
                      value={form.sex}
                      onChange={handleChange}
                      options={[
                        { value: '0', label: 'Female' },
                        { value: '1', label: 'Male' }
                      ]}
                      placeholder="Select gender"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chest Pain Type</label>
                  <CustomSelect
                    name="cp"
                    value={form.cp}
                    onChange={handleChange}
                    options={[
                      { value: '1', label: 'Typical angina' },
                      { value: '2', label: 'Atypical angina' },
                      { value: '3', label: 'Non-anginal pain' },
                      { value: '4', label: 'Asymptomatic' }
                    ]}
                    placeholder="Select chest pain type"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Resting Blood Pressure</label>
                    <input
                      name="trestbps"
                      value={form.trestbps}
                      onChange={handleChange}
                      type="number"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cholesterol (mg/dL)</label>
                    <input
                      name="chol"
                      value={form.chol}
                      onChange={handleChange}
                      type="number"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fasting Blood Sugar &gt; 120 mg/dL</label>
                    <select
                      name="fbs"
                      value={form.fbs}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="0">No</option>
                      <option value="1">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Heart Rate</label>
                    <input
                      name="thalach"
                      value={form.thalach}
                      onChange={handleChange}
                      type="number"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Exercise Induced Angina</label>
                    <select
                      name="exang"
                      value={form.exang}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="0">No</option>
                      <option value="1">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ST Depression</label>
                    <input
                      name="oldpeak"
                      value={form.oldpeak}
                      onChange={handleChange}
                      type="number"
                      step="0.1"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200"
                    disabled={loading}
                    type="submit"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Analyzing Risk...
                      </>
                    ) : (
                      <>
                        <span>❤️</span>
                        Assess Heart Risk
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"
                    onClick={reset}
                  >
                    Reset
                  </motion.button>
                </div>

                <div className="text-center text-sm text-gray-500">
                  Model: <span className="font-medium">HeartClassifier v1</span>
                </div>
              </form>
            </motion.div>

            {/* Results Section */}
            <div className="space-y-4">
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
                  className="bg-white rounded-xl shadow-xl p-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                    className="text-center mb-6"
                  >
                    <span className="text-4xl">✅</span>
                    <h2 className="text-2xl font-bold text-gray-800 mt-2">Assessment Complete</h2>
                  </motion.div>

                  <div className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Risk Assessment</h3>
                      <motion.div
                        initial={{ scale: 0.8, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-lg ${getRiskColor(result.confidence || result.score)} shadow-md`}
                      >
                        <span className="text-2xl">
                          {getRiskIcon(result.confidence || result.score)}
                        </span>
                        {result.prediction || result.risk || 'Unknown'}
                      </motion.div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">AI Confidence Score</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Low</span>
                          <span className="font-medium">{prettyPercent(result.confidence || result.score)}</span>
                          <span>High</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${((result.confidence || result.score) || 0) * 100}%` }}
                            transition={{ duration: 1.5, delay: 0.9, ease: "easeOut" }}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full shadow-sm"
                          ></motion.div>
                        </div>
                      </div>
                    </motion.div>

                    {result.details && result.details.top_features && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.0 }}
                        className="bg-white border border-gray-200 rounded-lg p-4"
                      >
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Key Contributing Factors</h3>
                        <motion.ul className="space-y-2">
                          {result.details.top_features.slice(0,5).map((f, i) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 1.1 + 0.1 * i, type: "spring", stiffness: 100 }}
                              className="flex items-center justify-between text-gray-900"
                            >
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                {f[0]}
                              </span>
                              <span className="text-gray-500 text-sm">{f[1]}</span>
                            </motion.li>
                          ))}
                        </motion.ul>
                      </motion.div>
                    )}

                    {result.suggestion && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 }}
                        className="bg-indigo-50 border border-indigo-200 rounded-lg p-4"
                      >
                        <h3 className="text-sm font-medium text-indigo-800 uppercase tracking-wide mb-2">Recommended Action</h3>
                        <p className="text-indigo-900">{result.suggestion}</p>
                      </motion.div>
                    )}

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
                  className="bg-white rounded-xl shadow-xl p-6 text-center"
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
                className="bg-white rounded-xl shadow-xl p-4"
              >
                <h3 className="text-base font-semibold text-gray-800 mb-2">About This Assessment</h3>
                <p className="text-sm text-gray-600 mb-3">
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
