import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, User, Mail, Hash, Book, Building2, BarChart3, ChevronRight } from 'lucide-react';
import api from '../../api/api';
import GlassCard from '../../components/GlassCard';
import StatusBadge from '../../components/StatusBadge';
import CircularProgress from '../../components/CircularProgress';

export default function StudentLookupPage() {
  const [search, setSearch] = useState('');
  const [allStudents, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/students');
      setAllStudents(res.data || []);
      setLoading(false);
    } catch (err) {
      toast.error('Failed to load students');
      setLoading(false);
    }
  };

  const handleSearch = (val) => {
    setSearch(val);
    if (!val.trim()) {
      setFilteredStudents([]);
      return;
    }
    const filtered = allStudents.filter(s => 
      s.name?.toLowerCase().includes(val.toLowerCase()) || 
      s.roll_no?.toLowerCase().includes(val.toLowerCase())
    );
    setFilteredStudents(filtered.slice(0, 5)); // Show top 5 matches
  };

  const selectStudent = async (student) => {
    setSelectedStudent(student);
    setFilteredStudents([]);
    setSearch('');
    
    try {
      setStatsLoading(true);
      const res = await api.get(`/admin/students/${student.id}/attendance-stats`);
      setStats(res.data);
      setStatsLoading(false);
    } catch (err) {
      toast.error('Failed to load attendance stats');
      setStatsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h1 className="font-orbitron" style={{ fontSize: '1.5rem' }}>Student Lookup</h1>
      </div>

      <div style={{ position: 'relative', marginBottom: 32 }}>
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
          <input
            type="text"
            className="input-field"
            placeholder="Search by student name or roll number..."
            style={{ paddingLeft: 48, height: 56, fontSize: '1rem' }}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {filteredStudents.length > 0 && (
          <GlassCard style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
            marginTop: 8, padding: 8, border: '1px solid var(--glass-border)'
          }}>
            {filteredStudents.map(s => (
              <div
                key={s.id}
                onClick={() => selectStudent(s)}
                style={{
                  padding: '12px 16px', borderRadius: 8, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'background 0.2s'
                }}
                className="hover-bg"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0, 245, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={16} color="var(--accent-cyan)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Roll: {s.roll_no} | {s.class_name}</div>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </div>
            ))}
          </GlassCard>
        )}
      </div>

      {selectedStudent ? (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
          {/* Profile Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <GlassCard style={{ textAlign: 'center', padding: '32px 24px' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-cyan), #3B82F6)',
                margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 20px rgba(0, 245, 255, 0.3)'
              }}>
                <span style={{ fontSize: '2rem', fontWeight: 700, color: 'white' }}>{selectedStudent.name?.charAt(0)}</span>
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 4 }}>{selectedStudent.name}</h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>Roll No: {selectedStudent.roll_no}</div>
              <StatusBadge variant={selectedStudent.face_registered ? "online" : "absent"} text={selectedStudent.face_registered ? "Face Registered" : "Face Not Registered"} />
            </GlassCard>

            <GlassCard>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Mail size={16} color="var(--accent-cyan)" />
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Email</div>
                    <div style={{ fontSize: '0.85rem' }}>{selectedStudent.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Building2 size={16} color="var(--accent-cyan)" />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Department</div>
                    <div style={{ fontSize: '0.85rem' }}>{selectedStudent.department_name}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Book size={16} color="var(--accent-cyan)" />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Class</div>
                    <div style={{ fontSize: '0.85rem' }}>{selectedStudent.class_name}</div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Attendance Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <GlassCard>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h3 className="font-orbitron" style={{ fontSize: '1rem' }}>Attendance Performance</h3>
                <BarChart3 size={20} color="var(--accent-cyan)" />
              </div>

              {statsLoading ? (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="loader">Loading stats...</div>
                </div>
              ) : stats ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 40, alignItems: 'center', marginBottom: 32 }}>
                    <div style={{ textAlign: 'center' }}>
                      <CircularProgress value={stats.overall} size={160} strokeWidth={12} label="Overall Attendance" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                       <div style={{ padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Classes Attended</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{Math.round((stats.overall / 100) * (stats.subjects?.length * 10 || 50))}</div>
                       </div>
                       <div style={{ padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Status</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: stats.overall > 75 ? '#10B981' : '#EF4444' }}>
                            {stats.overall > 75 ? 'Excellent' : stats.overall > 60 ? 'Good' : 'Critical'}
                          </div>
                       </div>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '0.9rem', marginBottom: 16, color: 'var(--text-muted)' }}>Subject-wise Breakdown</h4>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {stats.subjects?.map((sub, i) => (
                      <div key={i} style={{ padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{sub.name}</span>
                          <span style={{ color: sub.percentage > 75 ? '#10B981' : '#F59E0B', fontWeight: 700 }}>{sub.percentage}%</span>
                        </div>
                        <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${sub.percentage}%` }}
                            style={{ height: '100%', background: sub.percentage > 75 ? '#10B981' : '#F59E0B' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  No attendance data available for this student.
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '100px 0', opacity: 0.5 }}>
          <Search size={48} style={{ marginBottom: 16 }} />
          <p>Search and select a student to view their details</p>
        </div>
      )}
      
      <style>{`
        .hover-bg:hover {
          background: rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </div>
  );
}
