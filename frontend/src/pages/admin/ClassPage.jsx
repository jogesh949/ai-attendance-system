import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/api';
import GlassCard from '../../components/GlassCard';
import DataTable from '../../components/DataTable';
import DrawerPanel from '../../components/DrawerPanel';
import ConfirmModal from '../../components/ConfirmModal';
import { GraduationCap, Plus, Trash2, Pencil, Search, Filter } from 'lucide-react';

export default function ClassPage() {
  const [classes, setClasses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [name, setName] = useState('');
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
      const [c, d] = await Promise.all([
        api.get('/admin/classes'),
        api.get('/admin/departments'),
      ]);
      setClasses(c.data || []);
      setDepartments(d.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!name.trim() || !departmentId) { toast.error('Fill all fields'); return; }
    setSubmitting(true);
    try {
      if (editId) {
        await api.put(`/admin/classes/${editId}`, { name, department_id: Number(departmentId) });
        toast.success('🎉 Class updated successfully!');
      } else {
        await api.post('/admin/classes', { name, department_id: Number(departmentId) });
        toast.success('🎉 Class added successfully!');
      }
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error saving class');
    } finally { setSubmitting(false); }
  };

  const resetForm = () => {
    setName('');
    setDepartmentId('');
    setEditId(null);
    setDrawerOpen(false);
  };

  const handleEdit = (row) => {
    setEditId(row.id);
    setName(row.name);
    setDepartmentId(row.department_id);
    setDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/classes/${deleteId}`);
      toast.success('Class deleted successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete class');
    } finally {
      setDeleting(false);
      setIsConfirmOpen(false);
      setDeleteId(null);
    }
  };

  const filteredData = classes.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDept === '' || cls.department_id === Number(filterDept);
    return matchesSearch && matchesDept;
  });

  const columns = [
    { key: 'id', label: '#' },
    { key: 'name', label: 'Class Name' },
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
          <GraduationCap size={24} color="var(--accent-cyan)" />
          <h1 className="font-orbitron" style={{ fontSize: '1.3rem' }}>Classes</h1>
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
            placeholder="Search classes..." 
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
        <DataTable columns={columns} data={filteredData} isLoading={loading} emptyMessage="No classes found." />
      </GlassCard>

      <DrawerPanel isOpen={drawerOpen} onClose={resetForm} title={editId ? "Edit Class" : "Add Class"}>
        <div className="form-group">
          <label className="form-label">Class Name</label>
          <input className="input-field" placeholder="e.g. MCA 1st Year" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Department</label>
          <select className="input-field" value={departmentId} onChange={e => setDepartmentId(e.target.value)}>
            <option value="">Select Department</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <button className="btn-primary" onClick={handleSave} disabled={submitting} style={{ width: '100%', marginTop: 16 }}>
          {submitting ? (editId ? 'Updating...' : 'Adding...') : (editId ? 'Update Class' : 'Add Class')}
        </button>
      </DrawerPanel>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Delete Class"
        message="Are you sure you want to delete this class? This will disassociate all students from this class."
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
