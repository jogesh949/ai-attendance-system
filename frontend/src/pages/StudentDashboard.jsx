import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import api from '../api/api';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import NeuralBackground from '../components/NeuralBackground';
import PageTransition from '../components/PageTransition';
import GlassCard from '../components/GlassCard';
import CircularProgress from '../components/CircularProgress';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import { Download, Upload, Bell, Calendar } from 'lucide-react';

const toastStyle = { style: { background: '#0a1628', color: '#F0F9FF', border: '1px solid rgba(0,245,255,0.15)', borderRadius: 12 } };

export default function StudentDashboard() {
  const [page, setPage] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [attendance, setAttendance] = useState([]);
  const [overall, setOverall] = useState(0);
  const [loading, setLoading] = useState(false);

  const profile = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    if (!token) { window.location.href = '/login'; return; }
    try {
      setLoading(true);
      const res = await api.get('/student/attendance');
      setAttendance(res.data.records || []);
      setOverall(res.data.percentage || 0);
    } catch (err) {
      console.log('Student Attendance Error:', err);
    } finally { setLoading(false); }
  };

  const downloadReport = () => {
    if (attendance.length === 0) { toast.error('No attendance data'); return; }
    let csv = 'Subject,Status,Percentage\n';
    attendance.forEach(a => { csv += `${a.subject},${a.status},${a.percentage || 0}\n`; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = 'student_attendance_report.csv'; a.click();
    toast.success('📥 Report downloaded!');
  };

  const handleNav = (key) => {
    if (key === 'uploadFace') { window.location.href = '/student/upload-face'; return; }
    setPage(key);
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return '👋 Good Morning';
    if (h < 17) return '👋 Good Afternoon';
    return '👋 Good Evening';
  };

  const attendanceMsg = overall >= 75 ? { text: 'Great work! 🌟', color: '#10B981' }
    : overall >= 50 ? { text: 'You can do better! 💪', color: '#F59E0B' }
    : { text: '⚠️ Attendance critical!', color: '#EF4444' };

  const tableColumns = [
    { key: 'subject', label: 'Session', render: (row) => <span className="font-mono" style={{ color: 'var(--accent-cyan)' }}>Session #{row.subject}</span> },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge variant={row.status === 'Present' ? 'present' : row.status === 'Late' ? 'late' : 'absent'} /> },
    { key: 'percentage', label: 'Score', render: (row) => <span className="font-mono" style={{ color: row.percentage >= 75 ? '#10B981' : row.percentage >= 50 ? '#F59E0B' : '#EF4444' }}>{row.percentage || 0}%</span> },
  ];

  return (
    <div className="layout-shell">
      <Toaster position="bottom-right" toastOptions={toastStyle} />
      <NeuralBackground />
      <Sidebar role="student" activePage={page} onNavigate={handleNav} collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
      <TopBar collapsed={collapsed} />

      <main className={`layout-main ${collapsed ? 'collapsed' : ''}`} style={{ position: 'relative', zIndex: 1 }}>
        <div className="layout-content">
          <PageTransition key={page}>

            {/* ── DASHBOARD ──────────────── */}
            {(page === 'dashboard' || page === 'attendance') && (
              <div>
                {/* Welcome */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ marginBottom: 28 }}
                >
                  <h1 className="font-orbitron" style={{ fontSize: '1.4rem', marginBottom: 4 }}>
                    {getGreeting()}, {profile.name || 'Student'}!
                  </h1>
                  <p style={{ color: 'var(--text-muted)' }}>Here's your attendance overview</p>
                </motion.div>

                {/* Top 3 cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
                  {/* Card 1 — Overall */}
                  <GlassCard>
                    <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>Overall Attendance</h3>
                    <CircularProgress value={overall} size={130} label={attendanceMsg.text} />
                  </GlassCard>

                  {/* Card 2 — Face Enrollment */}
                  <GlassCard>
                    <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>Face Enrollment</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>Upload 5–10 clear face images for AI recognition</p>
                    <button className="btn-primary" onClick={() => window.location.href = '/student/upload-face'} style={{ width: '100%' }}>
                      <Upload size={14} /> Upload Face Images
                    </button>
                  </GlassCard>

                  {/* Card 3 — Alerts */}
                  <GlassCard glowColor={overall >= 75 ? 'green' : 'red'}>
                    <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>Alerts</h3>
                    <div style={{
                      padding: '16px',
                      background: overall >= 75 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      borderRadius: 12,
                      border: `1px solid ${overall >= 75 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      textAlign: 'center',
                    }}>
                      {overall >= 75 ? (
                        <span style={{ color: '#10B981', fontWeight: 600 }}>Good Attendance ✅</span>
                      ) : (
                        <span style={{ color: '#EF4444', fontWeight: 600 }}>Low Attendance ⚠️</span>
                      )}
                    </div>
                  </GlassCard>
                </div>

                {/* Attendance Table — BUG FIX: proper columns instead of concatenated text */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h2 className="font-orbitron" style={{ fontSize: '1rem' }}>Subject-wise Attendance</h2>
                  <button className="btn-ghost" onClick={downloadReport}>
                    <Download size={14} /> Download Report
                  </button>
                </div>

                <GlassCard>
                  <DataTable columns={tableColumns} data={attendance} isLoading={loading} emptyMessage="No attendance records found" />
                </GlassCard>
              </div>
            )}

            {/* ── CALENDAR ───────────────── */}
            {page === 'calendar' && (
              <div>
                <h1 className="font-orbitron" style={{ fontSize: '1.3rem', marginBottom: 24 }}>
                  <Calendar size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Calendar
                </h1>
                <GlassCard style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Calendar view coming soon. Track your attendance sessions visually.
                </GlassCard>
              </div>
            )}

            {/* ── NOTIFICATIONS ──────────── */}
            {page === 'notifications' && (
              <div>
                <h1 className="font-orbitron" style={{ fontSize: '1.3rem', marginBottom: 24 }}>
                  <Bell size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Notifications
                </h1>
                <GlassCard>
                  {overall < 75 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'rgba(239,68,68,0.08)', borderRadius: 12, border: '1px solid rgba(239,68,68,0.2)' }}>
                      <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                      <div>
                        <div style={{ fontWeight: 600, color: '#EF4444' }}>Low Attendance Warning</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Your overall attendance is {overall}%. Maintain above 75% to avoid issues.</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'rgba(16,185,129,0.08)', borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)' }}>
                      <span style={{ fontSize: '1.5rem' }}>✅</span>
                      <div>
                        <div style={{ fontWeight: 600, color: '#10B981' }}>You're on track!</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Your attendance is {overall}%. Keep it up!</div>
                      </div>
                    </div>
                  )}
                </GlassCard>
              </div>
            )}

          </PageTransition>
        </div>
      </main>
    </div>
  );
}