import { useState } from 'react';
import { reinitSupabase } from '../supabaseClient';
import { Database, Link as LinkIcon, AlertCircle } from 'lucide-react';

export default function Settings() {
  const [url, setUrl] = useState(localStorage.getItem('supabaseUrl') || '');
  const [key, setKey] = useState(localStorage.getItem('supabaseKey') || '');
  const [status, setStatus] = useState('');

  const handleSave = () => {
    if (!url || !key) {
      setStatus('Vui lòng điền đủ URL và API Key!');
      return;
    }
    
    const success = reinitSupabase(url, key);
    if (success) {
      setStatus('Kết nối và lưu cấu hình thành công! Hãy tải lại trang để áp dụng.');
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setStatus('Có lỗi khi khởi tạo kết nối. Kiểm tra URL/Key.');
    }
  };

  return (
    <div className="settings-page">
      <div className="card" style={{ borderTop: '4px solid var(--accent)' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Database size={24} /> Cấu hình Cơ Sở Dữ Liệu (Cloud DB)
        </h2>
        
        <div style={{ marginBottom: '20px', background: 'rgba(59, 130, 246, 0.1)', padding: '15px', borderRadius: '8px', color: '#60a5fa' }}>
          <AlertCircle size={18} style={{ float: 'left', marginRight: '10px' }} />
          Do Database là thông tin cá nhân bảo mật, Web App này cho phép bạn mang Database Supabase của riêng bạn tới. Dữ liệu tập luyện sẽ được lưu KHÔNG GIỚI HẠN lên mây miễn phí!
        </div>

        <div className="input-group">
          <label>Supabase Project URL</label>
          <input 
            type="text" 
            placeholder="https://xxxxxx.supabase.co" 
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>Supabase anon public API Key</label>
          <input 
            type="password" 
            placeholder="eyJhbGciOiJIUzI1NiIsInR5c..." 
            value={key}
            onChange={e => setKey(e.target.value)}
          />
        </div>

        {status && <div style={{ color: status.includes('thành công') ? 'var(--success)' : 'var(--danger)', marginBottom: '15px', fontWeight: '500' }}>{status}</div>}

        <button className="btn btn-primary" onClick={handleSave}>
          Lưu & Kết Nối
        </button>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '15px' }}>Hướng dẫn 3 phút cài đặt Supabase (Miễn phí 100%)</h3>
        <ol style={{ marginLeft: '20px', color: 'var(--text-muted)' }}>
          <li style={{ marginBottom: '10px' }}>Vào <a href="https://supabase.com" target="_blank" style={{ color: 'var(--accent)' }}>supabase.com</a> và bấm <strong>Start your project</strong>. Đăng nhập bằng Google/GitHub.</li>
          <li style={{ marginBottom: '10px' }}>Tạo <strong>New Project</strong>. Đặt tên là `Gym Tracker`. Mật khẩu tuỳ ý. Chọn Region `Singapore` cho nhanh. Bấm <strong>Create</strong>.</li>
          <li style={{ marginBottom: '10px' }}>Chờ 1-2 phút Supabase setup. Xong, ở màn hình chính, cuộn xuống phần <strong>Project API</strong>.</li>
          <li style={{ marginBottom: '10px' }}>Copy <strong>Project URL</strong> và dán vào ô bên trên.</li>
          <li style={{ marginBottom: '10px' }}>Copy <strong>anon public API Key</strong> và dán vào ô bên trên. Rồi nhấn <strong>Lưu & Kết Nối</strong>.</li>
          <li style={{ marginBottom: '10px' }}>
            <span style={{ color: '#fff', fontWeight: 'bold' }}>BƯỚC CHÓT QUAN TRỌNG:</span> Ở menu trái của Supabase, chọn <strong>SQL Editor</strong> {'->'} Bấm nút lệnh <strong>New Query</strong>.
            <br />Copy cục mã dưới đây và dán vào, sau đó ấn <strong>Run</strong> để hệ thống tự tạo chỗ trống lưu dữ liệu cho bạn:
            <pre style={{ background: '#000', color: '#10b981', padding: '10px', marginTop: '10px', borderRadius: '4px', fontSize: '0.8rem', overflow: 'auto' }}>
{`create table workout_history (
  id uuid default gen_random_uuid() primary key,
  date timestamptz not null,
  day_id text not null,
  workout_name text not null,
  data jsonb not null
);`}
            </pre>
          </li>
        </ol>
      </div>
      
      <div className="card" style={{ marginTop: '20px' }}>
        <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LinkIcon size={20} /> Về việc Deploy lên mạng (Vercel)
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Hiện tại Web App đang chạy cục bộ (Local). Bạn có thể mở thư mục `Desktop/gym/gym-app` bằng Terminal, gõ `npm run build`, và sau đó đẩy toàn bộ thư mục đó lên kho lưu trữ GitHub của bạn. Sau đó đăng nhập Vercel.com, Import repo GitHub đó là bạn đã có 1 link web cho riêng mình trọn đời! 🚀
        </p>
      </div>
    </div>
  );
}
