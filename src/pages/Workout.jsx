import { useState, useEffect } from 'react';
import { workoutData } from '../data/workoutData';
import { supabase } from '../supabaseClient';
import { Save, Timer, Play, RotateCcw, X, TrendingUp } from 'lucide-react';

export default function Workout() {
  const getInitialDay = () => {
    const today = new Date().getDay(); // 0 is Sunday, 1 is Monday
    if (today === 1) return 'day1'; // Mon
    if (today === 2) return 'day2'; // Tue
    if (today === 4) return 'day4'; // Thu
    if (today === 5) return 'day5'; // Fri
    return 'day1';
  };

  const [selectedDay, setSelectedDay] = useState(getInitialDay());
  const [formData, setFormData] = useState({});
  const [prevData, setPrevData] = useState({});
  const [showToast, setShowToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Timer State
  const [timerActve, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const currentWorkout = workoutData.find(d => d.id === selectedDay);

  // Restore current un-saved progress
  useEffect(() => {
    const saved = localStorage.getItem('gymTrackerData_v2');
    if (saved) {
      setFormData(JSON.parse(saved));
    }
  }, []);

  // GỢI Ý ĐẨY TẠ THÔNG MINH (Progressive Overload Hints)
  // Fetch previous session data logic
  useEffect(() => {
    async function fetchLastWorkout() {
      if (!supabase) return;
      
      try {
         const { data, error } = await supabase
           .from('workout_history')
           .select('data, date')
           .eq('day_id', selectedDay)
           .order('date', { ascending: false })
         
         // Lấy phiên tập gần đây nhất
         if (data && data.length > 0) {
           setPrevData(data[0].data);
         } else {
           setPrevData({});
         }
      } catch(e) {
         console.warn("Could not fetch previous session hints", e);
      }
    }
    fetchLastWorkout();
  }, [selectedDay]);

  // Timer Countdown Logic
  useEffect(() => {
    let interval = null;
    if (timerActve && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timerActve && timeLeft === 0) {
      setTimerActive(false);
      
      // Play a simple beep when timer finishes
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
        gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);
        oscillator.stop(audioCtx.currentTime + 0.5);
      } catch (e) {
        console.log("Audio API not supported or blocked");
      }
    }
    return () => clearInterval(interval);
  }, [timerActve, timeLeft]);

  const startTimer = (seconds) => {
    setTimeLeft(seconds);
    setTimerActive(true);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      [`${id}_${field}`]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    localStorage.setItem('gymTrackerData_v2', JSON.stringify(formData));

    if (supabase) {
      const payload = {
        date: new Date().toISOString(),
        day_id: selectedDay,
        workout_name: currentWorkout.title,
        data: formData
      };
      
      try {
        const { error } = await supabase.from('workout_history').insert([payload]);
        if (error) {
          console.error("Supabase Error:", error);
          alert("Không thể up dữ liệu lên đám mây. Đã lưu cất cục bộ (Local). Lỗi: " + error.message);
        }
      } catch (err) {
        console.error(err);
      }
    }

    // Reset weights form slightly? No, keeping it is standard for next week.
    setIsSaving(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="workout-page" style={{ position: 'relative', paddingBottom: '60px' }}>
      {showToast && <div className="toast">✅ Đã đồng bộ bài tập thành công!</div>}
      
      <div className="card" style={{ borderTop: '4px solid var(--accent)' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>
          Hôm nay (Tự động phát hiện)
        </label>
        <select 
          value={selectedDay} 
          onChange={e => setSelectedDay(e.target.value)}
          style={{ background: 'var(--bg-color)', color: 'var(--accent)', fontWeight: 'bold' }}
        >
          {workoutData.map(day => (
            <option key={day.id} value={day.id}>{day.title}</option>
          ))}
        </select>
        {Object.keys(prevData).length > 0 && (
           <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px'}}>
              <TrendingUp size={14} /> Hệ thống đã tải được mục tiêu tạ cũ của bạn!
           </div>
        )}
      </div>

      <div className="day-card card">
        <div className="day-header">
          <div className="day-title">{currentWorkout.title}</div>
        </div>

        {currentWorkout.exercises.map(ex => {
          let numSets = 3;
          const match = ex.target.match(/(\d+)\s*sets/i);
          if (match) numSets = parseInt(match[1]);

          return (
            <div key={ex.id} className="exercise-item" style={{ transition: 'all 0.2s', borderLeft: '3px solid var(--accent)' }}>
              <div className="exercise-name">
                {ex.name} <span className="exercise-target">{ex.target}</span>
              </div>
              <div className="sets-container">
                {Array.from({ length: numSets }).map((_, i) => {
                  const pW = prevData[`${ex.id}_s${i+1}_w`];
                  const pR = prevData[`${ex.id}_s${i+1}_r`];
                  const pStr = pW && pR ? `${pW}kg x ${pR}` : null;
                  
                  return (
                    <div key={i} className="set-box">
                      <div className="set-label">Set {i + 1}</div>
                      <input 
                        type="number" 
                        placeholder="kg" 
                        step="0.5"
                        value={formData[`${ex.id}_s${i+1}_w`] || ''}
                        onChange={e => handleInputChange(`${ex.id}_s${i+1}`, 'w', e.target.value)}
                        onFocus={(e) => e.target.select()}
                      />
                      <input 
                        type="number" 
                        placeholder="reps" 
                        value={formData[`${ex.id}_s${i+1}_r`] || ''}
                        onChange={e => handleInputChange(`${ex.id}_s${i+1}`, 'r', e.target.value)}
                        onFocus={(e) => e.target.select()}
                      />
                      {pStr && (
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', textAlign: 'center', marginTop: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', padding: '2px 0' }} title="Lần tập trước">
                           Cũ: {pStr}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px', marginBottom: '40px' }}>
        <button 
          className="btn btn-primary" 
          onClick={handleSave} 
          disabled={isSaving}
          style={{ padding: '15px 40px', borderRadius: '30px', fontSize: '1.05rem', opacity: isSaving ? 0.7 : 1, width: '100%', maxWidth: '300px' }}
        >
          {isSaving ? 'Đang lưu...' : <><Save size={20} /> Lưu Mức Tạ Hôm Nay</>}
        </button>
      </div>

      {/* Floating Timer Widget */}
      <div style={{ 
        position: 'fixed', 
        bottom: '20px', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        background: 'rgba(30, 41, 59, 0.95)', 
        backdropFilter: 'blur(10px)',
        padding: '12px 20px', 
        borderRadius: '30px', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        display: 'flex', 
        alignItems: 'center', 
        gap: '15px',
        border: '1px solid var(--border)',
        zIndex: 100
      }}>
        {timeLeft > 0 ? (
          <>
            <div style={{ color: timeLeft <= 10 ? 'var(--danger)' : 'var(--accent)', fontWeight: 'bold', fontSize: '1.2rem', fontFamily: 'monospace', minWidth: '55px' }}>
              {formatTime(timeLeft)}
            </div>
            <button onClick={() => setTimerActive(!timerActve)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
               {timerActve ? <X size={20} /> : <Play size={20} />}
            </button>
            <button onClick={() => startTimer(0)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
               <RotateCcw size={18} />
            </button>
          </>
        ) : (
          <>
            <Timer size={20} color="var(--text-muted)" />
            <button className="btn" style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => startTimer(60)}>60s</button>
            <button className="btn" style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => startTimer(90)}>90s</button>
            <button className="btn" style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => startTimer(120)}>2m</button>
          </>
        )}
      </div>

    </div>
  );
}
