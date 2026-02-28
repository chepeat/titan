'use client';

import { useState } from 'react';
import { changePassword } from '@/services/userActions';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (password !== confirmPass) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        const result = await changePassword(password);

        if (result.success) {
            alert('Contraseña actualizada con éxito');
            router.push('/');
            router.refresh();
        } else {
            setError(result.error || 'Error al actualizar contraseña');
            setLoading(false);
        }
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <h1 style={titleStyle}>Actualizar Contraseña</h1>
                <p style={subtitleStyle}>Por seguridad, debes cambiar tu contraseña temporal antes de continuar.</p>

                <form onSubmit={handleReset} style={formStyle}>
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Nueva Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={inputStyle}
                            placeholder="••••••••"
                        />
                    </div>
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Confirmar Contraseña</label>
                        <input
                            type="password"
                            value={confirmPass}
                            onChange={(e) => setConfirmPass(e.target.value)}
                            required
                            style={inputStyle}
                            placeholder="••••••••"
                        />
                    </div>

                    {error && <p style={errorStyle}>{error}</p>}

                    <button type="submit" disabled={loading} style={buttonStyle}>
                        {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
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
};

const titleStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    textAlign: 'center',
    marginBottom: '0.5rem',
    color: '#ff4d4d',
    fontWeight: '800'
};

const subtitleStyle: React.CSSProperties = {
    textAlign: 'center',
    color: '#888',
    marginBottom: '2rem',
    fontSize: '0.9rem'
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
    fontSize: '0.8rem',
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
};

const errorStyle: React.CSSProperties = {
    color: '#ff4d4d',
    fontSize: '0.85rem',
    textAlign: 'center'
};
