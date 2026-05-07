import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api, { API } from '../../api/api';
import GlassCard from '../../components/GlassCard';
import AnimatedCounter from '../../components/AnimatedCounter';
import StatusBadge from '../../components/StatusBadge';
import { Monitor, RefreshCw } from 'lucide-react';

export default function SystemMonitorPage() {
  const [status, setStatus] = useState('offline');
  const [lastPing, setLastPing] = useState(null);
  const [pings, setPings] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [counts, setCounts] = useState({ teachers: 0, students: 0, departments: 0, classes: 0, subjects: 0, classrooms: 0 });

  const healthCheck = useCallback(async () => {
    const start = Date.now();
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${apiUrl}/`);
      const ping = Date.now() - start;
      setLastPing(ping);
      setPings(prev => [...prev.slice(-9), ping]);
      setStatus(res.ok ? (ping < 1000 ? 'online' : 'degraded') : 'degraded');
      setLastChecked(new Date());
    } catch {
      setStatus('offline');
      setLastPing(null);
      setLastChecked(new Date());
    }
  }, []);

  const fetchCounts = useCallback(async () => {
    try {
      const [t, s, d, c, sub, r] = await Promise.all([
        api.get('/admin/teachers'), api.get('/admin/students'),
        api.get('/admin/departments'), api.get('/admin/classes'),
        api.get('/admin/subjects'), api.get('/admin/classrooms'),
      ]);
      setCounts({
        teachers: (t.data || []).length, students: (s.data || []).length,
        departments: (d.data || []).length, classes: (c.data || []).length,
        subjects: (sub.data || []).length, classrooms: (r.data || []).length,
      });
    } catch { /* silent */ }
  }, []);

  useEffect(() => { healthCheck(); fetchCounts(); }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => { healthCheck(); fetchCounts(); }, 30000);
    return () => clearInterval(id);
  }, [autoRefresh, healthCheck, fetchCounts]);

  const avgPing = pings.length > 0 ? Math.round(pings.reduce((a, b) => a + b, 0) / pings.length) : 0;

  const services = [
    { name: 'Backend API', status: status, detail: lastPing ? `${lastPing}ms` : 'N/A' },
    { name: 'Auth (JWT)', status: localStorage.getItem('token') ? 'online' : 'offline', detail: localStorage.getItem('token') ? 'Valid' : 'No token' },
    { name: 'Camera Service', status: 'degraded', detail: 'Browser-based' },
    { name: 'Database', status: status, detail: status === 'online' ? 'Connected' : 'Unknown' },
  ];

  const entityList = [
    { label: 'Teachers', value: counts.teachers },
    { label: 'Students', value: counts.students },
    { label: 'Departments', value: counts.departments },
    { label: 'Classes', value: counts.classes },
    { label: 'Subjects', value: counts.subjects },
    { label: 'Classrooms', value: counts.classrooms },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Monitor size={24} color="var(--accent-cyan)" />
          <h1 className="font-orbitron" style={{ fontSize: '1.3rem' }}>System Monitor</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {lastChecked && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last: {lastChecked.toLocaleTimeString()}</span>}
          <button className="btn-ghost" onClick={() => { healthCheck(); fetchCounts(); toast.success(`🟢 Backend is healthy — ${lastPing || 0}ms`); }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className={autoRefresh ? 'btn-success' : 'btn-ghost'} onClick={() => setAutoRefresh(!autoRefresh)}>
            Auto: {autoRefresh ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 16 }}>
        <GlassCard>
          <h3 style={{ fontSize: '0.9rem', marginBottom: 16, color: 'var(--text-secondary)' }}>Service Status</h3>
          {services.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: '0.85rem' }}>{s.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.detail}</span>
                <StatusBadge variant={s.status} />
              </div>
            </div>
          ))}
        </GlassCard>

        <GlassCard>
          <h3 style={{ fontSize: '0.9rem', marginBottom: 16, color: 'var(--text-secondary)' }}>Response Time</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
            <span className="font-mono" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{lastPing || '—'}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ms last ping</span>
            <span className="font-mono" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Avg: {avgPing}ms</span>
          </div>
          {/* Mini sparkline */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 40 }}>
            {pings.map((p, i) => (
              <div key={i} style={{
                flex: 1, height: `${Math.min(100, (p / Math.max(...pings, 1)) * 100)}%`,
                background: p < 500 ? 'var(--accent-cyan)' : p < 1000 ? 'var(--warning)' : 'var(--danger)',
                borderRadius: '2px 2px 0 0', minHeight: 4, opacity: 0.7,
              }} />
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: '0.9rem', marginBottom: 16, color: 'var(--text-secondary)' }}>Live Entity Counts</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {entityList.map((e, i) => (
            <div key={i} style={{ textAlign: 'center', padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
              <AnimatedCounter to={e.value} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{e.label}</div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
