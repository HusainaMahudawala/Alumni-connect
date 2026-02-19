import React, { useEffect, useState } from "react";
import axios from "axios";
import "./StudentOpportunities.css";

function StudentOpportunities() {
  const [opportunities, setOpportunities] = useState([]);

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          "http://localhost:5000/api/opportunity",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setOpportunities(res.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchOpportunities();
  }, []);

  const applyOpportunity = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `http://localhost:5000/api/opportunity/apply/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Applied Successfully!");
    } catch (error) {
      console.log(error);
      alert("Already applied or error occurred");
    }
  };

  return (
    <div className="opportunity-page">
      <h1>Available Opportunities</h1>

      <div className="opportunity-grid">
        {opportunities.map((opp) => (
          <div className="opportunity-card" key={opp._id}>
            <h3>{opp.title}</h3>
            <p>{opp.description}</p>
            <button onClick={() => applyOpportunity(opp._id)}>
              Apply
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StudentOpportunities;
