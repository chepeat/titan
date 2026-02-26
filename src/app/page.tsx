import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import AdminDashboard from '@/components/AdminDashboard';
import { logout } from '@/services/authActions';

export default function Home() {
  return (
    <main style={{ padding: '2rem', backgroundColor: '#000', color: '#fff', minHeight: '100vh' }}>
      <h1>Titan Club - Debug Mode</h1>
      <p>Si ves esto, el sistema de rutas de Next.js funciona perfectamente.</p>
    </main>
  );
}

const containerStyle: React.CSSProperties = {
  padding: '2rem',
  fontFamily: 'sans-serif',
  backgroundColor: '#0a0a0a',
  color: '#fff',
  minHeight: '100vh',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2rem',
  paddingBottom: '1rem',
  borderBottom: '1px solid #222'
};

const titleStyle: React.CSSProperties = {
  color: '#ff4d4d',
  margin: 0,
  fontSize: '1.5rem'
};

const logoutButtonStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid #444',
  color: '#888',
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.9rem'
};

const placeholderStyle: React.CSSProperties = {
  marginTop: '5rem',
  padding: '3rem',
  border: '1px dashed #333',
  borderRadius: '16px',
  textAlign: 'center',
  backgroundColor: '#111'
};
