import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

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
        setHistory(data || []);
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchHistory();
  }, []);

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
    return <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải lịch sử...</div>;
  }

  return (
    <div className="history-page">
      {history.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>Chưa có lịch sử tập luyện nào.</p>
        </div>
      ) : (
        history.map((record) => (
          <div key={record.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <div style={{ fontWeight: '600', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} />
                {format(new Date(record.date), 'dd/MM/yyyy HH:mm')}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                {record.workout_name}
              </div>
            </div>
            
            <div style={{ fontSize: '0.85rem' }}>
               <p style={{ color: 'var(--text-muted)', marginBottom: '10px' }}>Dữ liệu lưu dạng thô (Raw JSON) do chưa định dạng view chi tiết:</p>
               <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '4px', overflowX: 'auto', color: 'var(--text-main)' }}>
                 {JSON.stringify(record.data, null, 2)}
               </pre>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
