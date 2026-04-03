import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'

function fmt(iso) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function TicketStatus() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const [input, setInput]   = useState(id ?? '')
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const lookup = async tid => {
    if (!tid) return
    setLoading(true)
    setError('')
    setTicket(null)
    try {
      const res = await fetch(`/api/tickets/${tid}`)
      if (res.status === 404) { setError('No ticket found with that ID.'); return }
      if (!res.ok) throw new Error('Failed to fetch ticket')
      setTicket(await res.json())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Auto-fetch when navigated to /ticket/:id
  useEffect(() => { if (id) lookup(id) }, [id])

  const handleSearch = e => {
    e.preventDefault()
    if (input.trim()) navigate(`/ticket/${input.trim()}`)
  }

  return (
    <div className="container">
      <h1>Check Ticket Status</h1>

      <form className="search-form" onSubmit={handleSearch}>
        <input
          type="number"
          min="1"
          placeholder="Enter your ticket ID…"
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button className="btn" type="submit">Look Up</button>
      </form>

      {loading && <p className="loading">Looking up ticket…</p>}
      {error   && <div className="error">{error}</div>}

      {ticket && (
        <div className="ticket-card">
          <div className="ticket-card-header">
            <h2>{ticket.subject}</h2>
            <StatusBadge status={ticket.status} />
          </div>

          <div className="ticket-meta">
            <span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {fmt(ticket.created_at)}
            </span>
            <span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              {ticket.category}
            </span>
            <span>Ticket #{ticket.id}</span>
          </div>

          <div className="ticket-section">
            <h3>Description</h3>
            <p>{ticket.description}</p>
          </div>

          {ticket.notes && (
            <div className="ticket-section notes-section">
              <h3>Admin Notes</h3>
              <p>{ticket.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
