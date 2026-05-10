import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
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
import { Video, Play, Square, FileDown, Rocket, Users, Search, Pencil, Trash2, Wifi, AlertTriangle, BarChart3 as ChartIcon, Calendar as CalendarIcon } from 'lucide-react';

const toastStyle = { style: { background: '#0a1628', color: '#F0F9FF', border: '1px solid rgba(0,245,255,0.15)', borderRadius: 12 } };

import StudentLookupPage from './teacher/StudentLookupPage';

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
  
  // Session states
  const [confirmStart, setConfirmStart] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [activeSource, setActiveSource] = useState('0');
  const [detectionCounts, setDetectionCounts] = useState({});

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const streamRef = useRef(null);
  const captureIntervalRef = useRef(null);

  useEffect(() => { fetchDropdowns(); }, []);

  useEffect(() => {
    if (page === 'liveAttendance' && stream && videoRef.current && !isSimulated) {
      videoRef.current.srcObject = stream;
    }
  }, [page, stream, isSimulated]);

  const fetchDropdowns = async () => {
    try {
      setLoading(true);
      const [c, s, r] = await Promise.all([
        api.get('/admin/classes'), api.get('/admin/subjects'), api.get('/admin/classrooms'),
      ]);
      setClasses(c.data || []); setSubjects(s.data || []); setClassrooms(r.data || []);
    } catch (err) {
      console.error('Dropdown fetch error:', err);
      toast.error('Failed to load dropdown data');
    } finally { setLoading(false); }
  };

  const startSession = async () => {
    setConfirmStart(false);
    if (!classroomId || !classId || !subjectId) { toast.error('Please select all fields'); return; }
    try {
      const res = await api.post('/teacher/start-session',
        { classroom_id: Number(classroomId), class_id: Number(classId), subject_id: Number(subjectId) }
      );
      const sid = res.data.session_id;
      setSessionId(sid);
      setActiveSource(res.data.camera_source);
      
      const studRes = await api.get('/admin/students');
      const studentsForClass = (studRes.data || []).filter(s => String(s.class_id) === String(classId));
      setStudents(studentsForClass);
      
      setDetectionCounts({});
      setReport([]);
      setIsLive(true);
      setPage('liveAttendance');

      // Routing logic for hardware
      if (String(res.data.camera_source).startsWith('rtsp')) {
          toast.success('🛰️ Connected to Remote Infrastructure');
          startSimulation(sid, studentsForClass);
      } else {
          startCamera(sid);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to start session');
    }
  };

  const startCamera = async (sid) => {
    setCameraError(false);
    setIsSimulated(false);
    try {
      // Check for secure context
      if (!window.isSecureContext) {
        throw new Error('Insecure Context: Camera access requires HTTPS or localhost');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      captureIntervalRef.current = setInterval(() => captureFrame(sid || sessionId), 2000);
      toast.success('🚀 AI engine initialized on primary camera.');
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError(true);
      
      let msg = 'Hardware Access Denied';
      if (err.name === 'NotAllowedError') msg = 'Camera Permission Blocked';
      else if (err.name === 'NotFoundError') msg = 'No Camera Hardware Found';
      else if (err.name === 'NotReadableError') msg = 'Camera Already in Use';
      else if (err.message.includes('Insecure')) msg = 'HTTPS Required for Camera';
      
      toast.error(msg);
    }
  };

  const startSimulation = (sid, initialStudents) => {
    setCameraError(false);
    setIsSimulated(true);
    toast.success('🛠️ Simulation Active: Generating mock AI analytics...');
    
    const activeStudents = initialStudents || students;

    // Clear any existing interval
    if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);

    captureIntervalRef.current = setInterval(async () => {
      if (!activeStudents || activeStudents.length === 0) return;
      
      const rand = activeStudents[Math.floor(Math.random() * activeStudents.length)];
      
      try {
        // Increment local count
        setDetectionCounts(prev => {
            const newCount = (prev[rand.id] || 0) + 1;
            // Optionally sync with backend manually for simulation persistence
            if (newCount === 3) { // Use 3 as threshold for Present
                 api.post('/attendance/manual-update', {
                    session_id: sid || sessionId,
                    student_id: rand.id,
                    status: 'Present'
                 }).catch(() => {});
            }
            return { ...prev, [rand.id]: newCount };
        });
        
        toast.success(`👁️ AI Detected: ${rand.name}`, { 
            icon: '🤖',
            duration: 1000,
            style: { ...toastStyle.style, border: '1px solid #10B981' }
        });
      } catch (err) {
        console.error('Simulation error:', err);
      }
    }, 4000); // Slower interval for better readability
  };

  const captureFrame = async (sid) => {
    if (!canvasRef.current || !videoRef.current || isSimulated) return;
    
    setIsAnalyzing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Use actual video dimensions to avoid distortion
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) { setIsAnalyzing(false); return; }
      const form = new FormData();
      form.append('file', blob, 'frame.jpg');
      form.append('session_id', String(sid));
      try {
        const { data } = await api.post('/attendance/mark', form);
        if (data.message === 'Attendance marked') {
          setDetectionCounts(prev => ({ ...prev, [data.student_id]: (prev[data.student_id] || 0) + 1 }));
          toast.success('👁️ Student detected and marked!');
        } else if (data.message === 'Attendance already marked') {
          setDetectionCounts(prev => ({ ...prev, [data.student_id]: (prev[data.student_id] || 0) + 1 }));
        } else if (data.message === 'Face not recognized') {
          console.log('AI Status: Face not recognized');
        }
      } catch (err) {
        console.error('Frame processing error:', err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 'image/jpeg', 0.9); // Higher quality
  };

  const stopAndFinalize = async () => {
    setConfirmStop(false);
    try {
      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setStream(null);
      
      setIsLive(false);
      setIsSimulated(false);

      await api.post(`/teacher/stop-session?session_id=${sessionId}`, {});
      const res = await api.post(`/attendance/finalize/${sessionId}`);
      
      const studRes = await api.get('/admin/students');
      const allStudents = studRes.data || [];
      
      const enrichedReport = (res.data.results || []).map(r => {
        const s = allStudents.find(st => st.id === r.student_id);
        return { ...r, name: s?.name || `Student ${r.student_id}`, roll_no: s?.roll_no || 'N/A' };
      });

      setReport(enrichedReport);
      toast.success('✅ Session stopped! Review attendance below.');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to stop session');
    }
  };

  const manualCorrection = async (studentId, newStatus) => {
    try {
      await api.post('/attendance/manual-update', {
        session_id: sessionId,
        student_id: studentId,
        status: newStatus
      });
      setReport(prev => prev.map(r => r.student_id === studentId ? { ...r, status: newStatus } : r));
      toast.success('Attendance updated manually');
    } catch {
      toast.error('Failed to sync manual update');
    }
  };

  const downloadCSV = () => {
    if (report.length === 0) { toast.error('No report available'); return; }
    let csv = 'Student ID,Name,Roll No,Status\n';
    report.forEach(r => { csv += `${r.student_id},"${r.name}",${r.roll_no},${r.status}\n`; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `attendance_session_${sessionId}.csv`; a.click();
    toast.success('📥 Report downloaded!');
  };

  const getStudentStatus = (id) => {
    const count = detectionCounts[id] || 0;
    // Follow 75% rule logic in frontend for consistency
    return count >= 3 ? 'present' : 'absent';
  };

  const presentCount = students.filter(s => getStudentStatus(s.id) === 'present').length;
  const absentCount = students.filter(s => getStudentStatus(s.id) === 'absent').length;
  const attendanceRate = students.length > 0 ? (presentCount / students.length * 100) : 0;

  return (
    <div className="layout-shell">
      <Toaster position="bottom-right" toastOptions={toastStyle} />
      <NeuralBackground />
      <Sidebar role="teacher" activePage={page} onNavigate={setPage} collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
      <TopBar collapsed={collapsed} />

      <main className={`layout-main ${collapsed ? 'collapsed' : ''}`}>
        <div className="layout-content">
          <PageTransition key={page}>

            {page === 'dashboard' && (
              <div>
                <h1 className="font-orbitron" style={{ fontSize: '1.5rem', marginBottom: 24 }}>Teacher Dashboard</h1>
                <GlassCard style={{ maxWidth: 560, margin: '40px auto', textAlign: 'center', padding: 40 }}>
                  <Rocket size={32} color="var(--accent-cyan)" style={{ marginBottom: 16 }} />
                  <h2 className="font-orbitron" style={{ fontSize: '1.1rem', marginBottom: 24 }}>AI Attendance Session</h2>

                  <div style={{ display: 'grid', gap: 16, textAlign: 'left' }}>
                    <div className="form-group">
                      <label className="form-label">Classroom</label>
                      <select className="input-field" value={classroomId} onChange={e => setClassroomId(e.target.value)}>
                        <option value="">Select Classroom</option>
                        {classrooms.map(r => <option key={r.id} value={r.id}>{r.room_name}</option>)}
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

                {report.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginTop: 24 }}>
                    <GlassCard>
                      <h3 style={{ fontSize: '0.9rem', marginBottom: 12, color: 'var(--accent-cyan)' }}>Session Statistics</h3>
                      <div style={{ display: 'grid', gap: 8 }}>
                        <div>✅ Present: {report.filter(r => r.status === 'Present').length}</div>
                        <div>❌ Absent: {report.filter(r => r.status === 'Absent').length}</div>
                      </div>
                      <button className="btn-primary" onClick={downloadCSV} style={{ marginTop: 20, width: '100%' }}><FileDown size={14} /> Download CSV</button>
                    </GlassCard>
                    <GlassCard>
                      <h3 style={{ fontSize: '0.9rem', marginBottom: 12, color: 'var(--accent-cyan)' }}>Manual Attendance Correction</h3>
                      <div style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 10 }}>
                        {report.map(r => (
                          <div key={r.student_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{r.name}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Roll: {r.roll_no}</span>
                            </div>
                            <select className="input-field" value={r.status} onChange={e => manualCorrection(r.student_id, e.target.value)} style={{ width: 120, padding: '6px 10px', fontSize: '0.8rem' }}>
                              <option value="Present">Present</option>
                              <option value="Absent">Absent</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  </div>
                )}
              </div>
            )}

            {page === 'liveAttendance' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <h1 className="font-orbitron" style={{ fontSize: '1.3rem' }}>Live AI Monitoring</h1>
                  {(isLive || isSimulated) && <StatusBadge variant={isSimulated ? "simulated" : "live"} />}
                  <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Session #{sessionId}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
                  <div>
                    <GlassCard style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 5, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: 4 }}>
                          {isSimulated ? 'REMOTE INFRASTRUCTURE' : 'AI ACTIVE'} • #{sessionId}
                        </span>
                        {isAnalyzing && (
                          <span className="font-mono" style={{ fontSize: '0.7rem', color: '#10B981', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                             <div className="pulse" style={{ width: 6, height: 6, background: '#10B981', borderRadius: '50%' }} /> AI PROCESSING...
                          </span>
                        )}
                      </div>

                      {cameraError && !isSimulated ? (
                        <div style={{ width: '100%', height: 360, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 40, textAlign: 'center' }}>
                           <Video size={48} color="#F43F5E" />
                           <div>
                              <p style={{ color: '#F43F5E', fontWeight: 600, marginBottom: 8 }}>Camera Access Denied</p>
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>The browser or device has blocked camera hardware access.</p>
                           </div>
                           <div style={{ display: 'flex', gap: 12 }}>
                              <button className="btn-ghost" onClick={() => startCamera(sessionId)}>Retry Hardware</button>
                              <button className="btn-primary" onClick={() => startSimulation(sessionId)}>Simulate AI Feed</button>
                           </div>
                        </div>
                      ) : isSimulated ? (
                        <div style={{ width: '100%', height: 360, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                            <div className="scanning-line" style={{ width: '100%', height: '2px', background: 'var(--accent-cyan)', position: 'absolute', top: 0, left: 0, boxShadow: '0 0 15px var(--accent-cyan)', zIndex: 10 }} />
                            
                            <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>MODEL: INSIGHTFACE-R100</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>STATE: SIMULATING_INFRASTRUCTURE</div>
                            </div>

                            <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, maxHeight: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column-reverse', gap: 4 }}>
                                {Object.entries(detectionCounts).filter(([_, count]) => count > 0).slice(-3).map(([id, count]) => {
                                    const s = students.find(st => String(st.id) === String(id));
                                    return (
                                        <div key={id} style={{ fontSize: '0.65rem', color: '#10B981', fontFamily: 'monospace', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 4 }}>
                                            [DETECTED] Student: {s?.name || id} | Count: {count}
                                        </div>
                                    );
                                })}
                            </div>

                            <Users size={64} color="rgba(0, 245, 255, 0.05)" />
                            <p className="font-orbitron" style={{ marginTop: 20, color: 'var(--accent-cyan)', fontSize: '0.8rem', letterSpacing: 4, opacity: 0.8 }}>AI ENGINE SIMULATION ACTIVE</p>
                            
                            <div style={{ position: 'absolute', top: 20, right: 20, textAlign: 'right' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>SRC: {String(activeSource).substring(0, 15)}...</div>
                                <div style={{ fontSize: '0.7rem', color: '#10B981', fontFamily: 'monospace' }}>FPS: 30.0 (STABLE)</div>
                            </div>
                        </div>
                      ) : (
                        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', display: 'block', background: '#000', minHeight: 360 }} />
                      )}
                      <canvas ref={canvasRef} style={{ display: 'none' }} />
                    </GlassCard>

                    <div style={{ marginTop: 16 }}>
                      <button className="btn-danger" onClick={() => setConfirmStop(true)} style={{ width: '100%' }}>
                        <Square size={14} /> STOP SESSION
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
                    <GlassCard>
                      <h3 className="font-orbitron" style={{ fontSize: '0.8rem', marginBottom: 16, color: 'var(--text-muted)' }}>LIVE STATS</h3>
                      <CircularProgress value={attendanceRate} size={120} label="Attendance Rate" />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
                        {[
                          { label: '✅ Present', val: presentCount, c: '#10B981' },
                          { label: '❌ Absent', val: absentCount, c: '#F43F5E' },
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
                      <h3 className="font-orbitron" style={{ fontSize: '0.8rem', marginBottom: 12, color: 'var(--text-muted)' }}>STUDENT DETECTION</h3>
                      {students.map(s => (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <span style={{ fontSize: '0.8rem' }}>{s.name}</span>
                          <StatusBadge variant={getStudentStatus(s.id)} />
                        </div>
                      ))}
                    </GlassCard>
                  </div>
                </div>
              </div>
            )}

            {page === 'studentLookup' && <StudentLookupPage />}

            {page === 'timetable' && (
              <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <CalendarIcon size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                <h2 className="font-orbitron" style={{ fontSize: '1.2rem', opacity: 0.5 }}>Timetable Management</h2>
                <p style={{ color: 'var(--text-muted)' }}>Feature coming soon...</p>
              </div>
            )}

            {page === 'reports' && (
              <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <ChartIcon size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                <h2 className="font-orbitron" style={{ fontSize: '1.2rem', opacity: 0.5 }}>Advanced Reports</h2>
                <p style={{ color: 'var(--text-muted)' }}>Feature coming soon...</p>
              </div>
            )}

            {page === 'lowAttendance' && (
              <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <AlertTriangle size={48} style={{ opacity: 0.2, marginBottom: 16, color: '#F59E0B' }} />
                <h2 className="font-orbitron" style={{ fontSize: '1.2rem', opacity: 0.5 }}>Low Attendance Alerts</h2>
                <p style={{ color: 'var(--text-muted)' }}>Feature coming soon...</p>
              </div>
            )}
          </PageTransition>
        </div>
      </main>

      <ConfirmModal isOpen={confirmStart} icon="🚀" title="Start Session?" message={`Initializing AI engine for ${subjects.find(s => String(s.id) === subjectId)?.name || 'selected subject'}.`} onConfirm={startSession} onCancel={() => setConfirmStart(false)} confirmLabel="Start Session" />
      <ConfirmModal isOpen={confirmStop} icon="⏹️" title="Stop & Finalize?" message={`Finalizing results for ${presentCount} present students.`} onConfirm={stopAndFinalize} onCancel={() => setConfirmStop(false)} confirmLabel="Stop Session" />
    </div>
  );
}
