interface Props {
  known: number
  total: number
}

export default function ProgressBar({ known, total }: Props) {
  const pct = total > 0 ? Math.round((known / total) * 100) : 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
      <div style={{
        flex: 1, height: '3px',
        background: 'var(--border)', borderRadius: '2px',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: 'var(--amber)', borderRadius: '2px',
          transition: 'width 0.3s',
        }} />
      </div>
      <span style={{ fontSize: '11px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
        {known} / {total} слов
      </span>
    </div>
  )
}
