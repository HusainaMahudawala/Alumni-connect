const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const dashboardRoutes = require("./routes/dashboardRoutes");
app.use(cors());
app.use(express.json());
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/test", require("./routes/testRoutes"));
app.use("/api/mentorship", require("./routes/mentorshipRoutes"));
app.use("/api/opportunity", require("./routes/opportunityRoutes"));
app.use("/api/dashboard", dashboardRoutes);
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));


const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Alumni Connect Backend Running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



