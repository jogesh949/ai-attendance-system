import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import api from '../api/api';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import NeuralBackground from '../components/NeuralBackground';
import PageTransition from '../components/PageTransition';
import GlassCard from '../components/GlassCard';
import ConfirmModal from '../components/ConfirmModal';
import StatusBadge from '../components/StatusBadge';
import CircularProgress from '../components/CircularProgress';
import AnimatedCounter from '../components/AnimatedCounter';
import { Video, Play, Square, FileDown, Rocket } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const toastStyle = { style: { background: '#0a1628', color: '#F0F9FF', border: '1px solid rgba(0,245,255,0.15)', borderRadius: 12 } };

export default function TeacherDashboard() {
  const [page, setPage] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);

  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [classroomId, setClassroomId] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmStart, setConfirmStart] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [detectionCounts, setDetectionCounts] = useState({});

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const captureIntervalRef = useRef(null);
  const streamRef = useRef(null);
  const token = localStorage.getItem('token');

  useEffect(() => { fetchDropdowns(); }, []);

  const fetchDropdowns = async () => {
    try {
      setLoading(true);
      const [c, s, r] = await Promise.all([
        api.get('/admin/classes'), api.get('/admin/subjects'), api.get('/admin/classrooms'),
      ]);
      setClasses(c.data || []); setSubjects(s.data || []); setClassrooms(r.data || []);
    } catch { toast.error('Failed to load dropdown data'); }
    finally { setLoading(false); }
  };

  const startSession = async () => {
    setConfirmStart(false);
    if (!classroomId || !classId || !subjectId) { toast.error('Please select all fields'); return; }
    try {
      const res = await axios.post(`${API_URL}/teacher/start-session`,
        { classroom_id: Number(classroomId), class_id: Number(classId), subject_id: Number(subjectId) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSessionId(res.data.session_id);
      // Load students for this class
      const studRes = await api.get('/admin/students');
      setStudents((studRes.data || []).filter(s => String(s.class_id) === String(classId)));
      setDetectionCounts({});
      setReport([]);
      setIsLive(true);
      setPage('liveAttendance');
      startCamera();
      toast.success('🚀 Session is live! The AI is watching...');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to start session');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      // Start capture loop
      captureIntervalRef.current = setInterval(captureFrame, 2000);
    } catch {
      toast.error('Camera access denied');
    }
  };

  const captureFrame = async () => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 640; canvas.height = 480;
    ctx.drawImage(videoRef.current, 0, 0, 640, 480);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const form = new FormData();
      form.append('file', blob, 'frame.jpg');
      form.append('session_id', String(sessionId));
      try {
        // No auth header — backend has no auth on this route
        const { data } = await axios.post(`${API_URL}/attendance/mark`, form);
        if (data.message === 'Attendance marked') {
          setDetectionCounts(prev => ({ ...prev, [data.student_id]: (prev[data.student_id] || 0) + 1 }));
          toast.success('👁️ Student detected and marked!');
        } else if (data.message === 'Attendance already marked') {
          setDetectionCounts(prev => ({ ...prev, [data.student_id]: (prev[data.student_id] || 0) + 1 }));
        }
      } catch { /* never break the loop */ }
    }, 'image/jpeg', 0.8);
  };

  const stopAndFinalize = async () => {
    setConfirmStop(false);
    try {
      // Stop capture
      clearInterval(captureIntervalRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      setIsLive(false);

      await axios.post(`${API_URL}/teacher/stop-session?session_id=${sessionId}`, {},
        { headers: { Authorization: `Bearer ${token}` } });

      const res = await axios.post(`${API_URL}/attendance/finalize/${sessionId}`);
      setReport(res.data.results || []);
      toast.success('✅ Attendance saved! Great session.');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to finalize');
    }
  };

  const manualCorrection = (studentId, newStatus) => {
    setReport(prev => prev.map(r => r.student_id === studentId ? { ...r, status: newStatus } : r));
  };

  const downloadCSV = () => {
    if (report.length === 0) { toast.error('No report available'); return; }
    let csv = 'Student ID,Status\n';
    report.forEach(r => { csv += `${r.student_id},${r.status}\n`; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `attendance_session_${sessionId}.csv`; a.click();
    toast.success('📥 Report downloaded! Check your Downloads folder.');
  };

  // Derive live stats
  const getStudentStatus = (id) => {
    const count = detectionCounts[id] || 0;
    if (count >= 3) return 'present';
    if (count >= 1) return 'late';
    return 'absent';
  };

  const presentCount = students.filter(s => getStudentStatus(s.id) === 'present').length;
  const lateCount = students.filter(s => getStudentStatus(s.id) === 'late').length;
  const absentCount = students.filter(s => getStudentStatus(s.id) === 'absent').length;
  const attendanceRate = students.length > 0 ? ((presentCount + lateCount) / students.length * 100) : 0;

  return (
    <div className="layout-shell">
      <Toaster position="bottom-right" toastOptions={toastStyle} />
      <NeuralBackground />
      <Sidebar role="teacher" activePage={page} onNavigate={setPage} collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
      <TopBar collapsed={collapsed} />

      <main className={`layout-main ${collapsed ? 'collapsed' : ''}`} style={{ position: 'relative', zIndex: 1 }}>
        <div className="layout-content">
          <PageTransition key={page}>

            {/* ── SESSION SETUP ─────────────── */}
            {page === 'dashboard' && (
              <div>
                <h1 className="font-orbitron" style={{ fontSize: '1.5rem', marginBottom: 24 }}>Teacher Dashboard</h1>
                <GlassCard style={{ maxWidth: 560, margin: '40px auto', textAlign: 'center', padding: 40 }}>
                  <Rocket size={32} color="var(--accent-cyan)" style={{ marginBottom: 16 }} />
                  <h2 className="font-orbitron" style={{ fontSize: '1.1rem', marginBottom: 24 }}>Start New AI Attendance Session</h2>

                  <div style={{ display: 'grid', gap: 16, textAlign: 'left' }}>
                    <div className="form-group">
                      <label className="form-label">Classroom</label>
                      <select className="input-field" value={classroomId} onChange={e => setClassroomId(e.target.value)}>
                        <option value="">Select Classroom</option>
                        {classrooms.map(r => <option key={r.id} value={r.id}>{r.room_name} {r.location ? `- ${r.location}` : ''}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Class</label>
                      <select className="input-field" value={classId} onChange={e => setClassId(e.target.value)}>
                        <option value="">Select Class</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Subject</label>
                      <select className="input-field" value={subjectId} onChange={e => setSubjectId(e.target.value)}>
                        <option value="">Select Subject</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <button className="btn-primary" onClick={() => setConfirmStart(true)} style={{ width: '100%', marginTop: 24, padding: 14 }}>
                    <Play size={16} /> START SESSION
                  </button>
                </GlassCard>

                {/* Action buttons for post-session */}
                {report.length > 0 && (
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
                    <button className="btn-primary" onClick={downloadCSV}><FileDown size={14} /> Download CSV</button>
                  </div>
                )}

                {/* Report & corrections */}
                {report.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginTop: 24 }}>
                    <GlassCard>
                      <h3 style={{ fontSize: '0.9rem', marginBottom: 12, color: 'var(--accent-cyan)' }}>Class Report</h3>
                      <div style={{ display: 'grid', gap: 8 }}>
                        <div>✅ Present: {report.filter(r => r.status === 'Present').length}</div>
                        <div>❌ Absent: {report.filter(r => r.status === 'Absent').length}</div>
                        <div>⏰ Late: {report.filter(r => r.status === 'Late').length}</div>
                      </div>
                    </GlassCard>
                    <GlassCard>
                      <h3 style={{ fontSize: '0.9rem', marginBottom: 12, color: 'var(--accent-cyan)' }}>Manual Correction</h3>
                      {report.map(r => (
                        <div key={r.student_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <span style={{ fontSize: '0.85rem' }}>Student {r.student_id}</span>
                          <select className="input-field" value={r.status} onChange={e => manualCorrection(r.student_id, e.target.value)} style={{ width: 120, padding: '6px 10px' }}>
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Late">Late</option>
                          </select>
                        </div>
                      ))}
                    </GlassCard>
                  </div>
                )}
              </div>
            )}

            {/* ── LIVE SESSION ──────────────── */}
            {page === 'liveAttendance' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <h1 className="font-orbitron" style={{ fontSize: '1.3rem' }}>Live AI Attendance</h1>
                  {isLive && <StatusBadge variant="live" />}
                  <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Session #{sessionId}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
                  {/* Left — Camera */}
                  <div>
                    <GlassCard style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
                      {/* HUD Corners */}
                      <div style={{ position: 'absolute', top: 0, left: 0, width: 30, height: 30, borderTop: '3px solid var(--accent-cyan)', borderLeft: '3px solid var(--accent-cyan)', zIndex: 5, borderRadius: '4px 0 0 0' }} />
                      <div style={{ position: 'absolute', top: 0, right: 0, width: 30, height: 30, borderTop: '3px solid var(--accent-cyan)', borderRight: '3px solid var(--accent-cyan)', zIndex: 5, borderRadius: '0 4px 0 0' }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 30, height: 30, borderBottom: '3px solid var(--accent-cyan)', borderLeft: '3px solid var(--accent-cyan)', zIndex: 5, borderRadius: '0 0 0 4px' }} />
                      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderBottom: '3px solid var(--accent-cyan)', borderRight: '3px solid var(--accent-cyan)', zIndex: 5, borderRadius: '0 0 4px 0' }} />

                      {/* Status overlay */}
                      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 5, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isLive && <StatusBadge variant="live" />}
                        <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: 4 }}>
                          AI ACTIVE • #{sessionId}
                        </span>
                      </div>

                      <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', display: 'block', background: '#000', minHeight: 360 }} />
                      <canvas ref={canvasRef} style={{ display: 'none' }} />
                    </GlassCard>

                    <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                      <button className="btn-danger" onClick={() => setConfirmStop(true)} disabled={!isLive} style={{ flex: 1 }}>
                        <Square size={14} /> STOP & FINALIZE
                      </button>
                      <button className="btn-primary" onClick={downloadCSV} disabled={report.length === 0} style={{ flex: 1 }}>
                        <FileDown size={14} /> Download CSV
                      </button>
                    </div>
                  </div>

                  {/* Right — Stats + Student list */}
                  <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
                    <GlassCard>
                      <h3 className="font-orbitron" style={{ fontSize: '0.8rem', marginBottom: 16, color: 'var(--text-muted)' }}>LIVE STATS</h3>
                      <CircularProgress value={attendanceRate} size={120} label="Attendance Rate" />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
                        {[
                          { label: '✅ Present', val: presentCount, c: '#10B981' },
                          { label: '⏰ Late', val: lateCount, c: '#F59E0B' },
                          { label: '❌ Absent', val: absentCount, c: '#EF4444' },
                          { label: '👥 Total', val: students.length, c: '#00F5FF' },
                        ].map((s, i) => (
                          <div key={i} style={{ textAlign: 'center', padding: 8, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                            <div className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: s.c }}>{s.val}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </GlassCard>

                    <GlassCard style={{ maxHeight: 300, overflow: 'auto' }}>
                      <h3 className="font-orbitron" style={{ fontSize: '0.8rem', marginBottom: 12, color: 'var(--text-muted)' }}>STUDENT STATUS</h3>
                      {students.length === 0 ? (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No students loaded</div>
                      ) : (
                        students.map(s => (
                          <motion.div
                            key={s.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                          >
                            <span style={{ fontSize: '0.8rem' }}>Roll: {s.roll_no}</span>
                            <StatusBadge variant={getStudentStatus(s.id)} />
                          </motion.div>
                        ))
                      )}
                    </GlassCard>
                  </div>
                </div>
              </div>
            )}

            {/* ── LOW ATTENDANCE ──────────── */}
            {page === 'lowAttendance' && (
              <div>
                <h1 className="font-orbitron" style={{ fontSize: '1.3rem', marginBottom: 24 }}>⚠️ Low Attendance</h1>
                <GlassCard>
                  {report.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Finalize a session to see low-attendance students.</div>
                  ) : (
                    report.filter(r => r.status !== 'Present').map(r => (
                      <div key={r.student_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <span>Student {r.student_id}</span>
                        <StatusBadge variant={r.status === 'Late' ? 'late' : 'absent'} />
                      </div>
                    ))
                  )}
                </GlassCard>
              </div>
            )}

            {/* ── TIMETABLE (read-only) ───── */}
            {page === 'timetable' && (
              <div>
                <h1 className="font-orbitron" style={{ fontSize: '1.3rem', marginBottom: 24 }}>📅 Timetable</h1>
                <GlassCard style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Timetable is managed by Admin. View-only mode.
                </GlassCard>
              </div>
            )}

            {/* ── REPORTS ─────────────────── */}
            {page === 'reports' && (
              <div>
                <h1 className="font-orbitron" style={{ fontSize: '1.3rem', marginBottom: 24 }}>📈 Session Reports</h1>
                {report.length === 0 ? (
                  <GlassCard style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Finalize a session to generate a report.</GlassCard>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                      <GlassCard glowColor="green" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{report.filter(r => r.status === 'Present').length}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Present</div>
                      </GlassCard>
                      <GlassCard glowColor="amber" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning)' }}>{report.filter(r => r.status === 'Late').length}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Late</div>
                      </GlassCard>
                      <GlassCard glowColor="red" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>{report.filter(r => r.status === 'Absent').length}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Absent</div>
                      </GlassCard>
                    </div>
                    <button className="btn-primary" onClick={downloadCSV}><FileDown size={14} /> Download CSV</button>
                  </>
                )}
              </div>
            )}

          </PageTransition>
        </div>
      </main>

      {/* Confirm modals */}
      <ConfirmModal isOpen={confirmStart} icon="🚀" title="Start Session?" message={`Classroom: ${classrooms.find(r => String(r.id) === classroomId)?.room_name || classroomId}\nClass: ${classes.find(c => String(c.id) === classId)?.name || classId}\nSubject: ${subjects.find(s => String(s.id) === subjectId)?.name || subjectId}`} onConfirm={startSession} onCancel={() => setConfirmStart(false)} confirmLabel="Start Session" />
      <ConfirmModal isOpen={confirmStop} icon="⏹️" title="Stop & Finalize?" message={`Present: ${presentCount} | Late: ${lateCount} | Absent: ${absentCount}`} onConfirm={stopAndFinalize} onCancel={() => setConfirmStop(false)} confirmLabel="Stop & Finalize" />
    </div>
  );
}