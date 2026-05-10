import { useEffect, useState } from "react";
import toast from 'react-hot-toast';
import api from '../../api/api';
import GlassCard from '../../components/GlassCard';
import DataTable from '../../components/DataTable';
import DrawerPanel from '../../components/DrawerPanel';
import ConfirmModal from '../../components/ConfirmModal';
import { Users, Plus, Trash2, Pencil, Search, Filter, Mail, Lock, User as UserIcon, Hash, Building2 } from 'lucide-react';

export default function TeacherPage() {
  const [teachers, setTeachers] = useState([]);
  const [users, setUsers] = useState([]); // To map teacher.user_id to user info
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [departmentIds, setDepartmentIds] = useState([]);
  const [teacherCode, setTeacherCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('');

  // Editing state
  const [editId, setEditId] = useState(null);

  // Deletion state
  const [deleteId, setDeleteId] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tRes, dRes] = await Promise.all([
        api.get('/admin/teachers'),
        api.get('/admin/departments'),
      ]);

      setTeachers(tRes.data || []);
      setDepartments(dRes.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      const msg = err.response?.data?.detail || err.message || 'Failed to load teacher data';
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || (!editId && !password.trim()) || departmentIds.length === 0) { 
      toast.error('Please fill all required fields'); return; 
    }
    setSubmitting(true);
    try {
      const payload = { 
        name, 
        email, 
        password: password || undefined,
        department_ids: departmentIds.map(Number),
        teacher_code: teacherCode.trim() || undefined
      };
      
      if (editId) {
        await api.put(`/admin/teachers/${editId}`, payload);
        toast.success('🎉 Teacher updated successfully!');
      } else {
        await api.post('/admin/teachers', payload);
        toast.success('🎉 Teacher added successfully!');
      }
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error saving teacher');
    } finally { setSubmitting(false); }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setDepartmentIds([]);
    setTeacherCode('');
    setEditId(null);
    setDrawerOpen(false);
  };

  const handleEdit = (row) => {
    setEditId(row.id);
    setName(row.user_name || row.name || ''); 
    setEmail(row.user_email || row.email || '');
    setDepartmentIds(row.department_ids || [row.department_id]);
    setTeacherCode(row.teacher_code || '');
    setPassword(''); // Don't show old password
    setDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/teachers/${deleteId}`);
      toast.success('Teacher removed successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete teacher');
    } finally {
      setDeleting(false);
      setIsConfirmOpen(false);
      setDeleteId(null);
    }
  };

  const filteredData = teachers.filter(t => {
    const tName = (t.user_name || t.name || '').toLowerCase();
    const tEmail = (t.user_email || t.email || '').toLowerCase();
    const tCode = (t.teacher_code || '').toLowerCase();
    const matchesSearch = tName.includes(searchQuery.toLowerCase()) || 
                          tEmail.includes(searchQuery.toLowerCase()) ||
                          tCode.includes(searchQuery.toLowerCase());
    const matchesDept = filterDept === '' || (t.department_ids && t.department_ids.includes(Number(filterDept))) || t.department_id === Number(filterDept);
    return matchesSearch && matchesDept;
  });

  const columns = [
    { 
      key: 'teacher_code', 
      label: 'ID / Code',
      render: (row) => (
        <span className="font-mono" style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem' }}>
          {row.teacher_code || `TCH-${row.id}`}
        </span>
      )
    },
    { 
        key: 'name', 
        label: 'Teacher Name',
        render: (row) => row.user_name || row.name || 'Unknown'
    },
    { 
        key: 'email', 
        label: 'Email',
        render: (row) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                <Mail size={12} color="var(--text-muted)" />
                {row.user_email || row.email}
            </div>
        )
    },
    { 
      key: 'department_id', 
      label: 'Departments',
      render: (row) => {
        const deptIds = row.department_ids || [row.department_id];
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {deptIds.map(id => {
              const dept = departments.find(d => d.id === id);
              return dept ? (
                <span key={id} style={{ 
                  color: 'var(--accent-cyan)', 
                  background: 'rgba(0, 245, 255, 0.05)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem'
                }}>
                  {dept.name}
                </span>
              ) : null;
            })}
          </div>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => handleEdit(row)}
            className="btn-icon-edit"
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
              transition: 'all 0.2s'
            }}
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
              transition: 'all 0.2s'
            }}
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
          <h1 className="font-orbitron" style={{ fontSize: '1.3rem' }}>Teachers</h1>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setDrawerOpen(true); }}>
          <Plus size={16} /> Add Teacher
        </button>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            className="input-field" 
            placeholder="Search by name, email or code..." 
            style={{ paddingLeft: 40 }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ position: 'relative', width: 240 }}>
          <Filter size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <select 
            className="input-field" 
            style={{ paddingLeft: 40 }}
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <GlassCard>
        <DataTable columns={columns} data={filteredData} isLoading={loading} emptyMessage="No teachers found matching your criteria." />
      </GlassCard>

      <DrawerPanel isOpen={drawerOpen} onClose={resetForm} title={editId ? "Edit Teacher" : "Add New Teacher"}>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Full Name</label>
          <div style={{ position: 'relative' }}>
            <UserIcon size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input-field" style={{ paddingLeft: 36 }} placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Email Address</label>
          <div style={{ position: 'relative' }}>
            <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input-field" style={{ paddingLeft: 36 }} type="email" placeholder="john@university.edu" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">{editId ? "Change Password (optional)" : "Password"}</label>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input-field" style={{ paddingLeft: 36 }} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Departments (Select Multiple)</label>
          <div style={{ 
            maxHeight: '150px', 
            overflowY: 'auto', 
            background: 'rgba(255,255,255,0.03)', 
            borderRadius: 8, 
            padding: 12,
            border: '1px solid var(--glass-border)'
          }}>
            {departments.map(d => (
              <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={departmentIds.includes(d.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setDepartmentIds([...departmentIds, d.id]);
                    } else {
                      setDepartmentIds(departmentIds.filter(id => id !== d.id));
                    }
                  }}
                  style={{ accentColor: 'var(--accent-cyan)' }}
                />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{d.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 24 }}>
          <label className="form-label">Teacher Code (Optional)</label>
          <div style={{ position: 'relative' }}>
            <Hash size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input-field" style={{ paddingLeft: 36 }} placeholder="e.g. TCH001" value={teacherCode} onChange={e => setTeacherCode(e.target.value)} />
          </div>
        </div>

        <button className="btn-primary" onClick={handleSave} disabled={submitting} style={{ width: '100%' }}>
          {submitting ? 'Processing...' : (editId ? 'Update Teacher' : 'Register Teacher')}
        </button>
      </DrawerPanel>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Remove Teacher"
        message="Are you sure? This will delete the teacher's profile and their login account. This action cannot be undone."
        confirmLabel={deleting ? "Removing..." : "Remove Teacher"}
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
