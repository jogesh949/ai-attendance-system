import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000";

export default function ClassroomPage() {
  const [roomName, setRoomName] = useState("");
  const [location, setLocation] = useState("");
  const [classrooms, setClassrooms] = useState([]);

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const res = await axios.get(`${API}/admin/classrooms`);
      setClassrooms(res.data);
    } catch {
      alert("Failed to load classrooms");
    }
  };

  const addClassroom = async () => {
    if (!roomName || !location) {
      alert("Fill all fields");
      return;
    }

    try {
      const res = await axios.post(`${API}/admin/classrooms`, {
        room_name: roomName,
        location: location,
      });

      setClassrooms([...classrooms, res.data]);
      setRoomName("");
      setLocation("");
      alert("Classroom added");
    } catch {
      alert("Error adding classroom");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Add Classroom</h2>

      <input
        placeholder="Room Name (e.g. Room 101)"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Location (e.g. MCA Block)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />

      <br /><br />

      <button onClick={addClassroom}>Add Classroom</button>

      <h3>Classroom List</h3>

      {classrooms.map((c, i) => (
        <div key={i}>
          {c.room_name} - {c.location}
        </div>
      ))}
    </div>
  );
}