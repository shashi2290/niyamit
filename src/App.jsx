import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import CalendarView from './components/CalendarView';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import { TaskProvider } from './contexts/TaskContext';
import './index.css'

function App() {
  return (
    <TaskProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="calendar" element={<CalendarView />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </TaskProvider>
  );
}

export default App;
