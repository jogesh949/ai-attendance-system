import { motion } from 'framer-motion';

export default function DataTable({ columns, data, isLoading, emptyMessage = 'No data found' }) {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <div style={{
          width: 40, height: 40, border: '3px solid rgba(0,245,255,0.2)',
          borderTop: '3px solid var(--accent-cyan)',
          borderRadius: '50%', animation: 'spin 1s linear infinite',
        }} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: 60,
        color: 'var(--text-muted)', fontSize: '0.9rem',
      }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} style={{
                textAlign: 'left',
                padding: '12px 16px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                borderBottom: '1px solid var(--glass-border)',
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <motion.tr
              key={row.id || rowIndex}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: rowIndex * 0.04, duration: 0.3 }}
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(0,245,255,0.03)';
                e.currentTarget.style.borderLeft = '3px solid var(--accent-cyan)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderLeft = '3px solid transparent';
              }}
            >
              {columns.map((col, colIndex) => (
                <td key={colIndex} style={{
                  padding: '12px 16px',
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                }}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
