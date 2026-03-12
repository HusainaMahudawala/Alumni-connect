import React, { useEffect, useState } from "react";
import axios from "axios";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const StudentStatsGraph = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/dashboard/student", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData({
          labels: [
            "Applied Opportunities",
            "Pending Mentorships",
            "Approved Mentorships",
            "Available Opportunities",
            "Rejected Mentorships"
          ],
          datasets: [
            {
              label: "Student Stats",
              data: [
                res.data.appliedOpportunities,
                res.data.pendingMentorships,
                res.data.approvedMentorships,
                res.data.availableOpportunities,
                res.data.rejectedMentorships
              ],
              backgroundColor: [
                "#f9b233", // orange
                "#4ec3f7", // blue
                "#43a047", // green
                "#ab47bc", // purple
                "#e53935"  // red
              ],
              borderColor: [
                "#f9b233",
                "#4ec3f7",
                "#43a047",
                "#ab47bc",
                "#e53935"
              ],
              borderWidth: 2,
              hoverOffset: 12,
            },
          ],
        });
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div>Loading graph...</div>;
  if (!data) return <div>No data available</div>;

  return (
    <div
      style={{
        width: "100%",
        minHeight: 340,
        maxWidth: 600,
        margin: "0 auto",
        background: "#fff",
        borderRadius: 24,
        boxShadow: "0 12px 32px 0 rgba(31, 38, 135, 0.25), 0 1.5px 0 #fff inset",
        padding: 24,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative"
      }}
    >
      <div style={{ width: "55%", minWidth: 220, maxWidth: 320, padding: "8px 0" }}>
        <Doughnut
          data={data}
          options={{
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                enabled: true,
                backgroundColor: "#fff",
                titleColor: "#222",
                bodyColor: "#222",
                borderColor: "#222",
                borderWidth: 1,
                cornerRadius: 8,
                padding: 12,
                displayColors: true,
              }
            },
            cutout: "70%",
            responsive: true,
            maintainAspectRatio: false,
          }}
        />
      </div>
      <div style={{ width: "45%", minWidth: 180, paddingLeft: 16 }}>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {data.labels.map((label, idx) => (
            <li
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 18,
                fontSize: 16,
                fontWeight: "bold",
                color: "#333",
                wordBreak: "break-word"
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  marginRight: 12,
                  background: data.datasets[0].backgroundColor[idx],
                  boxShadow: "0 2px 8px 0 rgba(31,38,135,0.15)"
                }}
              ></span>
              <span style={{ whiteSpace: "normal" }}>{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default StudentStatsGraph;
