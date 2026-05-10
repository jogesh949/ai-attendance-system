import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/api';
import GlassCard from '../../components/GlassCard';
import DataTable from '../../components/DataTable';
import DrawerPanel from '../../components/DrawerPanel';
import ConfirmModal from '../../components/ConfirmModal';
import { Building2, Plus, Trash2 } from 'lucide-react';

export default function DepartmentPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Deletion state
  const [deleteId, setDeleteId] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchDepartments(); }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/departments');
      setDepartments(res.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const addDepartment = async () => {
    if (!name.trim()) { toast.error('Enter department name'); return; }
    setSubmitting(true);
    try {
      await api.post('/admin/departments', { name });
      toast.success('🎉 Department added successfully!');
      setName('');
      setDrawerOpen(false);
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error adding department');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/departments/${deleteId}`);
      toast.success('Department deleted successfully');
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete department');
    } finally {
      setDeleting(false);
      setIsConfirmOpen(false);
      setDeleteId(null);
    }
  };

  const columns = [
    { key: 'id', label: '#' },
    { key: 'name', label: 'Department Name' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
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
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Building2 size={24} color="var(--accent-cyan)" />
          <h1 className="font-orbitron" style={{ fontSize: '1.3rem' }}>Departments</h1>
        </div>
        <button className="btn-primary" onClick={() => setDrawerOpen(true)}>
          <Plus size={16} /> Add New
        </button>
      </div>

      <GlassCard>
        <DataTable columns={columns} data={departments} isLoading={loading} emptyMessage="No departments yet. Add your first department!" />
      </GlassCard>

      <DrawerPanel isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add Department">
        <div className="form-group">
          <label className="form-label">Department Name</label>
          <input className="input-field" placeholder="e.g. Computer Science" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={addDepartment} disabled={submitting} style={{ width: '100%', marginTop: 16 }}>
          {submitting ? 'Adding...' : 'Add Department'}
        </button>
      </DrawerPanel>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Delete Department"
        message="Are you sure you want to delete this department? This action cannot be undone."
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