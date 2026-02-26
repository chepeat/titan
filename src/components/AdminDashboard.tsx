'use client';

import { useState, useEffect } from 'react';
import { createUser, getUsers } from '@/services/userActions';

export default function AdminDashboard() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    const fetchUsers = async () => {
        const data = await getUsers();
        setUsers(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const result = await createUser(formData);

        if (result.success) {
            setMessage('Usuario creado con éxito');
            e.currentTarget.reset();
            fetchUsers();
        } else {
            setMessage('Error: ' + result.error);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', color: '#fff', textAlign: 'left' }}>
            <h2 style={{ color: '#ff4d4d', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                Panel de Administración - Gestión de Usuarios
            </h2>

            {/* Formulario de Alta */}
            <section style={sectionStyle}>
                <h3>Nuevo Registro</h3>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
                    <div>
                        <label style={labelStyle}>Email:</label>
                        <input type="email" name="email" required style={inputStyle} placeholder="ejemplo@titan.com" />
                    </div>
                    <div>
                        <label style={labelStyle}>Nombre:</label>
                        <input type="text" name="name" style={inputStyle} placeholder="Nombre completo" />
                    </div>
                    <div>
                        <label style={labelStyle}>Rol:</label>
                        <select name="role" style={inputStyle} required>
                            <option value="COACH">Entrenador</option>
                            <option value="USER">Socio</option>
                            <option value="ADMIN">Administrador</option>
                        </select>
                    </div>
                    <button type="submit" style={buttonStyle}>Dar de alta</button>
                </form>
                {message && <p style={{ marginTop: '10px', color: message.includes('Error') ? '#ff4d4d' : '#4caf50' }}>{message}</p>}
            </section>

            {/* Lista de Usuarios */}
            <section style={sectionStyle}>
                <h3>Listado de Cuentas</h3>
                {loading ? <p>Cargando...</p> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #333' }}>
                                <th style={thStyle}>Nombre</th>
                                <th style={thStyle}>Email</th>
                                <th style={thStyle}>Rol</th>
                                <th style={thStyle}>Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} style={{ borderBottom: '1px solid #222' }}>
                                    <td style={tdStyle}>{user.name || '-'}</td>
                                    <td style={tdStyle}>{user.email}</td>
                                    <td style={tdStyle}>
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem',
                                            backgroundColor: user.role === 'ADMIN' ? '#ff4d4d' : user.role === 'COACH' ? '#4caf50' : '#2196f3'
                                        }}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>{new Date(user.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
}

const sectionStyle = {
    backgroundColor: '#1a1a1a',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
    border: '1px solid #333'
};

const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontSize: '0.9rem',
    color: '#888'
};

const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #333',
    backgroundColor: '#000',
    color: '#fff',
    boxSizing: 'border-box' as const
};

const buttonStyle = {
    backgroundColor: '#ff4d4d',
    color: '#fff',
    padding: '12px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '10px'
};

const thStyle = {
    textAlign: 'left' as const,
    padding: '12px',
    color: '#888',
    fontSize: '0.9rem'
};

const tdStyle = {
    padding: '12px',
    fontSize: '0.9rem'
};
