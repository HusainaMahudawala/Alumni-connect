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
        background: "#fff",
        borderRadius: 16,
        padding: "20px 16px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        boxSizing: "border-box",
      }}
    >
      {/* Doughnut chart */}
      <div style={{ position: "relative", width: "100%", maxWidth: 200, height: 200 }}>
        <Doughnut
          data={data}
          options={{
            plugins: {
              legend: { display: false },
              tooltip: {
                enabled: true,
                backgroundColor: "#fff",
                titleColor: "#222",
                bodyColor: "#222",
                borderColor: "#e5e7eb",
                borderWidth: 1,
                cornerRadius: 8,
                padding: 10,
                displayColors: true,
              },
            },
            cutout: "68%",
            responsive: true,
            maintainAspectRatio: false,
          }}
        />
      </div>

      {/* Legend */}
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          width: "100%",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px 8px",
        }}
      >
        {data.labels.map((label, idx) => (
          <li
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              fontWeight: 600,
              color: "#374151",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                borderRadius: 4,
                flexShrink: 0,
                background: data.datasets[0].backgroundColor[idx],
              }}
            />
            <span style={{ lineHeight: 1.3 }}>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StudentStatsGraph;
