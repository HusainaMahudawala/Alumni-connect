const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const dashboardRoutes = require("./routes/dashboardRoutes");
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/test", require("./routes/testRoutes"));
app.use("/api/mentorship", require("./routes/mentorshipRoutes"));
app.use("/api/opportunity", require("./routes/opportunityRoutes"));
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/posts", require("./routes/postRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/alumni", require("./routes/alumniRoutes"));
app.use("/api/messages", require("./routes/messagesRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/events", require("./routes/eventRoutes"));
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));


const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Alumni Connect Backend Running");
});

app.listen(PORT, () => {
  console.log(`Backend root: ${__dirname}`);
  console.log(`Server running on port ${PORT}`);
});



