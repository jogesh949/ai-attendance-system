import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/api';
import GlassCard from '../../components/GlassCard';
import DataTable from '../../components/DataTable';
import DrawerPanel from '../../components/DrawerPanel';
import ConfirmModal from '../../components/ConfirmModal';
import CircularProgress from '../../components/CircularProgress';
import { 
  Users, Plus, Search, Pencil, Trash2, Filter, 
  Mail, Lock, User as UserIcon, Hash, Building2, 
  CheckCircle, XCircle, GraduationCap, Eye
} from 'lucide-react';

export default function StudentPage() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Details state
  const [viewStudent, setViewStudent] = useState(null);
  const [viewStats, setViewStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterClass, setFilterClass] = useState('');

  // Form state
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', roll_no: '', registration_no: '',
    department_id: '', class_id: '', section: '', batch: '',
    phone: '', parent_phone: '', password: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Deletion state
  const [deleteId, setDeleteId] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [s, d, c] = await Promise.all([
        api.get('/admin/students'),
        api.get('/admin/departments'),
        api.get('/admin/classes'),
      ]);
      setStudents(s.data || []);
      setDepartments(d.data || []);
      setClasses(c.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to load student data');
    } finally { setLoading(false); }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!form.name || !form.email || !form.roll_no || !form.class_id) {
      toast.error('Required fields: Name, Email, Roll No, Class');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password || (editId ? undefined : '123456'),
        roll_no: form.roll_no,
        class_id: Number(form.class_id),
      };

      if (editId) {
        await api.put(`/admin/students/${editId}`, payload);
        toast.success('🎉 Student details updated!');
      } else {
        await api.post('/admin/students', payload);
        toast.success(`🎉 ${form.name} enrolled!`);
      }
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error saving student');
    } finally { setSubmitting(false); }
  };

  const resetForm = () => {
    setForm({ 
      name: '', email: '', roll_no: '', registration_no: '', 
      department_id: '', class_id: '', section: '', batch: '', 
      phone: '', parent_phone: '', password: '' 
    });
    setEditId(null);
    setDrawerOpen(false);
  };

  const handleEdit = (student) => {
    setEditId(student.id);
    const studentClass = classes.find(c => c.id === student.class_id);
    setForm({
      name: student.name,
      email: student.email,
      roll_no: student.roll_no,
      registration_no: student.registration_no || '',
      department_id: studentClass?.department_id || '',
      class_id: student.class_id,
      section: student.section || '',
      batch: student.batch || '',
      phone: student.phone || '',
      parent_phone: student.parent_phone || '',
      password: ''
    });
    setDrawerOpen(true);
  };

  const handleViewDetails = async (student) => {
    setViewStudent(student);
    setDetailsOpen(true);
    setLoadingStats(true);
    try {
      const res = await api.get(`/admin/students/${student.id}/attendance-stats`);
      setViewStats(res.data);
    } catch (err) {
      console.error('Stats error:', err);
      toast.error('Failed to load attendance analytics');
    } finally {
      setLoadingStats(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/students/${deleteId}`);
      toast.success('Student record removed');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete student');
    } finally {
      setDeleting(false);
      setIsConfirmOpen(false);
      setDeleteId(null);
    }
  };

  const filtered = students.filter(s => {
    const matchesSearch = `${s.name} ${s.roll_no} ${s.email}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = filterClass === '' || s.class_id === Number(filterClass);

    let matchesDept = true;
    if (filterDept !== '') {
      const targetClassIds = classes.filter(c => c.department_id === Number(filterDept)).map(c => c.id);
      matchesDept = targetClassIds.includes(s.class_id);
    }

    return matchesSearch && matchesClass && matchesDept;
  });

  const columns = [
    { 
      key: 'roll_no', 
      label: 'Roll No',
      render: (row) => <code style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{row.roll_no}</code>
    },
    { 
      key: 'name', 
      label: 'Student Name',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{row.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.email}</div>
        </div>
      )
    },
    { 
      key: 'class_name', 
      label: 'Class / Dept',
      render: (row) => (
        <div>
          <div style={{ color: 'var(--text-secondary)' }}>{row.class_name || 'N/A'}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', background: 'rgba(0,245,255,0.05)', padding: '1px 6px', borderRadius: 4, display: 'inline-block' }}>
            {row.department_name || 'N/A'}
          </div>
        </div>
      )
    },
    {
      key: 'face_status',
      label: 'Face Data',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: row.face_registered ? '#10B981' : '#F43F5E' }}>
          {row.face_registered ? <CheckCircle size={14} /> : <XCircle size={14} />}
          {row.face_registered ? 'Registered' : 'Missing'}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => handleViewDetails(row)}
            style={{
              background: 'rgba(0, 245, 255, 0.1)',
              border: 'none',
              padding: '6px',
              borderRadius: '6px',
              color: 'var(--accent-cyan)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => handleEdit(row)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              padding: '6px',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Edit Record"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => {
              setDeleteId(row.id);
              setIsConfirmOpen(true);
            }}
            style={{
              background: 'rgba(255, 71, 87, 0.1)',
              border: 'none',
              padding: '6px',
              borderRadius: '6px',
              color: '#ff4757',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Delete Record"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Users size={24} color="var(--accent-cyan)" />
          <h1 className="font-orbitron" style={{ fontSize: '1.3rem' }}>Student Directory</h1>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setDrawerOpen(true); }}>
          <Plus size={16} /> Enroll Student
        </button>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
        {[
          { label: 'Total Students', value: students.length, color: 'var(--accent-cyan)' },
          { label: 'Face Registered', value: students.filter(s => s.face_registered).length, color: '#10B981' },
          { label: 'Pending Faces', value: students.filter(s => !s.face_registered).length, color: '#F43F5E' },
        ].map(stat => (
          <GlassCard key={stat.label} style={{ flex: 1, padding: '16px 20px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </GlassCard>
        ))}
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            className="input-field" 
            placeholder="Search by name, roll no or email..." 
            style={{ paddingLeft: 40 }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <select 
          className="input-field" 
          style={{ width: 200 }}
          value={filterDept}
          onChange={e => { setFilterDept(e.target.value); setFilterClass(''); }}
        >
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        <select 
          className="input-field" 
          style={{ width: 200 }}
          value={filterClass}
          onChange={e => setFilterClass(e.target.value)}
        >
          <option value="">All Classes</option>
          {classes
            .filter(c => filterDept === '' || c.department_id === Number(filterDept))
            .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <GlassCard>
        <DataTable columns={columns} data={filtered} isLoading={loading} emptyMessage="No students found matching your search." />
      </GlassCard>

      {/* Student Details Drawer */}
      <DrawerPanel 
        isOpen={detailsOpen} 
        onClose={() => { setDetailsOpen(false); setViewStudent(null); setViewStats(null); }} 
        title="Student Analytics"
        width={450}
      >
        {viewStudent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Header Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#000' }}>
                {viewStudent.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-orbitron" style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 2 }}>{viewStudent.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{viewStudent.roll_no} • {viewStudent.class_name}</p>
              </div>
            </div>

            {/* Attendance Overview */}
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 16 }}>Attendance Score</h4>
              {loadingStats ? (
                <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 40, height: 40, border: '3px solid rgba(0,245,255,0.1)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                </div>
              ) : viewStats ? (
                <CircularProgress value={viewStats.overall} label="Overall Attendance" />
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>No data available</p>
              )}
            </div>

            {/* Subject-wise Breakdown */}
            <div>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Subject-wise Analytics</h4>
              {loadingStats ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[1, 2, 3].map(i => <div key={i} style={{ height: 40, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }} />)}
                </div>
              ) : viewStats?.subjects?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {viewStats.subjects.map((sub, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{sub.subject_name}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: sub.percentage >= 75 ? '#10B981' : '#F43F5E' }}>{sub.percentage}%</span>
                      </div>
                      <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${sub.percentage}%`, 
                          height: '100%', 
                          background: sub.percentage >= 75 ? '#10B981' : (sub.percentage >= 50 ? '#F59E0B' : '#F43F5E'),
                          transition: 'width 1s ease'
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                         <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sub.subject_code}</span>
                         <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sub.attended_classes}/{sub.total_classes} Classes</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: '0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                  No sessions recorded for this student yet.
                </div>
              )}
            </div>

            {/* Quick Profile Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>EMAIL</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{viewStudent.email}</div>
              </div>
              <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>DEPARTMENT</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{viewStudent.department_name}</div>
              </div>
            </div>
          </div>
        )}
      </DrawerPanel>

      <DrawerPanel isOpen={drawerOpen} onClose={resetForm} title={editId ? "Update Student" : "Enroll New Student"}>
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <div style={{ position: 'relative' }}>
            <UserIcon size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input-field" style={{ paddingLeft: 36 }} name="name" placeholder="John Doe" value={form.name} onChange={handleChange} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email Address *</label>
          <div style={{ position: 'relative' }}>
            <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input-field" style={{ paddingLeft: 36 }} name="email" type="email" placeholder="student@university.edu" value={form.email} onChange={handleChange} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">{editId ? "Change Password (optional)" : "Password"}</label>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input-field" style={{ paddingLeft: 36 }} name="password" type="password" placeholder={editId ? "Leave empty to keep current" : "••••••••"} value={form.password} onChange={handleChange} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Roll Number *</label>
            <div style={{ position: 'relative' }}>
              <Hash size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="input-field" style={{ paddingLeft: 36 }} name="roll_no" placeholder="e.g. 21MCA01" value={form.roll_no} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Select Class *</label>
            <div style={{ position: 'relative' }}>
              <GraduationCap size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <select className="input-field" style={{ paddingLeft: 36 }} name="class_id" value={form.class_id} onChange={handleChange}>
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, marginBottom: 20 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Optional Information</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input className="input-field" name="section" placeholder="Section (A/B)" value={form.section} onChange={handleChange} />
            <input className="input-field" name="batch" placeholder="Batch (2024-26)" value={form.batch} onChange={handleChange} />
          </div>
        </div>

        {!editId && (
          <div style={{ padding: '10px 14px', background: 'rgba(0,245,255,0.05)', borderRadius: 8, border: '1px solid var(--glass-border)', marginBottom: 16, fontSize: '0.8rem' }}>
            💡 Students will be notified to upload their face data after their first login.
          </div>
        )}

        <button className="btn-primary" onClick={handleSave} disabled={submitting} style={{ width: '100%' }}>
          {submitting ? 'Processing...' : (editId ? 'Update Record' : 'Register Student')}
        </button>
      </DrawerPanel>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Remove Student"
        message="Are you sure? This will delete the student's profile, their face data, and all their attendance history. This action is irreversible."
        confirmLabel={deleting ? "Removing..." : "Remove Student"}
        onConfirm={handleDelete}
        onCancel={() => {
          setIsConfirmOpen(false);
          setDeleteId(null);
        }}
        icon={<Trash2 color="#ff4757" size={40} />}
      />
    </div>
  );
}
