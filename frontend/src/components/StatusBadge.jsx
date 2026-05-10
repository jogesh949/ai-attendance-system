const variants = {
  present: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: 'rgba(16, 185, 129, 0.3)', label: '✅ Present' },
  absent:  { bg: 'rgba(239, 68, 68, 0.15)',  color: '#EF4444', border: 'rgba(239, 68, 68, 0.3)',  label: '❌ Absent'  },
  late:    { bg: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)', label: '⏰ Late'    },
  live:    { bg: 'rgba(239, 68, 68, 0.15)',  color: '#EF4444', border: 'rgba(239, 68, 68, 0.3)',  label: '🔴 LIVE'    },
  online:  { bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: 'rgba(16, 185, 129, 0.3)', label: '🟢 Online'  },
  offline: { bg: 'rgba(239, 68, 68, 0.15)',  color: '#EF4444', border: 'rgba(239, 68, 68, 0.3)',  label: '🔴 Offline' },
  degraded:{ bg: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)', label: '🟡 Degraded'},
  simulated:{ bg: 'rgba(0, 245, 255, 0.15)', color: 'var(--accent-cyan)', border: 'rgba(0, 245, 255, 0.3)', label: '🛠️ Simulated'},
};

export default function StatusBadge({ variant = 'present', text }) {
  const v = variants[variant] || variants.present;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '4px 12px',
      borderRadius: 20,
      fontSize: '0.75rem',
      fontWeight: 600,
      background: v.bg,
      color: v.color,
      border: `1px solid ${v.border}`,
      whiteSpace: 'nowrap',
    }}>
      {variant === 'live' && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: v.color,
          animation: 'pulse-ring 1.5s ease-out infinite',
          display: 'inline-block',
        }} />
      )}
      {text || v.label}
    </span>
  );
}
