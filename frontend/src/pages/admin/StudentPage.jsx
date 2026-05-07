import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/api';
import GlassCard from '../../components/GlassCard';
import DataTable from '../../components/DataTable';
import DrawerPanel from '../../components/DrawerPanel';
import { Users, Plus, Search } from 'lucide-react';

export default function StudentPage() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', roll_no: '', registration_no: '',
    department_id: '', class_id: '', section: '', batch: '',
    phone: '', parent_phone: '',
  });

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
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addStudent = async () => {
    if (!form.name || !form.email || !form.roll_no || !form.class_id) {
      toast.error('Name, Email, Roll No and Class are required');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/admin/students', {
        name: form.name,
        email: form.email,
        password: '123456',
        roll_no: form.roll_no,
        class_id: Number(form.class_id),
      });
      toast.success(`🎉 ${form.name} enrolled as a Student!`);
      setForm({ name: '', email: '', roll_no: '', registration_no: '', department_id: '', class_id: '', section: '', batch: '', phone: '', parent_phone: '' });
      setDrawerOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error adding student');
    } finally { setSubmitting(false); }
  };

  const filtered = students.filter(s =>
    `${s.user_id || ''} ${s.roll_no || ''} ${s.class_id || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: 'id', label: '#' },
    { key: 'user_id', label: 'User ID' },
    { key: 'roll_no', label: 'Roll No' },
    { key: 'class_id', label: 'Class ID' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Users size={24} color="var(--accent-cyan)" />
          <h1 className="font-orbitron" style={{ fontSize: '1.3rem' }}>Students</h1>
        </div>
        <button className="btn-primary" onClick={() => setDrawerOpen(true)}>
          <Plus size={16} /> Add Student
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16, maxWidth: 400 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input className="input-field" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 40 }} />
      </div>

      <GlassCard>
        <DataTable columns={columns} data={filtered} isLoading={loading} emptyMessage="No students found." />
      </GlassCard>

      <DrawerPanel isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add New Student">
        {[
          { name: 'name', label: 'Student Name *', ph: 'Full name' },
          { name: 'email', label: 'Email *', ph: 'student@email.com' },
          { name: 'roll_no', label: 'Roll No *', ph: 'e.g. 101' },
          { name: 'registration_no', label: 'Registration No', ph: 'Optional' },
        ].map(f => (
          <div className="form-group" key={f.name}>
            <label className="form-label">{f.label}</label>
            <input className="input-field" name={f.name} placeholder={f.ph} value={form[f.name]} onChange={handleChange} />
          </div>
        ))}

        <div className="form-group">
          <label className="form-label">Department</label>
          <select className="input-field" name="department_id" value={form.department_id} onChange={handleChange}>
            <option value="">Select Department</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Class *</label>
          <select className="input-field" name="class_id" value={form.class_id} onChange={handleChange}>
            <option value="">Select Class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {[
          { name: 'section', label: 'Section', ph: 'e.g. A' },
          { name: 'batch', label: 'Batch', ph: 'e.g. 2024-2026' },
          { name: 'phone', label: 'Student Phone', ph: 'Optional' },
          { name: 'parent_phone', label: 'Parent Phone', ph: 'Optional' },
        ].map(f => (
          <div className="form-group" key={f.name}>
            <label className="form-label">{f.label}</label>
            <input className="input-field" name={f.name} placeholder={f.ph} value={form[f.name]} onChange={handleChange} />
          </div>
        ))}

        <div style={{ padding: '10px 14px', background: 'rgba(0,245,255,0.05)', borderRadius: 8, border: '1px solid var(--glass-border)', marginBottom: 16, fontSize: '0.8rem' }}>
          🔑 Default Password: <strong style={{ color: 'var(--accent-cyan)' }}>123456</strong>
        </div>

        <button className="btn-primary" onClick={addStudent} disabled={submitting} style={{ width: '100%' }}>
          {submitting ? 'Adding...' : 'Add Student'}
        </button>
      </DrawerPanel>
    </div>
  );
}