import { motion } from 'framer-motion';
import {
  LayoutDashboard, Building2, GraduationCap, BookOpen, DoorOpen,
  Users, UserCheck, Camera, Calendar, BarChart3, Monitor,
  Video, AlertTriangle, Bell, Upload, Home, Search, User,
  PanelLeftClose, PanelLeft,
} from 'lucide-react';

const menuConfig = {
  admin: [
    { key: 'dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
    { key: 'department',     icon: Building2,       label: 'Departments' },
    { key: 'class',          icon: GraduationCap,   label: 'Classes' },
    { key: 'subject',        icon: BookOpen,         label: 'Subjects' },
    { key: 'classroom',      icon: DoorOpen,         label: 'Classrooms' },
    { key: 'teacher',        icon: UserCheck,        label: 'Teachers' },
    { key: 'student',        icon: Users,            label: 'Students' },
    { divider: true },
    { key: 'cameraMapping',  icon: Camera,           label: 'Camera Mapping' },
    { key: 'timetable',      icon: Calendar,         label: 'Timetable' },
    { key: 'reports',        icon: BarChart3,         label: 'Reports' },
    { key: 'systemMonitor',  icon: Monitor,          label: 'System Monitor' },
  ],
  teacher: [
    { key: 'dashboard',      icon: Home,             label: 'Dashboard' },
    { key: 'liveAttendance', icon: Video,            label: 'Live Attendance' },
    { key: 'studentLookup',  icon: Search,           label: 'Student Lookup' },
    { key: 'timetable',      icon: Calendar,         label: 'Timetable' },
    { key: 'reports',        icon: BarChart3,         label: 'Reports' },
    { key: 'lowAttendance',  icon: AlertTriangle,    label: 'Low Attendance' },
  ],
  student: [
    { key: 'dashboard',      icon: Home,             label: 'Dashboard' },
    { key: 'attendance',     icon: BarChart3,         label: 'Attendance' },
    { key: 'calendar',       icon: Calendar,         label: 'Calendar' },
    { key: 'notifications',  icon: Bell,             label: 'Notifications' },
    { key: 'uploadFace',     icon: Upload,           label: 'Upload Face' },
    { key: 'profile',        icon: User,             label: 'Profile' },
  ],
};

export default function Sidebar({ role, activePage, onNavigate, collapsed, onToggleCollapse }) {
  const items = menuConfig[role] || [];

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          background: 'linear-gradient(180deg, rgba(2,8,23,0.98) 0%, rgba(10,22,40,0.98) 100%)',
          borderRight: '1px solid var(--glass-border)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div style={{
          padding: collapsed ? '20px 12px' : '20px 24px',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minHeight: 64,
        }}>
          <span style={{ fontSize: '1.4rem' }}>🤖</span>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-orbitron"
              style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)', whiteSpace: 'nowrap' }}
            >
              SmartAttend AI
            </motion.span>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {items.map((item, i) => {
            if (item.divider) {
              return <div key={`div-${i}`} style={{ height: 1, background: 'var(--glass-border)', margin: '12px 8px' }} />;
            }

            const Icon = item.icon;
            const isActive = activePage === item.key;

            return (
              <motion.button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: collapsed ? '12px 0' : '10px 16px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  background: isActive ? 'rgba(0, 245, 255, 0.08)' : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                  borderRadius: collapsed ? 8 : '0 8px 8px 0',
                  color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.2s ease',
                  marginBottom: 2,
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </motion.button>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          style={{
            padding: 16,
            background: 'none',
            border: 'none',
            borderTop: '1px solid var(--glass-border)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </motion.aside>

      {/* Mobile bottom nav */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 68,
        background: 'rgba(2,8,23,0.98)',
        borderTop: '1px solid var(--glass-border)',
        display: 'none',
        zIndex: 100,
        backdropFilter: 'blur(20px)',
      }}
      className="mobile-nav"
      >
        <style>{`@media (max-width: 768px) { .mobile-nav { display: flex !important; } }`}</style>
        {items.filter(i => !i.divider).slice(0, 5).map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                background: 'none',
                border: 'none',
                color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.65rem',
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
