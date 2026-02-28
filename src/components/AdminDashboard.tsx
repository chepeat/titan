'use client';

import { useState, useEffect } from 'react';
import { createUser, getUsers, updateUserRole, resetUserPassword } from '@/services/userActions';
import { Role } from '@prisma/client';

interface User {
    id: string;
    name: string | null;
    email: string;
    role: Role;
    createdAt: Date;
}

export default function AdminDashboard() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [newPass, setNewPass] = useState('');

    const fetchUsers = async () => {
        const data = await getUsers();
        setUsers(data as User[]);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage('');
        setNewPass('');
        const formData = new FormData(e.currentTarget);
        const result = await createUser(formData);

        if (result.success) {
            setMessage('Usuario creado con éxito');
            setNewPass(result.password || '');
            e.currentTarget.reset();
            fetchUsers();
        } else {
            setMessage('Error: ' + result.error);
        }
    };

    const handleRoleChange = async (userId: string, newRole: Role) => {
        const result = await updateUserRole(userId, newRole);
        if (result.success) {
            fetchUsers();
        } else {
            alert('Error al actualizar rol: ' + result.error);
        }
    };

    const handleResetPassword = async (userId: string) => {
        if (!confirm('¿Estás seguro de resetear la contraseña?')) return;
        const result = await resetUserPassword(userId);
        if (result.success) {
            setNewPass(result.password || '');
            setMessage('Contraseña reseteada con éxito');
        } else {
            alert('Error al resetear contraseña: ' + result.error);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', color: '#fff', textAlign: 'left' }}>
            <h2 style={{ color: '#ff4d4d', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                Panel de Administración - Gestión de Usuarios
            </h2>

            {/* Alerta de Contraseña Generada */}
            {(newPass || message) && (
                <div style={{
                    backgroundColor: message.includes('Error') ? '#421a1a' : '#1a421a',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: `1px solid ${message.includes('Error') ? '#ff4d4d' : '#4caf50'}`
                }}>
                    <p style={{ margin: 0 }}>{message}</p>
                    {newPass && (
                        <p style={{ marginTop: '10px', fontSize: '1.1rem' }}>
                            Contraseña temporal: <strong style={{ color: '#fff', backgroundColor: '#333', padding: '2px 6px', borderRadius: '4px' }}>{newPass}</strong>
                        </p>
                    )}
                </div>
            )}

            {/* Formulario de Alta */}
            <section style={sectionStyle}>
                <h3>Nuevo Registro</h3>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '15px', alignItems: 'end' }}>
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
                        <select name="role" style={inputStyle} required defaultValue="USER">
                            <option value="COACH">Entrenador</option>
                            <option value="USER">Socio</option>
                            <option value="ADMIN">Administrador</option>
                        </select>
                    </div>
                    <button type="submit" style={buttonStyle}>Dar de alta</button>
                </form>
            </section>

            {/* Lista de Usuarios */}
            <section style={sectionStyle}>
                <h3>Listado de Cuentas</h3>
                {loading ? <p>Cargando...</p> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #333' }}>
                                <th style={thStyle}>Nombre/Email</th>
                                <th style={thStyle}>Rol Actual</th>
                                <th style={thStyle}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} style={{ borderBottom: '1px solid #222' }}>
                                    <td style={tdStyle}>
                                        <div>{user.name || '-'}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{user.email}</div>
                                    </td>
                                    <td style={tdStyle}>
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                                            style={{ ...inputStyle, width: 'auto', padding: '5px' }}
                                        >
                                            <option value="COACH">COACH</option>
                                            <option value="USER">USER</option>
                                            <option value="ADMIN">ADMIN</option>
                                        </select>
                                    </td>
                                    <td style={tdStyle}>
                                        <button
                                            onClick={() => handleResetPassword(user.id)}
                                            style={{ ...buttonStyle, backgroundColor: '#333', padding: '5px 10px', fontSize: '0.8rem', marginTop: 0 }}
                                        >
                                            Reset Password
                                        </button>
                                    </td>
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
    fontSize: '0.8rem',
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
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold' as const
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
