import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import NeuralBackground from '../components/NeuralBackground';
import PageTransition from '../components/PageTransition';
import GlassCard from '../components/GlassCard';
import AnimatedCounter from '../components/AnimatedCounter';
import DataTable from '../components/DataTable';
import DrawerPanel from '../components/DrawerPanel';
import api from '../api/api';
import {
  Building2, GraduationCap, BookOpen, DoorOpen,
  UserCheck, Users, Camera, BarChart3, Plus,
  Activity, Monitor, Calendar,
} from 'lucide-react';

/* ── Admin sub-pages (inline) ─────────────────────── */
import DepartmentPage from './admin/DepartmentPage';
import ClassPage from './admin/ClassPage';
import SubjectPage from './admin/SubjectPage';
import ClassroomPage from './admin/ClassroomPage';
import TeacherPage from './admin/TeacherPage';
import StudentPage from './admin/StudentPage';
import CameraMappingPage from './admin/CameraMappingPage';
import TimetablePage from './admin/TimetablePage';
import ReportsPage from './admin/ReportsPage';
import SystemMonitorPage from './admin/SystemMonitorPage';

const toastStyle = {
  style: {
    background: '#0a1628', color: '#F0F9FF',
    border: '1px solid rgba(0,245,255,0.15)', borderRadius: 12,
  },
};

export default function AdminDashboard() {
  const [page, setPage] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [stats, setStats] = useState({ teachers: 0, students: 0, classes: 0, departments: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [t, s, c, d] = await Promise.all([
        api.get('/admin/teachers'),
        api.get('/admin/students'),
        api.get('/admin/classes'),
        api.get('/admin/departments'),
      ]);
      setStats({
        teachers: (t.data || []).length,
        students: (s.data || []).length,
        classes: (c.data || []).length,
        departments: (d.data || []).length,
      });
    } catch { /* silent */ }
  };

  const tiles = [
    { key: 'department', icon: Building2, title: 'Departments', desc: 'Manage MCA, BCA, MBA, BBA', color: '#7C3AED' },
    { key: 'class', icon: GraduationCap, title: 'Classes', desc: 'Create class/year/section', color: '#3B82F6' },
    { key: 'subject', icon: BookOpen, title: 'Subjects', desc: 'Assign subjects by department', color: '#10B981' },
    { key: 'classroom', icon: DoorOpen, title: 'Classrooms', desc: 'Add room number and location', color: '#F59E0B' },
    { key: 'teacher', icon: UserCheck, title: 'Teachers', desc: 'Add teachers with login access', color: '#EF4444' },
    { key: 'student', icon: Users, title: 'Students', desc: 'Add students with default password', color: '#00F5FF' },
    { key: 'cameraMapping', icon: Camera, title: 'Camera Mapping', desc: 'Map camera with classroom', color: '#EC4899' },
    { key: 'reports', icon: BarChart3, title: 'Reports', desc: 'Generate full attendance reports', color: '#8B5CF6' },
  ];

  const statCards = [
    { icon: '👨‍🏫', label: 'Teachers', value: stats.teachers, sub: 'Active' },
    { icon: '🧑‍🎓', label: 'Students', value: stats.students, sub: 'Enrolled' },
    { icon: '📚', label: 'Classes', value: stats.classes, sub: 'Running' },
    { icon: '🏛️', label: 'Departments', value: stats.departments, sub: 'Active' },
  ];

  return (
    <div className="layout-shell">
      <Toaster position="bottom-right" toastOptions={toastStyle} />
      <NeuralBackground />
      <Sidebar
        role="admin"
        activePage={page}
        onNavigate={setPage}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />
      <TopBar collapsed={collapsed} />

      <main className={`layout-main ${collapsed ? 'collapsed' : ''}`} style={{ position: 'relative', zIndex: 1 }}>
        <div className="layout-content">
          <PageTransition key={page}>
            {/* ── OVERVIEW ───────────────────────── */}
            {page === 'dashboard' && (
              <div>
                <h1 className="font-orbitron" style={{ fontSize: '1.5rem', marginBottom: 8 }}>
                  Admin Dashboard
                </h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>
                  Institutional command center — manage everything from here.
                </p>

                {/* Stat cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 16, marginBottom: 32,
                }}>
                  {statCards.map((s, i) => (
                    <GlassCard key={i}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{s.label}</span>
                      </div>
                      <AnimatedCounter to={s.value} />
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.sub}</div>
                    </GlassCard>
                  ))}
                </div>

                {/* Quick-access tiles */}
                <h2 className="font-orbitron" style={{ fontSize: '1rem', marginBottom: 16, color: 'var(--text-secondary)' }}>
                  Quick Access
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: 12,
                }}>
                  {tiles.map(tile => {
                    const Icon = tile.icon;
                    return (
                      <GlassCard key={tile.key} onClick={() => setPage(tile.key)} style={{ padding: 20 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 10,
                          background: `${tile.color}15`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginBottom: 12,
                        }}>
                          <Icon size={20} color={tile.color} />
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>{tile.title}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{tile.desc}</div>
                      </GlassCard>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── MANAGEMENT PAGES ──────────────── */}
            {page === 'department' && <DepartmentPage />}
            {page === 'class' && <ClassPage />}
            {page === 'subject' && <SubjectPage />}
            {page === 'classroom' && <ClassroomPage />}
            {page === 'teacher' && <TeacherPage />}
            {page === 'student' && <StudentPage />}
            {page === 'cameraMapping' && <CameraMappingPage />}
            {page === 'timetable' && <TimetablePage />}
            {page === 'reports' && <ReportsPage />}
            {page === 'systemMonitor' && <SystemMonitorPage />}
          </PageTransition>
        </div>
      </main>
    </div>
  );
}