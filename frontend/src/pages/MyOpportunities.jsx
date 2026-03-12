import React, { useEffect, useState } from "react";
import axios from "axios";

function MyOpportunities() {

  const [jobs, setJobs] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {

  const token = localStorage.getItem("token");

  const res = await axios.get(
    "http://localhost:5000/api/opportunity/my",
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  setJobs(res.data);
};
  return (
    <div>
      <h2>My Posted Opportunities</h2>

      {jobs.map(job => (
        <div key={job._id} className="job-card">

          <h3>{job.title}</h3>
          <p>{job.company}</p>
          <p>{job.location}</p>
          <p><strong>Salary / Stipend:</strong> {job.salaryStipend || "Not specified"}</p>
          <p><strong>Applicants:</strong> {job.applicants?.length || 0} students applied</p>

        </div>
      ))}

    </div>
  );
}

export default MyOpportunities;