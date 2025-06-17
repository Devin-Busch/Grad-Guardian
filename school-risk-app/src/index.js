/************************************************************
 * E:\gradGaurdian\school-risk-app\src\index.js
 ************************************************************/
require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const app       = express();

/* -------- global middleware -------- */
app.use(cors());
app.use(express.json());

/* -------- import auth, role-check, and routers -------- */
const auth           = require('./middleware/auth');
const roleCheck      = require('./middleware/roleCheck');
const studentsRouter = require('./routes/students');
const usersRouter    = require('./routes/users');
const schoolsRouter  = require('./routes/schools');
const surveysRouter = require('./routes/surveys');
const riskDashboard = require('./routes/riskDashboard');
const surveyStatus = require('./routes/surveyStatus');

/* -------- mount your protected routes -------- */
app.use('/students', auth, studentsRouter);
app.use('/users',    auth, usersRouter);
app.use('/schools', auth, roleCheck(['system_admin']), schoolsRouter);
app.use('/api/surveys', surveysRouter);
app.use('/api/risk-dashboard', riskDashboard);
app.use('/api/surveys/status', surveyStatus);

/* -------- whoami endpoint -------- */
app.get(
  '/whoami',
  auth,
  (req, res) => {
    res.json({
      email:     req.user.email,
      role:      req.user.role,
      school_id: req.user.school_id
    });
  }
);

/* -------- health check -------- */
app.get('/', (_req, res) => res.send('API is alive 🚀'));

/* -------- start server -------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
