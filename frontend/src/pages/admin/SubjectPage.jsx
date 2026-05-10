import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/api';
import GlassCard from '../../components/GlassCard';
import DataTable from '../../components/DataTable';
import DrawerPanel from '../../components/DrawerPanel';
import ConfirmModal from '../../components/ConfirmModal';
import { BookOpen, Plus, Trash2, Pencil, Search, Filter, Hash } from 'lucide-react';

export default function SubjectPage() {
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [departmentId, setDepartmentId] = useState('');
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
      const [s, d, c] = await Promise.all([
        api.get('/admin/subjects'),
        api.get('/admin/departments'),
        api.get('/admin/classes'),
      ]);
      setSubjects(s.data || []);
      setDepartments(d.data || []);
      setClasses(c.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to load data. Please check backend.');
    } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!name.trim() || !subjectCode.trim() || !departmentId) { 
      toast.error('Fill all fields'); return; 
    }
    setSubmitting(true);
    try {
      const payload = { 
        name, 
        subject_code: subjectCode.toUpperCase(), 
        department_id: Number(departmentId) 
      };

      if (editId) {
        await api.put(`/admin/subjects/${editId}`, payload);
        toast.success('🎉 Subject updated successfully!');
      } else {
        await api.post('/admin/subjects', payload);
        toast.success('🎉 Subject added successfully!');
      }
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error saving subject');
    } finally { setSubmitting(false); }
  };

  const resetForm = () => {
    setName('');
    setSubjectCode('');
    setDepartmentId('');
    setEditId(null);
    setDrawerOpen(false);
  };

  const handleEdit = (row) => {
    setEditId(row.id);
    setName(row.name);
    setSubjectCode(row.subject_code || '');
    setDepartmentId(row.department_id);
    setDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/subjects/${deleteId}`);
      toast.success('Subject deleted successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete subject');
    } finally {
      setDeleting(false);
      setIsConfirmOpen(false);
      setDeleteId(null);
    }
  };

  const filteredData = subjects.filter(sub => {
    const matchesSearch = 
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.subject_code && sub.subject_code.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDept = filterDept === '' || sub.department_id === Number(filterDept);
    return matchesSearch && matchesDept;
  });

  const columns = [
    { 
      key: 'subject_code', 
      label: 'Code',
      render: (row) => (
        <code style={{ 
          background: 'rgba(255,255,255,0.05)', 
          padding: '2px 6px', 
          borderRadius: 4,
          color: 'var(--accent-cyan)',
          fontSize: '0.8rem',
          fontWeight: 600
        }}>
          {row.subject_code || '---'}
        </code>
      )
    },
    { key: 'name', label: 'Subject Name' },
    { 
      key: 'department_id', 
      label: 'Department',
      render: (row) => {
        const dept = departments.find(d => d.id === row.department_id);
        return dept ? (
          <span style={{ 
            color: 'var(--accent-cyan)', 
            background: 'rgba(0, 245, 255, 0.05)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.8rem'
          }}>
            {dept.name}
          </span>
        ) : <span style={{ color: 'var(--text-muted)' }}>N/A</span>;
      }
    },
    {
      key: 'classes',
      label: 'Target Classes',
      render: (row) => {
        const targetClasses = classes.filter(c => c.department_id === row.department_id);
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {targetClasses.slice(0, 2).map(c => (
              <span key={c.id} style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                • {c.name}
              </span>
            ))}
            {targetClasses.length > 2 && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>+{targetClasses.length - 2} more</span>}
            {targetClasses.length === 0 && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No classes</span>}
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
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 245, 255, 0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0, 245, 255, 0.1)'}
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
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 71, 87, 0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 71, 87, 0.1)'}
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
          <BookOpen size={24} color="var(--accent-cyan)" />
          <h1 className="font-orbitron" style={{ fontSize: '1.3rem' }}>Subjects</h1>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setDrawerOpen(true); }}>
          <Plus size={16} /> Add New
        </button>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            className="input-field" 
            placeholder="Search by name or code..." 
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
        <DataTable columns={columns} data={filteredData} isLoading={loading} emptyMessage="No subjects found." />
      </GlassCard>

      <DrawerPanel isOpen={drawerOpen} onClose={resetForm} title={editId ? "Edit Subject" : "Add Subject"}>
        <div className="form-group">
          <label className="form-label">Subject Name</label>
          <input className="input-field" placeholder="e.g. Machine Learning" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Subject Code</label>
          <div style={{ position: 'relative' }}>
            <Hash size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              className="input-field" 
              placeholder="e.g. CS301" 
              style={{ paddingLeft: 36, textTransform: 'uppercase' }} 
              value={subjectCode} 
              onChange={e => setSubjectCode(e.target.value)} 
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Department</label>
          <select className="input-field" value={departmentId} onChange={e => setDepartmentId(e.target.value)}>
            <option value="">Select Department</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        {departmentId && (
          <div style={{ marginTop: 12, padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>Associated Classes:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {classes.filter(c => c.department_id === Number(departmentId)).map(c => (
                <span key={c.id} style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', background: 'rgba(0,245,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <button className="btn-primary" onClick={handleSave} disabled={submitting} style={{ width: '100%', marginTop: 24 }}>
          {submitting ? (editId ? 'Updating...' : 'Adding...') : (editId ? 'Update Subject' : 'Add Subject')}
        </button>
      </DrawerPanel>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Delete Subject"
        message="Are you sure you want to delete this subject? This will also disassociate it from any attendance records."
        confirmLabel={deleting ? "Deleting..." : "Delete"}
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