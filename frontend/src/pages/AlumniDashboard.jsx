import React, { useEffect, useState } from "react";
import axios from "axios";

function AlumniDashboard() {
  const [requests, setRequests] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/mentorship/alumni",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setRequests(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const approve = async (id) => {
    try {
      await axios.put(
        `http://localhost:5000/api/mentorship/approve/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert("Approved!");
      fetchRequests();
    } catch (error) {
      console.log(error);
    }
  };

  const reject = async (id) => {
    try {
      await axios.put(
        `http://localhost:5000/api/mentorship/reject/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert("Rejected!");
      fetchRequests();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div style={{ padding: "30px" }}>
      <h2>Mentorship Requests</h2>

      {requests.length === 0 && <p>No requests yet.</p>}

      {requests.map((req) => (
        <div
          key={req._id}
          style={{
            border: "1px solid #ccc",
            padding: "15px",
            marginBottom: "15px",
            borderRadius: "8px"
          }}
        >
          <h3>{req.student.name}</h3>
          <p>{req.student.email}</p>
          <p>Status: {req.status}</p>

          {req.status === "pending" && (
            <>
              <button
                onClick={() => approve(req._id)}
                style={{ marginRight: "10px" }}
              >
                Approve
              </button>

              <button onClick={() => reject(req._id)}>
                Reject
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default AlumniDashboard;