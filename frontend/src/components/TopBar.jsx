import { useState, useRef, useEffect } from 'react';
import { LogOut, User, ChevronDown } from 'lucide-react';

const roleBadges = {
  admin: { emoji: '👑', label: 'Administrator', color: '#F59E0B' },
  teacher: { emoji: '👨‍🏫', label: 'Teacher', color: '#7C3AED' },
  student: { emoji: '🎓', label: 'Student', color: '#10B981' },
};

function getInitialColor(name) {
  const colors = ['#00F5FF', '#7C3AED', '#10B981', '#F59E0B', '#3B82F6', '#EF4444'];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function TopBar({ collapsed }) {
  const [open, setOpen] = useState(false);
  const dropRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = localStorage.getItem('role') || 'student';
  const badge = roleBadges[role] || roleBadges.student;
  const initials = (user.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const avatarColor = getInitialColor(user.name);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const logout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: collapsed ? 72 : 260,
      right: 0,
      height: 64,
      background: 'rgba(2,8,23,0.9)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--glass-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      zIndex: 99,
      transition: 'left 0.3s ease',
    }}>
      {/* Left — role badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          padding: '4px 12px',
          borderRadius: 20,
          fontSize: '0.75rem',
          fontWeight: 600,
          background: `${badge.color}22`,
          color: badge.color,
          border: `1px solid ${badge.color}44`,
        }}>
          {badge.emoji} {badge.label}
        </span>
      </div>

      {/* Right — avatar */}
      <div ref={dropRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-primary)',
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}88)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 700, color: '#020817',
          }}>
            {initials}
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{user.name || 'User'}</span>
          <ChevronDown size={14} style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s',
          }} />
        </button>

        {open && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            width: 200,
            background: 'var(--bg-cosmic-light)',
            border: '1px solid var(--glass-border)',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--glass-border)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
            </div>
            <button
              onClick={logout}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '12px 16px',
                background: 'none', border: 'none',
                color: 'var(--danger)', cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: 500,
              }}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
