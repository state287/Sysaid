const palette = {
  'Open':        { bg: '#dbeafe', color: '#1d4ed8' },
  'In Progress': { bg: '#fef3c7', color: '#92400e' },
  'Resolved':    { bg: '#d1fae5', color: '#065f46' },
  'Closed':      { bg: '#f3f4f6', color: '#4b5563' },
}

export default function StatusBadge({ status }) {
  const { bg, color } = palette[status] ?? palette['Open']
  return (
    <span style={{
      background: bg,
      color,
      padding: '3px 10px',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      whiteSpace: 'nowrap',
      letterSpacing: '0.02em',
    }}>
      {status}
    </span>
  )
}
