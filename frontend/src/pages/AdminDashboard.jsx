import { useState, useEffect, useCallback } from 'react'
import StatusBadge from '../components/StatusBadge'

const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed']

function fmt(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Login screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [pw, setPw]       = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy]   = useState(false)

  const submit = async e => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/tickets', {
        headers: { Authorization: `Bearer ${pw}` },
      })
      if (res.status === 401) { setError('Incorrect password.'); return }
      if (!res.ok) throw new Error('Server error')
      const tickets = await res.json()
      localStorage.setItem('hd_admin_pass', pw)
      onLogin(pw, tickets)
    } catch {
      setError('Could not connect to server.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>Admin Dashboard</h1>
        <p className="subtitle">Enter your admin password to continue.</p>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="••••••••"
              required
              autoFocus
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Checking…' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────
function Dashboard({ password, initialTickets, onLogout }) {
  const [tickets, setTickets]   = useState(initialTickets)
  const [filter, setFilter]     = useState('all')
  const [selected, setSelected] = useState(null)

  // edit state for the detail pane
  const [editStatus, setEditStatus] = useState('')
  const [editNotes,  setEditNotes]  = useState('')
  const [saving, setSaving]         = useState(false)
  const [saveMsg, setSaveMsg]       = useState('')
  const [saveErr, setSaveErr]       = useState('')

  const authHeader = { Authorization: `Bearer ${password}` }

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/tickets', { headers: authHeader })
      if (res.ok) setTickets(await res.json())
    } catch { /* silent */ }
  }, [password])

  const selectTicket = t => {
    setSelected(t)
    setEditStatus(t.status)
    setEditNotes(t.notes ?? '')
    setSaveMsg('')
    setSaveErr('')
  }

  const saveChanges = async () => {
    if (!selected) return
    setSaving(true)
    setSaveMsg('')
    setSaveErr('')
    try {
      const res = await fetch(`/api/tickets/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ status: editStatus, notes: editNotes }),
      })
      if (!res.ok) throw new Error(await res.text())
      const updated = await res.json()
      setTickets(ts => ts.map(t => t.id === updated.id ? updated : t))
      setSelected(updated)
      setSaveMsg('Changes saved.')
    } catch (err) {
      setSaveErr(err.message || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const filtered = filter === 'all'
    ? tickets
    : tickets.filter(t => t.status === filter)

  return (
    <div className="admin-layout">
      {/* ── Sidebar ── */}
      <aside className="admin-sidebar">
        <div className="sidebar-top">
          <h2>All Tickets <span style={{ color: '#9ca3af', fontWeight: 400 }}>({filtered.length})</span></h2>
          <button className="btn-text" onClick={onLogout}>Log out</button>
        </div>

        <div className="filter-bar">
          <label>Filter:</label>
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn-sm" onClick={refresh}>↻ Refresh</button>
        </div>

        <div className="ticket-list">
          {filtered.length === 0 && (
            <p className="empty-state">No tickets match this filter.</p>
          )}
          {filtered.map(t => (
            <div
              key={t.id}
              className={`ticket-item${selected?.id === t.id ? ' selected' : ''}`}
              onClick={() => selectTicket(t)}
            >
              <div className="ticket-item-row1">
                <span className="ticket-num">#{t.id}</span>
                <StatusBadge status={t.status} />
              </div>
              <div className="ticket-subject">{t.subject}</div>
              <div className="ticket-item-meta">
                <span>{t.name}</span>
                <span>·</span>
                <span>{t.category}</span>
                <span>·</span>
                <span>{new Date(t.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Detail pane ── */}
      <section className="admin-content">
        {!selected ? (
          <div className="no-selection">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p>Select a ticket to view details</p>
          </div>
        ) : (
          <>
            <div className="detail-header">
              <h2>Ticket #{selected.id} — {selected.subject}</h2>
              <StatusBadge status={selected.status} />
            </div>

            {/* Meta grid */}
            <div className="detail-grid">
              <div className="detail-cell">
                <label>Requester</label>
                <p>{selected.name}</p>
              </div>
              <div className="detail-cell">
                <label>Email</label>
                <p>{selected.email}</p>
              </div>
              <div className="detail-cell">
                <label>Category</label>
                <p>{selected.category}</p>
              </div>
              <div className="detail-cell">
                <label>Created</label>
                <p>{fmt(selected.created_at)}</p>
              </div>
            </div>

            {/* Description */}
            <div className="detail-section">
              <label>Description</label>
              <div className="description-box">{selected.description}</div>
            </div>

            {/* Update panel */}
            <div className="update-panel">
              <h3>Update Ticket</h3>
              <div className="update-row">
                <div className="form-group">
                  <label>Status</label>
                  <select value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 16 }}>
                <label>Internal Notes</label>
                <textarea
                  rows={4}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="Add notes visible to the requester…"
                />
              </div>

              {saveErr && <div className="error">{saveErr}</div>}
              {saveMsg && <div className="success-alert">{saveMsg}</div>}

              <button className="btn" onClick={saveChanges} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

// ── Root export ───────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [password, setPassword] = useState(() => localStorage.getItem('hd_admin_pass') ?? '')
  const [tickets,  setTickets]  = useState(null)   // null = not yet authenticated
  const [checking, setChecking] = useState(!!localStorage.getItem('hd_admin_pass'))

  // Auto-login from saved password
  useEffect(() => {
    const saved = localStorage.getItem('hd_admin_pass')
    if (!saved) { setChecking(false); return }
    fetch('/api/tickets', { headers: { Authorization: `Bearer ${saved}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { setPassword(saved); setTickets(data) })
      .catch(() => { localStorage.removeItem('hd_admin_pass'); setPassword('') })
      .finally(() => setChecking(false))
  }, [])

  const handleLogin = (pw, data) => { setPassword(pw); setTickets(data) }

  const handleLogout = () => {
    localStorage.removeItem('hd_admin_pass')
    setPassword('')
    setTickets(null)
  }

  if (checking) return <p className="loading" style={{ padding: '48px 24px' }}>Loading…</p>
  if (tickets === null) return <LoginScreen onLogin={handleLogin} />
  return <Dashboard password={password} initialTickets={tickets} onLogout={handleLogout} />
}
