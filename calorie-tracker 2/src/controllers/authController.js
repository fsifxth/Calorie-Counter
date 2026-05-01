const bcrypt  = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const db      = require("../models/db");
const { calcBMR, calcTDEE, calcCalorieGoal, calcDefaultGoals, calcAge } = require("../utils/nutrition");
const { today } = require("../utils/helpers");
const { VALID_GENDERS, VALID_GOALS, VALID_ACTIVITIES, MIN_PASSWORD_LENGTH, MIN_AGE } = require("../config/constants");

async function register(req, res) {
  const { username, email, password} = req.body;

  const missing = ["username","email","password"].filter(k => !req.body[k]);
  if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}` });
  if (password.length < MIN_PASSWORD_LENGTH) return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
  

  const users = Object.values(db.users);
  if (users.some(u => u.email === email.toLowerCase())) return res.status(409).json({ error: "Email already registered." });
  if (users.some(u => u.username === username.toLowerCase())) return res.status(409).json({ error: "Username already taken." });

  const userId = uuidv4();
  const user = {
    id: userId, username: username.toLowerCase(), displayName: username,
    email: email.toLowerCase(), passwordHash: await bcrypt.hash(password, 12),
    createdAt: new Date().toISOString(), profilePic: null, bio: "",
  };

  db.users[userId]    = user;
  db.foodLogs[userId] = {};
  db.water[userId]    = {};
  db.weight[userId]   = [];
  db.goals[userId]    = {};

  const token = uuidv4();
  db.sessions[token] = userId;

  return res.status(201).json({ message: "Account created! Welcome 🎉", token, userId });
}

async function login(req, res) {
  const { emailOrUsername, password } = req.body;
  if (!emailOrUsername || !password) return res.status(400).json({ error: "Provide emailOrUsername and password." });

  const user = Object.values(db.users).find(u => u.email === emailOrUsername.toLowerCase() || u.username === emailOrUsername.toLowerCase());
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: "Invalid credentials." });

  const token = uuidv4();
  db.sessions[token] = user.id;
  return res.json({ message: `Welcome back, ${user.displayName}!`, token, userId: user.id });
}

function logout(req, res) {
  delete db.sessions[req.token];
  return res.json({ message: "Logged out successfully." });
}

module.exports = { register, login, logout };

