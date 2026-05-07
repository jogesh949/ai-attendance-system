import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000";

export default function DepartmentPage() {
  const [name, setName] = useState("");
  const [departments, setDepartments] = useState([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API}/admin/departments`);
      setDepartments(res.data || []);
    } catch (err) {
      console.log("Fetch department error:", err);
    }
  };

  const addDepartment = async () => {
    if (!name) {
      alert("Enter department name");
      return;
    }

    if (!token) {
      alert("Admin token missing. Please login again.");
      window.location.href = "/login";
      return;
    }

    try {
      const res = await axios.post(
        `${API}/admin/departments`,
        { name },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDepartments([...departments, res.data]);
      setName("");
      alert("Department added successfully");
    } catch (err) {
      console.log("Add department error:", err);
      alert(err.response?.data?.detail || "Error adding department");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Add Department</h2>

      <input
        placeholder="Enter department name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button onClick={addDepartment}>Add</button>

      <h3>Departments List</h3>

      {departments.map((d) => (
        <div key={d.id}>{d.name}</div>
      ))}
    </div>
  );
}