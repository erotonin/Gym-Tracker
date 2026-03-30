import { Routes, Route, NavLink } from 'react-router-dom';
import { Dumbbell, History, Settings as SettingsIcon } from 'lucide-react';
import Workout from './pages/Workout';
import HistoryPage from './pages/History';
import Settings from './pages/Settings';
import { supabase } from './supabaseClient';
import { useState, useEffect } from 'react';

function App() {
  const [hasDb, setHasDb] = useState(false);

  useEffect(() => {
    // Check if user has configured Supabase
    if (supabase) {
      setHasDb(true);
    }
  }, []);

  return (
    <div className="app-container">
      <header>
        <h1>Gym Tracker</h1>
        <div style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>
          {hasDb ? <span style={{color: 'var(--success)'}}>● Database Connected</span> : <span style={{color: 'var(--danger)'}}>● Local Mode Only</span>}
        </div>
        <nav>
          <NavLink to="/" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            <Dumbbell size={20} /> Tập Luyện
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            <History size={20} /> Lịch Sử
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            <SettingsIcon size={20} /> Cài Đặt
          </NavLink>
        </nav>
      </header>
      
      <main>
        <Routes>
          <Route path="/" element={<Workout />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
