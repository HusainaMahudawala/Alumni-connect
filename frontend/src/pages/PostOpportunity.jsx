import React, { useState } from "react";
import axios from "axios";
import "./PostOpportunity.css";
function PostOpportunity() {

  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    type: "full-time",
    workMode: "onsite",
    overview: "",
    responsibilities: "",
    requiredSkills: "",
    preferredSkills: ""
  });

  const token = localStorage.getItem("token");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const submitOpportunity = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        "http://localhost:5000/api/opportunity",
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert("Opportunity posted successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Error posting opportunity");
    }
  };

  return (
    <div className="post-container">

      <h2>Post Opportunity</h2>

      <form onSubmit={submitOpportunity}>

        <input
          type="text"
          name="title"
          placeholder="Job Title"
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="company"
          placeholder="Company Name"
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="location"
          placeholder="Location"
          onChange={handleChange}
        />

        <select name="type" onChange={handleChange}>
          <option value="full-time">Full Time</option>
          <option value="internship">Internship</option>
          <option value="part-time">Part Time</option>
          <option value="contract">Contract</option>
        </select>

        <select name="workMode" onChange={handleChange}>
          <option value="onsite">Onsite</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
        </select>

        <textarea
          name="overview"
          placeholder="Job Overview"
          onChange={handleChange}
        />

        <textarea
          name="responsibilities"
          placeholder="Responsibilities (comma separated)"
          onChange={handleChange}
        />

        <input
          type="text"
          name="requiredSkills"
          placeholder="Required Skills (comma separated)"
          onChange={handleChange}
        />

        <input
          type="text"
          name="preferredSkills"
          placeholder="Preferred Skills"
          onChange={handleChange}
        />

        <button type="submit">Post Opportunity</button>

      </form>

    </div>
  );
}

export default PostOpportunity;