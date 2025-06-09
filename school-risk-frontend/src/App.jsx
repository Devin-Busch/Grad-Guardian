// E:\gradGaurdian\school-risk-frontend\src\App.jsx
import React, { useState } from 'react';
import './App.css';

import {
  createBrowserRouter,
  RouterProvider,
  Route,
  Link,
  Navigate
} from 'react-router-dom';

import axios from 'axios';

import SurveyForm   from './SurveyForm.jsx';
import StudentsList from './StudentsList.jsx';
import UsersAdmin   from './UsersAdmin.jsx';
import SystemAdmin  from './SystemAdmin.jsx';

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

/* ---------- Firebase init ---------- */
initializeApp({
  apiKey:      import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:   import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId:       import.meta.env.VITE_FIREBASE_APP_ID
});
const auth     = getAuth();
const provider = new GoogleAuthProvider();

export default function App() {
  const [token, setTok]         = useState(null);
  const [email, setMail]        = useState(null);
  const [userInfo, setUserInfo] = useState(null);  // { email, role, school_id }
  const [studentId, setStudent] = useState(null);
  const [err, setErr]           = useState(null);

  const login = async () => {
    try {
      const { user } = await signInWithPopup(auth, provider);
      const t = await user.getIdToken();
      setTok(t);
      setMail(user.email);

      // Fetch our custom profile (role & school_id)
      const res = await axios.get('http://localhost:3000/whoami', {
        headers: { Authorization: `Bearer ${t}` }
      });
      setUserInfo(res.data);

      // NO manual window.location.replace() here!
      // We let the router's catch-all redirect trigger on mount.
    } catch (e) {
      setErr(e.message);
    }
  };

  const logout = () => {
    auth.signOut();
    setTok(null);
    setMail(null);
    setUserInfo(null);
    setStudent(null);
  };

  // 1) Not logged in yet
  if (!token) {
    return (
      <div style={{ padding:24, fontFamily:'sans-serif' }}>
        <h2>School-Risk Prototype</h2>
        <button onClick={login}>Sign in with Google</button>
        {err && <p style={{ color:'red' }}>{err}</p>}
      </div>
    );
  }

  // 2) Waiting for /whoami
  if (!userInfo) {
    return (
      <div style={{ padding:24, fontFamily:'sans-serif' }}>
        <p>Loading your profile…</p>
      </div>
    );
  }

  // Layout wrapper
  const Layout = ({ children }) => (
    <div style={{ padding:24, fontFamily:'sans-serif' }}>
      <h2>School-Risk Prototype</h2>
      <p>
        Signed in as <strong>{email}</strong>{' '}
        <button onClick={logout}>Sign out</button>
      </p>
      <nav style={{ marginBottom:16 }}>
        {userInfo.role === 'student'      && <Link to="/">Survey</Link>}
        {userInfo.role === 'teacher'      && <Link to="/staff">Staff View</Link>}
        {userInfo.role === 'school_admin' && <Link to="/admin">Admin</Link>}
        {userInfo.role === 'system_admin' && <Link to="/system">System Admin</Link>}
      </nav>
      {children}
      {err && <p style={{ color:'red' }}>{err}</p>}
    </div>
  );

  // 3) Define the single allowed route per role
  let routes = [];
  switch (userInfo.role) {
    case 'student':
      routes = [
        {
          path: '/',
          element: (
            <Layout>
              {studentId ? (
                <p style={{ color:'green' }}>
                  Survey saved! id=<code>{studentId}</code>
                </p>
              ) : (
                <SurveyForm token={token} onCreated={setStudent} />
              )}
            </Layout>
          )
        },
        { path: '*', element: <Navigate to="/" replace /> }
      ];
      break;

    case 'teacher':
      routes = [
        {
          path: '/staff',
          element: (
            <Layout>
              <StudentsList token={token} />
            </Layout>
          )
        },
        { path: '*', element: <Navigate to="/staff" replace /> }
      ];
      break;

    case 'school_admin':
      routes = [
        {
          path: '/admin',
          element: (
            <Layout>
              <UsersAdmin token={token} />
            </Layout>
          )
        },
        { path: '*', element: <Navigate to="/admin" replace /> }
      ];
      break;

    case 'system_admin':
      routes = [
        {
          path: '/system',
          element: (
            <Layout>
              <SystemAdmin token={token} />
            </Layout>
          )
        },
        { path: '*', element: <Navigate to="/system" replace /> }
      ];
      break;

    default:
      routes = [{ path: '*', element: <Navigate to="/" replace /> }];
  }

  const router = createBrowserRouter(routes, {
    future: { v7_startTransition: true, v7_relativeSplatPaths: true }
  });

  return <RouterProvider router={router} />;
}
