import { useState, useEffect } from 'react';
import { workoutData } from '../data/workoutData';
import { supabase } from '../supabaseClient';
import { Save } from 'lucide-react';

export default function Workout() {
  const [selectedDay, setSelectedDay] = useState(workoutData[0].id);
  const [formData, setFormData] = useState({});
  const [showToast, setShowToast] = useState(false);

  const currentWorkout = workoutData.find(d => d.id === selectedDay);

  // Load latest data from localStorage for default values
  useEffect(() => {
    const saved = localStorage.getItem('gymTrackerData_v2');
    if (saved) {
      setFormData(JSON.parse(saved));
    }
  }, []);

  const handleInputChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      [`${id}_${field}`]: value
    }));
  };

  const handleSave = async () => {
    // Save to local storage
    localStorage.setItem('gymTrackerData_v2', JSON.stringify(formData));

    // Save to Supabase if connected
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
          alert("Không thể lưu lên Supabase. Kiểm tra lại API Key ở phần Cài Đặt.");
        }
      } catch (err) {
        console.error(err);
      }
    }

    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="workout-page">
      {showToast && <div className="toast">✅ Đã lưu tập luyện thành công!</div>}
      
      <div className="card">
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>
          Hôm nay bạn tập bài gì?
        </label>
        <select 
          value={selectedDay} 
          onChange={e => setSelectedDay(e.target.value)}
        >
          {workoutData.map(day => (
            <option key={day.id} value={day.id}>{day.title}</option>
          ))}
        </select>
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
            <div key={ex.id} className="exercise-item">
              <div className="exercise-name">
                {ex.name} <span className="exercise-target">{ex.target}</span>
              </div>
              <div className="sets-container">
                {Array.from({ length: numSets }).map((_, i) => (
                  <div key={i} className="set-box">
                    <div className="set-label">Set {i + 1}</div>
                    <input 
                      type="number" 
                      placeholder="kg" 
                      step="0.5"
                      value={formData[`${ex.id}_s${i+1}_w`] || ''}
                      onChange={e => handleInputChange(`${ex.id}_s${i+1}`, 'w', e.target.value)}
                    />
                    <input 
                      type="number" 
                      placeholder="reps" 
                      value={formData[`${ex.id}_s${i+1}_r`] || ''}
                      onChange={e => handleInputChange(`${ex.id}_s${i+1}`, 'r', e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button className="btn btn-primary" onClick={handleSave} style={{ padding: '15px 40px', borderRadius: '30px', fontSize: '1.1rem' }}>
          <Save size={20} /> Lưu Mức Tạ Hôm Nay
        </button>
      </div>
    </div>
  );
}
