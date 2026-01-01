import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn, SignIn, SignUp } from '@clerk/clerk-react';
import Layout from './components/Layout';
import CalendarView from './components/CalendarView';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import { TaskProvider } from './contexts/TaskContext';
import './index.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/sign-in/*"
          element={
             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
               <SignIn routing="path" path="/sign-in" />
             </div>
          }
        />
        <Route
          path="/sign-up/*"
          element={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
               <SignUp routing="path" path="/sign-up" />
            </div>
          }
        />
        <Route
          path="*"
          element={
            <>
              <SignedIn>
                <TaskProvider>
                  <Routes>
                    <Route path="/" element={<Layout />}>
                      <Route index element={<Dashboard />} />
                      <Route path="calendar" element={<CalendarView />} />
                      <Route path="settings" element={<Settings />} />
                    </Route>
                  </Routes>
                </TaskProvider>
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;