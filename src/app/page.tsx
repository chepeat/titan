import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import AdminDashboard from '@/components/AdminDashboard';
import TrainerDashboard from '@/components/TrainerDashboard';
import { logout } from '@/services/authActions';
import UserPlanView from '@/components/UserPlanView';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null; // El middleware se encarga de la redirección
  }

  // Buscar el rol del usuario en nuestra base de datos Prisma
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
  });

  if (!dbUser) {
    return (
      <main style={containerStyle}>
        <h1>Acceso Denegado</h1>
        <p>Tu correo ({user.email}) no está registrado en el sistema de Titan Club.</p>
        <form action={logout}>
          <button type="submit" style={logoutButtonStyle}>Cerrar Sesión</button>
        </form>
      </main>
    );
  }

  return (
    <main style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>Titan Club - {dbUser.role}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#888' }}>{dbUser.name || dbUser.email}</span>
          <form action={logout}>
            <button type="submit" style={logoutButtonStyle}>Salir</button>
          </form>
        </div>
      </header>

      {dbUser.role === 'ADMIN' && <AdminDashboard />}
      {dbUser.role === 'COACH' && <TrainerDashboard coachId={dbUser.id} />}
      {dbUser.role === 'USER' && (
        <div style={{ marginTop: '2rem' }}>
          {dbUser.trainingPlanId ? (
            <UserPlanView planId={dbUser.trainingPlanId} userId={dbUser.id} />
          ) : (
            <div style={placeholderStyle}>
              <h2>¡Bienvenido, Titan!</h2>
              <p>Tu entrenador todavía no te ha asignado un plan. En cuanto lo haga, aparecerá aquí.</p>
            </div>
          )}
        </div>
      )}
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
