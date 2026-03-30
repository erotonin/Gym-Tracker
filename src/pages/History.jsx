import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { format } from 'date-fns';
import { Calendar, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { workoutData } from '../data/workoutData';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    async function fetchHistory() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('workout_history')
          .select('*')
          .order('date', { ascending: false });
          
        if (error) throw error;
        // Mở sẵn item đầu tiên lúc vừa vào
        if (data && data.length > 0) {
          setExpandedId(data[0].id);
        }
        setHistory(data || []);
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchHistory();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xoá buổi tập này khỏi lịch sử Không?')) {
      try {
        const { error } = await supabase.from('workout_history').delete().eq('id', id);
        if (error) throw error;
        setHistory(history.filter(h => h.id !== id));
      } catch (err) {
         console.error(err);
         alert("Có lỗi khi xoá dữ liệu!");
      }
    }
  }

  const toggleExpand = (id) => {
    if (expandedId === id) setExpandedId(null);
    else setExpandedId(id);
  }

  if (!supabase) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <h2 style={{ color: 'var(--danger)', marginBottom: '10px' }}>Chưa Kết Nối Database</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Bạn cần thiết lập Supabase API Key ở phần <strong>Cài Đặt</strong> để dùng được chức năng Lịch Sử.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Đang tải lịch sử...</div>;
  }

  return (
    <div className="history-page">
      {history.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>Chưa có lịch sử tập luyện nào.</p>
        </div>
      ) : (
        history.map((record) => {
          const isExpanded = expandedId === record.id;
          const dayData = workoutData.find(d => d.id === record.day_id);
          
          return (
            <div key={record.id} className="card" style={{ padding: '0', overflow: 'hidden', borderLeft: '4px solid var(--accent)', transition: 'all 0.3s' }}>
              
              {/* Header (Clickable for expand/collapse) */}
              <div 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                onClick={() => toggleExpand(record.id)}
              >
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Calendar size={18} />
                    {format(new Date(record.date), 'dd/MM/yyyy • HH:mm')}
                  </div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: '500' }}>
                    {record.workout_name}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isExpanded ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                </div>
              </div>
              
              {/* Expanded details */}
              {isExpanded && (
                <div style={{ padding: '0 20px 20px 20px', borderTop: '1px solid var(--border)', animation: 'slideIn 0.3s ease-out' }}>
                  
                  <div style={{ marginTop: '20px' }}>
                    {dayData ? dayData.exercises.map(ex => {
                      const sets = [];
                      // Lấy dữ liệu lưu trữ các set
                      for(let i=1; i<=10; i++) {
                        const weight = record.data[`${ex.id}_s${i}_w`];
                        const reps = record.data[`${ex.id}_s${i}_r`];
                        if (weight || reps) {
                          sets.push({ setInfo: i, w: weight, r: reps });
                        }
                      }
                      
                      if(sets.length === 0) return null;

                      return (
                        <div key={ex.id} style={{ marginBottom: '18px' }}>
                          <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '10px', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block', marginRight: '8px' }}></span>
                            {ex.name}
                          </div>
                          
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingLeft: '14px' }}>
                            {sets.map(s => (
                              <div key={s.setInfo} style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', color: '#e2e8f0' }}>
                                Hiệp {s.setInfo}: <strong style={{ color: '#60a5fa', fontSize: '1rem' }}>{s.w || '-'}</strong> kg <span style={{color: 'var(--text-muted)', margin: '0 4px'}}>x</span> <strong style={{ color: '#60a5fa', fontSize: '1rem' }}>{s.r || '-'}</strong> reps
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }) : (
                      <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Không có dữ liệu chi tiết tạ hoặc bài này đã bị gỡ khỏi hệ thống.
                      </div>
                    )}
                  </div>
                  
                  {/* Nút Xoá Dưới Cùng */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '25px', paddingTop: '15px', borderTop: '1px dashed var(--border)' }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }}
                      style={{ background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', padding: '8px 16px', borderRadius: '8px', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500', transition: 'all 0.2s' }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)' }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <Trash2 size={16} /> Xoá buổi tập này
                    </button>
                  </div>

                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
