import { useState, useEffect } from 'react';
import { workoutData } from '../data/workoutData';
import { supabase } from '../supabaseClient';
import { Save, Timer, Play, RotateCcw, X, TrendingUp, Flame, Clock, Dumbbell } from 'lucide-react';

const muscleColors = {
  'Ngực':       '#3b82f6',
  'Ngực trên':  '#60a5fa',
  'Lưng':       '#8b5cf6',
  'Vai':        '#f59e0b',
  'Vai giữa':   '#fbbf24',
  'Vai sau':    '#f97316',
  'Tay trước':  '#10b981',
  'Tay sau':    '#34d399',
  'Đùi':        '#ec4899',
  'Đùi trước':  '#f472b6',
  'Đùi sau':    '#a78bfa',
  'Đùi trong':  '#c084fc',
  'Mông':       '#fb7185',
  'Mông ngoài': '#fda4af',
  'Bắp chân':   '#94a3b8',
  'Bụng':       '#22d3ee',
  'Bụng dưới':  '#67e8f9',
  'Core':       '#38bdf8',
};

export default function Workout() {
  const getInitialDay = () => {
    const today = new Date().getDay();
    if (today === 1) return 'day1';
    if (today === 2) return 'day2';
    if (today === 4) return 'day4';
    if (today === 5) return 'day5';
    if (today === 6) return 'day6';
    return 'day1';
  };

  const [selectedDay, setSelectedDay] = useState(getInitialDay());
  const [formData, setFormData] = useState({});
  const [prevData, setPrevData] = useState({});
  const [showToast, setShowToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const currentWorkout = workoutData.find(d => d.id === selectedDay);

  useEffect(() => {
    const saved = localStorage.getItem('gymTrackerData_v2');
    if (saved) setFormData(JSON.parse(saved));
  }, []);

  useEffect(() => {
    async function fetchLastWorkout() {
      if (!supabase) return;
      try {
        const { data } = await supabase
          .from('workout_history')
          .select('data, date')
          .eq('day_id', selectedDay)
          .order('date', { ascending: false });
        setPrevData(data && data.length > 0 ? data[0].data : {});
      } catch (e) {
        console.warn('Could not fetch previous session hints', e);
      }
    }
    fetchLastWorkout();
  }, [selectedDay]);

  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timerActive && timeLeft === 0) {
      setTimerActive(false);
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);
        oscillator.stop(audioCtx.currentTime + 0.5);
      } catch (e) {}
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

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
    setFormData(prev => ({ ...prev, [`${id}_${field}`]: value }));
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
          console.error('Supabase Error:', error);
          alert('Không thể lưu lên đám mây. Đã lưu cục bộ. Lỗi: ' + error.message);
        }
      } catch (err) {
        console.error(err);
      }
    }

    setIsSaving(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const restLabel = (type) => {
    if (type === 'compound') return `${currentWorkout.restCompound}s`;
    if (type === 'isometric') return `${currentWorkout.restAccessory}s`;
    return `${currentWorkout.restAccessory}s`;
  };

  const borderColor = (type) => {
    if (type === 'compound') return '#3b82f6';
    if (type === 'isometric') return '#10b981';
    return '#6366f1';
  };

  return (
    <div className="workout-page" style={{ position: 'relative', paddingBottom: '80px' }}>
      {showToast && <div className="toast">Đã lưu bài tập thành công!</div>}

      {/* Day selector */}
      <div className="card" style={{ borderTop: '4px solid var(--accent)', marginBottom: '18px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Hôm nay (tự động phát hiện)
        </label>
        <select
          value={selectedDay}
          onChange={e => setSelectedDay(e.target.value)}
          style={{ background: 'var(--bg-color)', color: 'var(--accent)', fontWeight: 'bold' }}
        >
          {workoutData.map(day => (
            <option key={day.id} value={day.id}>{day.title} — {day.subtitle}</option>
          ))}
        </select>
        {Object.keys(prevData).length > 0 && (
          <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={14} /> Đã tải mức tạ từ buổi tập trước!
          </div>
        )}
      </div>

      {/* Workout header card */}
      <div className="card" style={{ marginBottom: '18px', background: 'linear-gradient(135deg, #1e293b, #1a2540)', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#60a5fa', lineHeight: 1.2 }}>{currentWorkout.title}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '3px' }}>{currentWorkout.subtitle}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span className="meta-badge"><Clock size={13} /> {currentWorkout.duration}</span>
            <span className="meta-badge meta-badge-compound">Compound: {currentWorkout.restCompound}s</span>
            <span className="meta-badge meta-badge-accessory">Bổ trợ: {currentWorkout.restAccessory}s</span>
          </div>
        </div>

        {currentWorkout.warmup && (
          <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontSize: '0.85rem', borderTop: '1px solid #334155', paddingTop: '12px' }}>
            <Flame size={15} />
            <span><strong>Khởi động:</strong> {currentWorkout.warmup}</span>
          </div>
        )}
      </div>

      {/* Exercises */}
      <div className="card" style={{ padding: '16px', marginBottom: '18px' }}>
        {currentWorkout.exercises.map((ex, idx) => {
          return (
            <div
              key={ex.id}
              className="exercise-item"
              style={{ borderLeft: `3px solid ${borderColor(ex.type)}`, marginBottom: idx < currentWorkout.exercises.length - 1 ? '14px' : '0' }}
            >
              {/* Exercise header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {ex.name}
                    {ex.note && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>({ex.note})</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '5px' }}>
                    {ex.muscles.map(m => (
                      <span key={m} className="muscle-tag" style={{ background: muscleColors[m] || '#64748b' }}>{m}</span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                  <span className="exercise-target">{ex.sets} × {ex.reps}</span>
                  <button
                    className="rest-btn"
                    onClick={() => startTimer(ex.type === 'compound' ? currentWorkout.restCompound : currentWorkout.restAccessory)}
                    title={`Bắt đầu nghỉ ${restLabel(ex.type)}`}
                  >
                    <Timer size={12} /> {restLabel(ex.type)}
                  </button>
                </div>
              </div>

              {/* Sets grid */}
              <div className="sets-container">
                {Array.from({ length: ex.sets }).map((_, i) => {
                  const pW = prevData[`${ex.id}_s${i + 1}_w`];
                  const pR = prevData[`${ex.id}_s${i + 1}_r`];
                  const pStr = pW && pR ? `${pW}kg×${pR}` : null;
                  const isTime = ex.type === 'isometric';

                  return (
                    <div key={i} className="set-box">
                      <div className="set-label">Set {i + 1}</div>
                      {!isTime && (
                        <input
                          type="number"
                          placeholder="kg"
                          step="0.5"
                          value={formData[`${ex.id}_s${i + 1}_w`] || ''}
                          onChange={e => handleInputChange(`${ex.id}_s${i + 1}`, 'w', e.target.value)}
                          onFocus={e => e.target.select()}
                        />
                      )}
                      <input
                        type="number"
                        placeholder={isTime ? 'giây' : 'reps'}
                        value={formData[`${ex.id}_s${i + 1}_r`] || ''}
                        onChange={e => handleInputChange(`${ex.id}_s${i + 1}`, 'r', e.target.value)}
                        onFocus={e => e.target.select()}
                        style={isTime ? { borderColor: '#10b981' } : {}}
                      />
                      {pStr && (
                        <div className="prev-hint">Cũ: {pStr}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cardio section */}
      {currentWorkout.cardio && (
        <div className="card cardio-card" style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="cardio-icon">🚶</div>
            <div>
              <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.95rem' }}>Incline Walk — Kết thúc buổi tập</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
                {currentWorkout.cardio.duration} · Dốc {currentWorkout.cardio.incline} · Tốc độ {currentWorkout.cardio.speed}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save button */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={isSaving}
          style={{ padding: '15px 40px', borderRadius: '30px', fontSize: '1.05rem', opacity: isSaving ? 0.7 : 1, width: '100%', maxWidth: '320px' }}
        >
          {isSaving ? 'Đang lưu...' : <><Save size={20} /> Lưu Buổi Tập Hôm Nay</>}
        </button>
      </div>

      {/* Floating rest timer */}
      <div className="floating-timer">
        {timeLeft > 0 ? (
          <>
            <div style={{ color: timeLeft <= 10 ? 'var(--danger)' : 'var(--accent)', fontWeight: 'bold', fontSize: '1.25rem', fontFamily: 'monospace', minWidth: '55px' }}>
              {formatTime(timeLeft)}
            </div>
            <button onClick={() => setTimerActive(!timerActive)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '4px' }}>
              {timerActive ? <X size={20} /> : <Play size={20} />}
            </button>
            <button onClick={() => { setTimeLeft(0); setTimerActive(false); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
              <RotateCcw size={18} />
            </button>
          </>
        ) : (
          <>
            <Timer size={18} color="var(--text-muted)" />
            <button className="timer-btn" onClick={() => startTimer(45)}>45s</button>
            <button className="timer-btn" onClick={() => startTimer(60)}>60s</button>
            <button className="timer-btn" onClick={() => startTimer(90)}>90s</button>
            <button className="timer-btn" onClick={() => startTimer(120)}>2m</button>
          </>
        )}
      </div>
    </div>
  );
}
