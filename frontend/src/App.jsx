import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom'
import UserPortal from './pages/UserPortal'
import TicketStatus from './pages/TicketStatus'
import AdminDashboard from './pages/AdminDashboard'

function Nav() {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Helpdesk
        </Link>
        <div className="nav-links">
          <NavLink to="/" end>Submit Ticket</NavLink>
          <NavLink to="/ticket">Check Status</NavLink>
          <NavLink to="/admin">Admin</NavLink>
        </div>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<UserPortal />} />
          <Route path="/ticket" element={<TicketStatus />} />
          <Route path="/ticket/:id" element={<TicketStatus />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
