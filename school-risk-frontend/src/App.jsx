// src/App.jsx
import React, { useState } from 'react';
import './App.css';

import {
  createBrowserRouter,
  RouterProvider,
  Link,
  Navigate
} from 'react-router-dom';
import axios from 'axios';

import SurveyOne     from './SurveyOne.jsx';
import SurveyTwo     from './SurveyTwo.jsx';
import StudentHome   from './StudentHome.jsx';
import RiskDashboard from './RiskDashboard.jsx';
import UsersAdmin    from './UsersAdmin.jsx';
import SystemAdmin   from './SystemAdmin.jsx';

/* ---------- Firebase ---------- */
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

initializeApp({
  apiKey:      import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:   import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId:       import.meta.env.VITE_FIREBASE_APP_ID
});
const auth     = getAuth();
const provider = new GoogleAuthProvider();

/* ---------- API base ---------- */
const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || '';

export default function App() {
  const [token, setToken]   = useState(null);
  const [email, setEmail]   = useState(null);
  const [userInfo, setInfo] = useState(null);
  const [err, setErr]       = useState(null);

  /* ----- Auth helpers ----- */
  const login = async () => {
    try {
      const { user } = await signInWithPopup(auth, provider);
      const t = await user.getIdToken();
      setToken(t);
      setEmail(user.email);

      const { data } = await axios.get(`${API_BASE}/whoami`, {
        headers: { Authorization: `Bearer ${t}` }
      });
      setInfo(data);
    } catch (e) {
      setErr(e.message);
    }
  };

  const logout = () => {
    auth.signOut();
    setToken(null);
    setEmail(null);
    setInfo(null);
  };

  /* ----- Pre-auth screens ----- */
  if (!token) {
    return (
      <div style={{ padding: 24 }}>
        <h2>School-Risk Prototype</h2>
        <button onClick={login}>Sign in with Google</button>
        {err && <p style={{ color: 'red' }}>{err}</p>}
      </div>
    );
  }
  if (!userInfo) {
    return <p style={{ padding: 24 }}>Loading your profile…</p>;
  }

  /* ----- Shared layout ----- */
  const Layout = ({ children }) => (
    <div style={{ padding: 24 }}>
      <h2>School-Risk Prototype</h2>
      <p>
        Signed in as <strong>{email}</strong>{' '}
        <button onClick={logout}>Sign out</button>
      </p>

      <nav style={{ marginBottom: 16 }}>
        {userInfo.role === 'student'      && <Link to="/student">Surveys</Link>}
        {userInfo.role === 'teacher'      && <Link to="/staff">Risk Dashboard</Link>}
        {userInfo.role === 'school_admin' && <Link to="/admin">Admin</Link>}
        {userInfo.role === 'system_admin' && <Link to="/system">System Admin</Link>}
      </nav>

      {children}
      {err && <p style={{ color: 'red' }}>{err}</p>}
    </div>
  );

  /* ----- Role->home path ----- */
  const homePath =
    userInfo.role === 'student'      ? '/student' :
    userInfo.role === 'teacher'      ? '/staff'   :
    userInfo.role === 'school_admin' ? '/admin'   :
    userInfo.role === 'system_admin' ? '/system'  :
    '/';     // fallback for unknown role

  /* ----- Build routes ----- */
  const routes = [
    { path: '/', element: <Navigate to={homePath} replace /> }
  ];

  switch (userInfo.role) {
    /* --- Student --- */
    case 'student':
      routes.push(
        {
          path: '/student',
          element: (
            <Layout>
              <StudentHome token={token} />
            </Layout>
          )
        },
        {
          path: '/survey/1',
          element: (
            <Layout>
              <SurveyOne token={token} />
            </Layout>
          )
        },
        {
          path: '/survey/2',
          element: (
            <Layout>
              <SurveyTwo token={token} />
            </Layout>
          )
        },
        { path: '*', element: <Navigate to="/student" replace /> }
      );
      break;

    /* --- Teacher --- */
    case 'teacher':
      routes.push(
        {
          path: '/staff',
          element: (
            <Layout>
              <RiskDashboard token={token} />
            </Layout>
          )
        },
        { path: '*', element: <Navigate to="/staff" replace /> }
      );
      break;

    /* --- School Admin --- */
    case 'school_admin':
      routes.push(
        {
          path: '/admin',
          element: (
            <Layout>
              <UsersAdmin token={token} />
            </Layout>
          )
        },
        { path: '*', element: <Navigate to="/admin" replace /> }
      );
      break;

    /* --- System Admin --- */
    case 'system_admin':
      routes.push(
        {
          path: '/system',
          element: (
            <Layout>
              <SystemAdmin token={token} />
            </Layout>
          )
        },
        { path: '*', element: <Navigate to="/system" replace /> }
      );
      break;

    default:
      routes.push({ path: '*', element: <Navigate to="/" replace /> });
  }

  const router = createBrowserRouter(routes, {
    future: { v7_startTransition: true, v7_relativeSplatPaths: true }
  });

  return <RouterProvider router={router} />;
}
