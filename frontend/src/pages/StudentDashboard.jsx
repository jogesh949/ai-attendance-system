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
import { Download, Upload, Bell, Calendar, Activity, TrendingUp, Clock, ArrowRight, User, ShieldCheck, Mail, Building2, BookOpen } from 'lucide-react';

const toastStyle = { style: { background: '#0a1628', color: '#F0F9FF', border: '1px solid rgba(0,245,255,0.15)', borderRadius: 12 } };

export default function StudentDashboard() {
  const [page, setPage] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [attendance, setAttendance] = useState([]);
  const [overall, setOverall] = useState(0);
  const [totalClasses, setTotalClasses] = useState(0);
  const [totalPresent, setTotalPresent] = useState(0);
  const [totalLate, setTotalLate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [streak, setStreak] = useState(5); // Mock streak
  const [faceRegistered, setFaceRegistered] = useState(false);

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
      setTotalClasses(res.data.total_classes || 0);
      setTotalPresent(res.data.total_present || 0);
      setTotalLate(res.data.total_late || 0);

      // Check face registration
      const studRes = await api.get('/admin/students');
      const me = (studRes.data || []).find(s => s.email === profile.email);
      if (me) setFaceRegistered(me.face_registered);
    } catch (err) {
      console.log('Student Data Error:', err);
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
    if (key === 'profile') { setPage('profile'); return; }
    setPage(key);
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return '👋 Good Morning';
    if (h < 17) return '👋 Good Afternoon';
    return '👋 Good Evening';
  };

  // Aggregate attendance by subject
  const getSubjectStats = () => {
    const stats = {};
    attendance.forEach(r => {
      if (!stats[r.subject]) {
        stats[r.subject] = { total: 0, present: 0, late: 0, name: r.subject };
      }
      stats[r.subject].total += 1;
      if (r.status === 'Present') stats[r.subject].present += 1;
      if (r.status === 'Late') stats[r.subject].late += 1;
    });

    return Object.values(stats).map(s => ({
      ...s,
      percentage: Math.round(((s.present + s.late * 0.5) / s.total) * 100)
    }));
  };

  const subjectStats = getSubjectStats();

  const attendanceMsg = overall >= 75 ? { text: 'Great work! 🌟', color: '#10B981' }
    : overall >= 50 ? { text: 'You can do better! 💪', color: '#F59E0B' }
    : { text: '⚠️ Attendance critical!', color: '#EF4444' };

  return (
    <div className="layout-shell">
      <Toaster position="bottom-right" toastOptions={toastStyle} />
      <NeuralBackground />
      <Sidebar role="student" activePage={page} onNavigate={handleNav} collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
      <TopBar collapsed={collapsed} />

      <main className={`layout-main ${collapsed ? 'collapsed' : ''}`} style={{ position: 'relative', zIndex: 1 }}>
        <div className="layout-content">
          <PageTransition key={page}>

            {/* ── COMMAND CENTER (DASHBOARD) ──────────────── */}
            {page === 'dashboard' && (
              <div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
                  <h1 className="font-orbitron" style={{ fontSize: '1.4rem', marginBottom: 4 }}>
                    {getGreeting()}, {profile.name || 'Student'}!
                  </h1>
                  <p style={{ color: 'var(--text-muted)' }}>AI Command Center • {new Date().toLocaleDateString()}</p>
                </motion.div>

                {/* Primary Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
                  <GlassCard style={{ display: 'flex', alignItems: 'center', gap: 24, padding: 24 }}>
                     <CircularProgress value={overall} size={100} strokeWidth={8} label="Overall" />
                     <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Status</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: attendanceMsg.color }}>{attendanceMsg.text.split(' ')[0]}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total: {totalPresent}/{totalClasses}</div>
                     </div>
                  </GlassCard>

                  <GlassCard style={{ display: 'flex', alignItems: 'center', gap: 24, padding: 24 }}>
                     <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(245, 158, 11, 0.2)' }}>
                        <span style={{ fontSize: '2rem' }}>🔥</span>
                     </div>
                     <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Attendance Streak</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F59E0B' }}>{streak} Days</div>
                        <div style={{ fontSize: '0.7rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                           <TrendingUp size={12} /> Keep it up!
                        </div>
                     </div>
                  </GlassCard>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
                   {/* Today's Schedule */}
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <h2 className="font-orbitron" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                         <Clock size={16} /> TODAY'S SCHEDULE
                      </h2>
                      <div style={{ display: 'grid', gap: 12 }}>
                         {[
                            { time: '09:00 AM', sub: 'Data Structures', room: 'Lab 402', status: 'completed' },
                            { time: '11:30 AM', sub: 'Machine Learning', room: 'Room 101', status: 'active' },
                            { time: '02:00 PM', sub: 'Cloud Computing', room: 'Seminar Hall', status: 'pending' },
                         ].map((s, i) => (
                            <GlassCard key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderLeft: `4px solid ${s.status === 'active' ? 'var(--accent-cyan)' : 'transparent'}` }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', width: 70 }}>{s.time}</div>
                                  <div>
                                     <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{s.sub}</div>
                                     <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Location: {s.room}</div>
                                  </div>
                               </div>
                               {s.status === 'active' ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-cyan)', fontSize: '0.7rem', fontWeight: 700 }}>
                                     <div className="pulse" style={{ width: 8, height: 8, background: 'var(--accent-cyan)', borderRadius: '50%' }} /> ONGOING
                                  </div>
                               ) : s.status === 'completed' ? (
                                  <span style={{ fontSize: '0.7rem', color: '#10B981' }}>COMPLETED</span>
                               ) : (
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>UPCOMING</span>
                               )}
                            </GlassCard>
                         ))}
                      </div>
                   </div>

                   {/* Quick Actions */}
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <h2 className="font-orbitron" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>QUICK ACTIONS</h2>
                      <div style={{ display: 'grid', gap: 12 }}>
                         <GlassCard onClick={() => window.location.href = '/student/upload-face'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, cursor: 'pointer' }} className="hover-bg">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                               <div style={{ padding: 10, background: 'rgba(0, 245, 255, 0.1)', borderRadius: 10 }}>
                                  <Upload size={18} color="var(--accent-cyan)" />
                               </div>
                               <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Sync Face ID</div>
                            </div>
                            <ArrowRight size={14} color="var(--text-muted)" />
                         </GlassCard>
                         
                         <GlassCard onClick={() => setPage('calendar')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, cursor: 'pointer' }} className="hover-bg">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                               <div style={{ padding: 10, background: 'rgba(139, 92, 246, 0.1)', borderRadius: 10 }}>
                                  <Calendar size={18} color="var(--accent-violet)" />
                               </div>
                               <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Attendance View</div>
                            </div>
                            <ArrowRight size={14} color="var(--text-muted)" />
                         </GlassCard>

                         <GlassCard onClick={() => setPage('profile')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, cursor: 'pointer' }} className="hover-bg">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                               <div style={{ padding: 10, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 10 }}>
                                  <User size={18} color="#3B82F6" />
                               </div>
                               <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Student Profile</div>
                            </div>
                            <ArrowRight size={14} color="var(--text-muted)" />
                         </GlassCard>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {/* ── ATTENDANCE HISTORY (COLLEGE VIEW) ─────── */}
            {page === 'attendance' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                  <div>
                    <h1 className="font-orbitron" style={{ fontSize: '1.4rem', marginBottom: 4 }}>Academic Attendance</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Real-time subject-wise performance tracking</p>
                  </div>
                  <button className="btn-primary" onClick={downloadReport}>
                    <Download size={14} /> Export full log
                  </button>
                </div>

                {/* Real College Summary Bar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
                   <GlassCard style={{ padding: 20 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>CLASSES HELD</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{totalClasses}</div>
                   </GlassCard>
                   <GlassCard style={{ padding: 20 }}>
                      <div style={{ fontSize: '0.75rem', color: '#10B981', marginBottom: 8 }}>TOTAL PRESENT</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10B981' }}>{totalPresent}</div>
                   </GlassCard>
                   <GlassCard style={{ padding: 20 }}>
                      <div style={{ fontSize: '0.75rem', color: '#F59E0B', marginBottom: 8 }}>TOTAL LATE</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F59E0B' }}>{totalLate}</div>
                   </GlassCard>
                   <GlassCard style={{ padding: 20 }}>
                      <div style={{ fontSize: '0.75rem', color: '#EF4444', marginBottom: 8 }}>TOTAL ABSENT</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#EF4444' }}>{totalClasses - (totalPresent + totalLate)}</div>
                   </GlassCard>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
                   {/* Left: Overall Ring */}
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <GlassCard style={{ textAlign: 'center', padding: 32 }}>
                         <CircularProgress value={overall} size={160} strokeWidth={12} label="Current Status" />
                         <div style={{ marginTop: 24, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Required for 75%</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: overall >= 75 ? '#10B981' : '#EF4444' }}>
                               {overall >= 75 ? "Safe Margin ✅" : `${Math.ceil((0.75 * totalClasses - (totalPresent + totalLate * 0.5)) / 0.25)} more classes`}
                            </div>
                         </div>
                      </GlassCard>
                      
                      <GlassCard>
                         <h3 className="font-orbitron" style={{ fontSize: '0.8rem', marginBottom: 16, color: 'var(--text-secondary)' }}>AI PREDICTION</h3>
                         <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            {overall >= 85 ? (
                               "Outstanding! Your attendance is significantly above the threshold. You have a safe buffer for medical emergencies."
                            ) : overall >= 75 ? (
                               "You're in the safe zone. One or two absences won't impact your eligibility, but keep it steady."
                            ) : (
                               "CRITICAL: You are below eligibility. Our AI predicts you need 95% attendance for the next two weeks to recover."
                            )}
                         </p>
                      </GlassCard>
                   </div>

                   {/* Right: Subject Breakdown Grid */}
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, alignContent: 'start' }}>
                      {subjectStats.map((sub, i) => (
                        <GlassCard key={i} style={{ padding: 24, borderLeft: `4px solid ${sub.percentage >= 75 ? '#10B981' : '#EF4444'}` }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                              <div style={{ maxWidth: '70%' }}>
                                 <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>COURSE</div>
                                 <div style={{ fontSize: '1rem', fontWeight: 700 }}>{sub.name}</div>
                              </div>
                              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: sub.percentage >= 75 ? '#10B981' : '#EF4444' }}>{sub.percentage}%</div>
                           </div>
                           
                           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                              <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                                 <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Attended</div>
                                 <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{sub.present} / {sub.total}</div>
                              </div>
                              <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                                 <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Margin</div>
                                 <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#10B981' }}>+{Math.max(0, sub.present - Math.ceil(0.75 * sub.total))}</div>
                              </div>
                           </div>

                           <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                              <motion.div
                                 initial={{ width: 0 }}
                                 animate={{ width: `${sub.percentage}%` }}
                                 style={{ height: '100%', background: sub.percentage >= 75 ? 'linear-gradient(90deg, #10B981, #34D399)' : 'linear-gradient(90deg, #EF4444, #F87171)' }}
                              />
                           </div>
                        </GlassCard>
                      ))}
                      
                      {subjectStats.length === 0 && (
                         <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0', opacity: 0.5 }}>
                            <BookOpen size={48} style={{ marginBottom: 16, margin: '0 auto' }} />
                            <p>No academic subject data found for this student profile.</p>
                         </div>
                      )}
                   </div>
                </div>
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

            {/* ── STUDENT PROFILE ─────────── */}
            {page === 'profile' && (
              <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <h1 className="font-orbitron" style={{ fontSize: '1.4rem', marginBottom: 24 }}>Student Profile</h1>
                
                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <GlassCard style={{ textAlign: 'center', padding: '32px 20px' }}>
                         <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0, 245, 255, 0.3)' }}>
                            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>{profile.name?.charAt(0)}</span>
                         </div>
                         <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 4 }}>{profile.name}</h2>
                         <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>{profile.email}</div>
                         <StatusBadge variant={faceRegistered ? 'online' : 'absent'} text={faceRegistered ? "Face ID Active" : "Face ID Missing"} />
                      </GlassCard>

                      <GlassCard>
                         <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase' }}>Document Vault</h3>
                         <div style={{ display: 'grid', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <Download size={14} color="var(--accent-cyan)" />
                                  <span style={{ fontSize: '0.8rem' }}>Sem_Report.pdf</span>
                               </div>
                               <ArrowRight size={12} color="var(--text-muted)" />
                            </div>
                            <button className="btn-ghost" onClick={downloadReport} style={{ width: '100%', fontSize: '0.75rem' }}>Download Current CSV</button>
                         </div>
                      </GlassCard>
                   </div>

                   <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <GlassCard>
                         <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ShieldCheck size={18} color="var(--accent-cyan)" /> PERSONAL INFORMATION
                         </h3>
                         
                         <div style={{ display: 'grid', gap: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                               <div style={{ padding: 12, background: 'rgba(0, 245, 255, 0.05)', borderRadius: 10 }}>
                                  <User size={20} color="var(--accent-cyan)" />
                               </div>
                               <div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Full Name</div>
                                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>{profile.name}</div>
                               </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                               <div style={{ padding: 12, background: 'rgba(139, 92, 246, 0.05)', borderRadius: 10 }}>
                                  <Mail size={20} color="var(--accent-violet)" />
                               </div>
                               <div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>University Email</div>
                                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>{profile.email}</div>
                               </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                               <div style={{ padding: 12, background: 'rgba(59, 130, 246, 0.05)', borderRadius: 10 }}>
                                  <Building2 size={20} color="#3B82F6" />
                               </div>
                               <div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Department</div>
                                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>School of Computer Applications</div>
                               </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                               <div style={{ padding: 12, background: 'rgba(16, 185, 129, 0.05)', borderRadius: 10 }}>
                                  <BookOpen size={20} color="#10B981" />
                               </div>
                               <div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Semester</div>
                                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>Semester VI (Final Year)</div>
                               </div>
                            </div>
                         </div>
                      </GlassCard>

                      <GlassCard style={{ background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                               <ShieldCheck size={20} color="white" />
                            </div>
                            <div>
                               <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Account Verified</div>
                               <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Your profile is synced with the university AI database.</div>
                            </div>
                         </div>
                      </GlassCard>
                   </div>
                </div>
              </div>
            )}
          </PageTransition>
        </div>
      </main>
    </div>
  );
}