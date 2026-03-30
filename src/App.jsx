import { Routes, Route, NavLink } from 'react-router-dom';
import { Dumbbell, History, Settings as SettingsIcon, BarChart2 } from 'lucide-react';
import Workout from './pages/Workout';
import HistoryPage from './pages/History';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import { supabase } from './supabaseClient';
import { useState, useEffect } from 'react';

function App() {
  const [hasDb, setHasDb] = useState(false);

  useEffect(() => {
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
        <nav style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginTop: '15px', flexWrap: 'wrap' }}>
          <NavLink to="/" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            <Dumbbell size={18} /> Tập
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            <History size={18} /> Lịch Sử
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            <BarChart2 size={18} /> Thống Kê
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            <SettingsIcon size={18} /> Cài Đặt
          </NavLink>
        </nav>
      </header>
      
      <main>
        <Routes>
          <Route path="/" element={<Workout />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
