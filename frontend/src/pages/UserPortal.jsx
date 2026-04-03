import { useState } from 'react'
import { Link } from 'react-router-dom'

const CATEGORIES = ['Hardware', 'Software', 'Network', 'Other']

const empty = { name: '', email: '', subject: '', description: '', category: 'Other' }

export default function UserPortal() {
  const [form, setForm]           = useState(empty)
  const [submitting, setSubmitting] = useState(false)
  const [ticket, setTicket]       = useState(null)
  const [error, setError]         = useState('')

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Submission failed')
      }
      setTicket(await res.json())
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (ticket) {
    return (
      <div className="container">
        <div className="success-box">
          <div className="check-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2>Ticket Submitted!</h2>
          <p>Your ticket ID is</p>
          <div className="ticket-id-badge">#{ticket.id}</div>
          <p style={{ color: '#6b7280', fontSize: '0.88rem' }}>
            A confirmation email has been sent to <strong>{ticket.email}</strong>
          </p>
          <div className="actions">
            <Link to={`/ticket/${ticket.id}`} className="btn">Check Status</Link>
            <button className="btn btn-secondary" onClick={() => { setTicket(null); setForm(empty) }}>
              Submit Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <h1>Submit a Help Request</h1>

      {error && <div className="error">{error}</div>}

      <form className="form" onSubmit={submit}>
        <div className="form-group">
          <label>Your Name *</label>
          <input name="name" value={form.name} onChange={handle} required placeholder="Jane Smith" />
        </div>

        <div className="form-group">
          <label>Email Address *</label>
          <input name="email" type="email" value={form.email} onChange={handle} required placeholder="jane@example.com" />
        </div>

        <div className="form-group">
          <label>Subject *</label>
          <input name="subject" value={form.subject} onChange={handle} required placeholder="Brief summary of the issue" />
        </div>

        <div className="form-group">
          <label>Category</label>
          <select name="category" value={form.category} onChange={handle}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Description *</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handle}
            required
            rows={5}
            placeholder="Describe the issue in detail…"
          />
        </div>

        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit Ticket'}
        </button>
      </form>
    </div>
  )
}
