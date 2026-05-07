import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000";

export default function StudentPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    roll_no: "",
    registration_no: "",
    department_id: "",
    class_id: "",
    section: "",
    batch: "",
    phone: "",
    parent_phone: "",
  });

  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchDepartments();
    fetchClasses();
    fetchStudents();
  }, []);

  const fetchDepartments = async () => {
    const res = await axios.get(`${API}/admin/departments`);
    setDepartments(res.data || []);
  };

  const fetchClasses = async () => {
    const res = await axios.get(`${API}/admin/classes`);
    setClasses(res.data || []);
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API}/admin/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(res.data || []);
    } catch {
      console.log("Failed to load students");
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addStudent = async () => {
    if (!form.name || !form.email || !form.roll_no || !form.class_id) {
      alert("Name, Email, Roll No and Class are required");
      return;
    }

    try {
      await axios.post(
        `${API}/admin/students`,
        {
          ...form,
          class_id: Number(form.class_id),
          department_id: Number(form.department_id),
          password: "123456",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Student added successfully. Default password: 123456");

      setForm({
        name: "",
        email: "",
        roll_no: "",
        registration_no: "",
        department_id: "",
        class_id: "",
        section: "",
        batch: "",
        phone: "",
        parent_phone: "",
      });

      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.detail || "Error adding student");
    }
  };

  const filteredStudents = students.filter((s) =>
    `${s.name || ""} ${s.email || ""} ${s.roll_no || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 20 }}>
      <h2>Student Management</h2>

      <div style={{ background: "white", padding: 20, borderRadius: 12 }}>
        <h3>Add New Student</h3>

        <input name="name" placeholder="Student Name *" value={form.name} onChange={handleChange} />
        <br /><br />

        <input name="email" placeholder="Email *" value={form.email} onChange={handleChange} />
        <br /><br />

        <input name="roll_no" placeholder="Roll No *" value={form.roll_no} onChange={handleChange} />
        <br /><br />

        <input name="registration_no" placeholder="Registration No" value={form.registration_no} onChange={handleChange} />
        <br /><br />

        <select name="department_id" value={form.department_id} onChange={handleChange}>
          <option value="">Select Department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <br /><br />

        <select name="class_id" value={form.class_id} onChange={handleChange}>
          <option value="">Select Class *</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <br /><br />

        <input name="section" placeholder="Section e.g. A" value={form.section} onChange={handleChange} />
        <br /><br />

        <input name="batch" placeholder="Batch e.g. 2024-2026" value={form.batch} onChange={handleChange} />
        <br /><br />

        <input name="phone" placeholder="Student Phone" value={form.phone} onChange={handleChange} />
        <br /><br />

        <input name="parent_phone" placeholder="Parent Phone" value={form.parent_phone} onChange={handleChange} />
        <br /><br />

        <p>Default Password: <b>123456</b></p>

        <button onClick={addStudent}>Add Student</button>
      </div>

      <br />

      <div style={{ background: "white", padding: 20, borderRadius: 12 }}>
        <h3>Student List</h3>

        <input
          placeholder="Search by name, email, roll no"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <br /><br />

        {filteredStudents.length === 0 ? (
          <p>No students found</p>
        ) : (
          filteredStudents.map((s, i) => (
            <div key={i} style={{ padding: 10, borderBottom: "1px solid #ddd" }}>
              <b>{s.name}</b> | {s.roll_no} | {s.email}
              <br />
              Face Status: {s.face_enrolled ? "Uploaded ✅" : "Not Uploaded ❌"}
            </div>
          ))
        )}
      </div>
    </div>
  );
}