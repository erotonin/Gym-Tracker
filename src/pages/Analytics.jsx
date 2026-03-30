import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { TrendingUp, Scale, Save, Activity } from 'lucide-react';

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState([]);
  const [volumeData, setVolumeData] = useState([]);
  
  // Input cân nặng
  const [weightInput, setWeightInput] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('workout_history')
        .select('*')
        .order('date', { ascending: true });
        
      if (error) throw error;
      
      const bwgData = [];
      const volData = [];

      data.forEach(record => {
        const dStr = format(parseISO(record.date), 'dd/MM');
        
        // Log cân nặng được cấu hình như 1 bài tập ảo có tên "_system_metrics_"
        if (record.workout_name === "_system_metrics_") {
          bwgData.push({
             date: dStr,
             weight: parseFloat(record.data.weight)
          });
        } 
        else {
          // Tính tổng tạ nâng được (Volume = Sets * Reps * Weight) của buổi đó
          let totalVolume = 0;
          Object.keys(record.data).forEach(key => {
            if (key.endsWith('_w') && record.data[key]) {
               const weight = parseFloat(record.data[key]);
               const repsKey = key.replace('_w', '_r');
               const reps = parseFloat(record.data[repsKey] || 0);
               if (weight > 0 && reps > 0) {
                 totalVolume += (weight * reps);
               }
            }
          });
          
          if (totalVolume > 0) {
            volData.push({
              date: dStr,
              name: record.workout_name.substring(0, 10) + '...',
              volume: totalVolume
            });
          }
        }
      });
      
      // Nếu không có cân nặng, dùng tạm mốc ảo để chart không bị lỗi
      if (bwgData.length === 0) {
         bwgData.push({ date: format(new Date(), 'dd/MM'), weight: 73 });
      }

      setMetrics(bwgData);
      setVolumeData(volData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWeight = async () => {
    if (!weightInput || isNaN(weightInput)) return;
    setStatus('Đang lưu...');
    
    if (supabase) {
      const payload = {
        date: new Date().toISOString(),
        day_id: 'system',
        workout_name: '_system_metrics_',
        data: { weight: parseFloat(weightInput) }
      };
      
      const { error } = await supabase.from('workout_history').insert([payload]);
      if (error) {
        setStatus('Lỗi: ' + error.message);
      } else {
        setStatus('Lưu cân nặng thành công!');
        setWeightInput('');
        fetchData(); // Tải lại biểu đồ
        setTimeout(() => setStatus(''), 2000);
      }
    } else {
       setStatus('Yêu cầu kết nối Database ở tab Cài Đặt!');
       setTimeout(() => setStatus(''), 2000);
    }
  };

  if (!supabase) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <h2 style={{ color: 'var(--danger)', marginBottom: '10px' }}>Chưa Kết Nối Database</h2>
        <p style={{ color: 'var(--text-muted)' }}>Bạn cần kết nối Database để xem Thống Kê.</p>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      
      {/* Box nhập cân nặng */}
      <div className="card" style={{ borderTop: '4px solid var(--accent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          <Scale size={20} color="var(--accent)" />
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Cập nhật Cân Nặng</h2>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="number" 
            placeholder="Ví dụ: 72.5 (kg)" 
            step="0.1"
            value={weightInput}
            onChange={e => setWeightInput(e.target.value)}
            style={{ flex: 1, padding: '12px', fontSize: '1.1rem' }}
          />
          <button className="btn btn-primary" onClick={handleSaveWeight} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={18} /> Lưu
          </button>
        </div>
        {status && <div style={{ marginTop: '10px', fontSize: '0.9rem', color: status.includes('Lỗi') ? 'var(--danger)' : 'var(--success)' }}>{status}</div>}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Đang tải biểu đồ...</div>
      ) : (
        <>
          {/* Biểu đồ Cân Nặng */}
          <div className="card">
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TrendingUp size={20} color="var(--accent)" />
              Lộ Trình Cân Nặng (Body Recomposition)
            </h3>
            <div style={{ height: '300px', width: '100%', marginLeft: '-20px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--accent)', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="weight" name="Cân Nặng (kg)" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Biểu đồ Khối lượng tạ (Volume) */}
          {volumeData.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={20} color="#8b5cf6" />
                Tổng Khối Lượng Tạ (Total Volume)
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
                Biểu đồ này tính tổng (Kg x Reps) của tất cả các bài cộng lại trong 1 buổi tập. Càng cao nghĩa là bạn càng khoẻ và tập càng "trâu".
              </p>
              <div style={{ height: '250px', width: '100%', marginLeft: '-20px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={volumeData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)', borderRadius: '8px' }}
                      labelStyle={{ color: 'var(--text-muted)' }}
                    />
                    <Line type="monotone" dataKey="volume" name="Volume (kg)" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
