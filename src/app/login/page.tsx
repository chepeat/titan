'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        console.log('Intentando login para:', email);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error('Error de login Supabase:', error.message);
            setError(error.message);
            setLoading(false);
        } else {
            console.log('Login exitoso:', data.user?.email);
            router.push('/');
            router.refresh();
        }
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <h1 style={titleStyle}>Titan Club</h1>
                <p style={subtitleStyle}>Inicia sesión para entrenar</p>

                <form onSubmit={handleLogin} style={formStyle}>
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={inputStyle}
                            placeholder="tu@email.com"
                        />
                    </div>
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={inputStyle}
                            placeholder="••••••••"
                        />
                    </div>

                    {error && <p style={errorStyle}>{error}</p>}

                    <button type="submit" disabled={loading} style={buttonStyle}>
                        {loading ? 'Cargando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
}

const containerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    color: '#fff',
    fontFamily: 'sans-serif'
};

const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '400px',
    padding: '2.5rem',
    borderRadius: '16px',
    backgroundColor: '#111',
    border: '1px solid #222',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
};

const titleStyle: React.CSSProperties = {
    fontSize: '2rem',
    textAlign: 'center',
    marginBottom: '0.5rem',
    background: 'linear-gradient(45deg, #ff4d4d, #f9cb28)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight: '800'
};

const subtitleStyle: React.CSSProperties = {
    textAlign: 'center',
    color: '#666',
    marginBottom: '2rem'
};

const formStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
};

const inputGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
};

const labelStyle: React.CSSProperties = {
    fontSize: '0.9rem',
    color: '#888'
};

const inputStyle: React.CSSProperties = {
    padding: '0.8rem 1rem',
    borderRadius: '8px',
    backgroundColor: '#000',
    border: '1px solid #333',
    color: '#fff',
    fontSize: '1rem'
};

const buttonStyle: React.CSSProperties = {
    padding: '1rem',
    borderRadius: '8px',
    backgroundColor: '#ff4d4d',
    color: '#fff',
    border: 'none',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    marginTop: '0.5rem'
};

const errorStyle: React.CSSProperties = {
    color: '#ff4d4d',
    fontSize: '0.85rem',
    textAlign: 'center'
};
