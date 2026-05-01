const path = require("path");
const express = require("express");
const cors = require("cors");
const db      = require("./models/db");

const authRoutes     = require("./routes/authRoutes");
const userRoutes     = require("./routes/userRoutes");
const foodRoutes     = require("./routes/foodRoutes");
const diaryRoutes    = require("./routes/diaryRoutes");
const waterRoutes    = require("./routes/waterRoutes");
const weightRoutes   = require("./routes/weightRoutes");
const progressRoutes = require("./routes/progressRoutes");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../Calorie-Counter")));

app.get("/health", (_req, res) => res.json({
  status: "ok", name: "CalorieTracker API", version: "1.0.0",
  time: new Date().toISOString(),
  stats: { users: Object.keys(db.users).length, foodItems: Object.keys(db.foodDB).length, activeSessions: Object.keys(db.sessions).length },
}));

app.use("/auth",     authRoutes);
app.use("/users",    userRoutes);
app.use("/foods",    foodRoutes);
app.use("/diary",    diaryRoutes);
app.use("/water",    waterRoutes);
app.use("/weight",   weightRoutes);
app.use("/progress", progressRoutes);

const goalsRoutes = require("./routes/goalsRoutes");
app.use("/goals",    goalsRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;