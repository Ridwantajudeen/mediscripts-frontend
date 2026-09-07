import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import useAuth from '../context/useAuth'

function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login, isAdmin, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return (
      <main style={{ maxWidth: '420px', margin: '4rem auto', padding: '2rem' }}>
        Checking admin access...
      </main>
    )
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    const result = await login(email, password)

    if (!result.success) {
      setError(result.message || 'Unable to sign in')
      setSubmitting(false)
      return
    }

    navigate('/admin')
  }

  return (
    <main
      style={{
        maxWidth: '420px',
        margin: '4rem auto',
        padding: '2rem',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        background: '#fff',
      }}
    >
      <h1 style={{ marginTop: 0 }}>Admin Login</h1>
      <p style={{ color: '#475569' }}>Sign in with your admin account to continue.</p>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
        </label>
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
        </label>
        {error ? <p style={{ color: '#b91c1c', margin: 0 }}>{error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '0.8rem',
            border: 0,
            borderRadius: '999px',
            background: submitting ? '#5e9f99' : '#38c34d',
            color: '#fff',
            cursor: submitting ? 'wait' : 'pointer',
          }}
        >
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}

export default AdminLoginPage

