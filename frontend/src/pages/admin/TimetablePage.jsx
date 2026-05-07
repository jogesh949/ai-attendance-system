import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/api';
import GlassCard from '../../components/GlassCard';
import DrawerPanel from '../../components/DrawerPanel';
import { Calendar, Trash2 } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const HOURS = Array.from({ length: 10 }, (_, i) => `${String(8 + i).padStart(2, '0')}:00`);

export default function TimetablePage() {
  const [slots, setSlots] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [formClass, setFormClass] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formRoom, setFormRoom] = useState('');
  const [formTeacher, setFormTeacher] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('timetable_slots');
    if (saved) setSlots(JSON.parse(saved));
    Promise.all([
      api.get('/admin/classes'), api.get('/admin/subjects'),
      api.get('/admin/classrooms'), api.get('/admin/teachers'),
    ]).then(([c, s, r, t]) => {
      setClasses(c.data || []); setSubjects(s.data || []);
      setClassrooms(r.data || []); setTeachers(t.data || []);
    }).catch(() => {});
  }, []);

  const getSlot = (day, hour) => slots.find(s => s.day === day && s.hour === hour);

  const openAdd = (day, hour) => {
    if (getSlot(day, hour)) return;
    setSelectedCell({ day, hour });
    setFormClass(''); setFormSubject(''); setFormRoom(''); setFormTeacher('');
    setDrawerOpen(true);
  };

  const saveSlot = () => {
    if (!formClass || !formSubject) { toast.error('Select class and subject'); return; }
    const newSlot = { day: selectedCell.day, hour: selectedCell.hour, classId: formClass, subjectId: formSubject, roomId: formRoom, teacherCode: formTeacher };
    const updated = [...slots, newSlot];
    setSlots(updated);
    localStorage.setItem('timetable_slots', JSON.stringify(updated));
    toast.success('📅 Timetable slot saved!');
    setDrawerOpen(false);
  };

  const clearAll = () => {
    setSlots([]);
    localStorage.removeItem('timetable_slots');
    toast.success('Timetable cleared');
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Calendar size={24} color="var(--accent-cyan)" />
          <h1 className="font-orbitron" style={{ fontSize: '1.3rem' }}>Timetable</h1>
        </div>
        <button className="btn-danger" onClick={clearAll}><Trash2 size={14} /> Clear All</button>
      </div>

      <GlassCard style={{ overflowX: 'auto', padding: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr>
              <th style={{ padding: 10, fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'left' }}>Time</th>
              {DAYS.map(d => (
                <th key={d} style={{ padding: 10, fontSize: '0.75rem', color: 'var(--accent-cyan)', textAlign: 'center', fontWeight: 700 }}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map(hour => (
              <tr key={hour}>
                <td className="font-mono" style={{ padding: '8px 10px', fontSize: '0.8rem', color: 'var(--text-muted)', borderRight: '1px solid var(--glass-border)' }}>{hour}</td>
                {DAYS.map(day => {
                  const slot = getSlot(day, hour);
                  return (
                    <td key={day} onClick={() => openAdd(day, hour)} style={{
                      padding: 6, textAlign: 'center', cursor: slot ? 'default' : 'pointer', border: '1px solid rgba(255,255,255,0.04)',
                      background: slot ? 'rgba(0,245,255,0.05)' : 'transparent',
                      transition: 'background 0.2s',
                    }}>
                      {slot ? (
                        <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', lineHeight: 1.4 }}>
                          <div style={{ fontWeight: 600 }}>{classes.find(c => String(c.id) === String(slot.classId))?.name || slot.classId}</div>
                          <div style={{ color: 'var(--text-muted)' }}>{subjects.find(s => String(s.id) === String(slot.subjectId))?.name || slot.subjectId}</div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.1)' }}>+</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      <DrawerPanel isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={`Add Slot — ${selectedCell?.day} ${selectedCell?.hour}`}>
        <div className="form-group">
          <label className="form-label">Class</label>
          <select className="input-field" value={formClass} onChange={e => setFormClass(e.target.value)}>
            <option value="">Select Class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Subject</label>
          <select className="input-field" value={formSubject} onChange={e => setFormSubject(e.target.value)}>
            <option value="">Select Subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Classroom</label>
          <select className="input-field" value={formRoom} onChange={e => setFormRoom(e.target.value)}>
            <option value="">Select Room</option>
            {classrooms.map(r => <option key={r.id} value={r.id}>{r.room_name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Teacher</label>
          <select className="input-field" value={formTeacher} onChange={e => setFormTeacher(e.target.value)}>
            <option value="">Select Teacher</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.teacher_code}</option>)}
          </select>
        </div>
        <button className="btn-primary" onClick={saveSlot} style={{ width: '100%', marginTop: 16 }}>Save Slot</button>
      </DrawerPanel>
    </div>
  );
}
