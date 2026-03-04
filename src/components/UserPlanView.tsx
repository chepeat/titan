'use client';

import React, { useState, useEffect } from 'react';
import { getTrainingPlan } from '@/services/workoutActions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyType = any;

interface UserPlanViewProps {
    planId: string;
    userId: string;
}

export default function UserPlanView({ planId, userId }: UserPlanViewProps) {
    const [plan, setPlan] = useState<AnyType | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeWeekIdx, setActiveWeekIdx] = useState(0);
    const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const data = await getTrainingPlan(planId, userId);
            setPlan(data);
            setLoading(false);
        }
        if (planId && userId) load();
    }, [planId, userId]);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando tu entrenamiento...</div>;
    if (!plan) return <div style={{ padding: '2rem', textAlign: 'center' }}>No se pudo cargar el plan de entrenamiento.</div>;

    const handleToggleCompletion = async (sessionId: string, currentStatus: boolean) => {
        // Optimistic update
        const newPlan = { ...plan };
        newPlan.weeks[activeWeekIdx].sessions = newPlan.weeks[activeWeekIdx].sessions.map((s: AnyType) => {
            if (s.id === sessionId) return { ...s, isCompleted: !currentStatus };
            return s;
        });
        setPlan(newPlan);

        const { toggleSessionCompletion } = await import('@/services/workoutActions');
        const res = await toggleSessionCompletion(sessionId, !currentStatus);
        if (!res.success) {
            alert('Error al guardar progreso: ' + res.error);
            // Rollback (re-fetch is better)
            const data = await getTrainingPlan(planId, userId);
            setPlan(data);
        }
    };

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <h2 style={titleStyle}>{plan.name}</h2>
                <p style={descStyle}>{plan.description || 'Tu plan personalizado'}</p>
            </div>

            {/* Week Selector */}
            <div style={weekSelectorStyle}>
                {plan.weeks.map((week: AnyType, idx: number) => (
                    <button
                        key={week.id}
                        onClick={() => setActiveWeekIdx(idx)}
                        style={{
                            ...weekButtonStyle,
                            backgroundColor: activeWeekIdx === idx ? '#ff4d4d' : '#222',
                            color: activeWeekIdx === idx ? '#fff' : '#888',
                        }}
                    >
                        Semana {week.number}
                    </button>
                ))}
            </div>

            {/* Active Week Content */}
            <div style={weekBodyStyle}>
                {plan.weeks[activeWeekIdx]?.sessions.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No hay sesiones configuradas para esta semana.</p>
                ) : (
                    <div style={sessionsGridStyle}>
                        {plan.weeks[activeWeekIdx].sessions.map((session: AnyType) => (
                            <div key={session.id} style={{
                                ...sessionCardStyle,
                                borderColor: session.isCompleted ? '#4ade80' : '#333',
                                backgroundColor: session.isCompleted ? 'rgba(74, 222, 128, 0.05)' : '#0a0a0a',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #222', paddingBottom: '0.75rem' }}>
                                    <h3 style={{ ...sessionTitleStyle, borderBottom: 'none', margin: 0, paddingBottom: 0 }}>
                                        {session.name}
                                        {session.isCompleted && <span style={{ marginLeft: '8px', fontSize: '0.9rem' }}>✅</span>}
                                    </h3>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: session.isCompleted ? '#4ade80' : '#888' }}>
                                        <input
                                            type="checkbox"
                                            checked={!!session.isCompleted}
                                            onChange={() => handleToggleCompletion(session.id, !!session.isCompleted)}
                                            style={{ cursor: 'pointer', accentColor: '#4ade80', width: '18px', height: '18px' }}
                                        />
                                        Hecho
                                    </label>
                                </div>
                                {session.routines.map((routine: AnyType) => (
                                    <div key={routine.id} style={routineBoxStyle}>
                                        <h4 style={routineTitleStyle}>{routine.name}</h4>
                                        <div style={exerciseListStyle}>
                                            {routine.exercises.map((item: AnyType) => (
                                                <div key={item.id} style={exerciseItemStyle}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <div style={exerciseNameStyle}>{item.exercise?.name}</div>
                                                        {item.exercise?.videoFile && (
                                                            <button
                                                                onClick={() => setActiveVideoUrl(item.exercise.videoFile)}
                                                                style={videoIconButtonStyle}
                                                                title="Ver vídeo de ejecución"
                                                            >
                                                                📹 Vídeo
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div style={exerciseDetailsStyle}>
                                                        <span>{item.series} series</span>
                                                        <span>•</span>
                                                        <span style={{ color: '#ff4d4d' }}>
                                                            {Array.isArray(item.reps) ? item.reps.join(' - ') : item.reps} reps
                                                        </span>
                                                        <span>•</span>
                                                        <span>{item.restingTime}s descanso</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Video Modal */}
            {activeVideoUrl && (
                <div style={modalOverlayStyle} onClick={() => setActiveVideoUrl(null)}>
                    <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
                        <button style={closeButtonStyle} onClick={() => setActiveVideoUrl(null)}>✕</button>
                        <h3 style={{ margin: '0 0 15px 0', color: '#fff', fontSize: '1.2rem' }}>Demostración del Ejercicio</h3>
                        <video
                            src={activeVideoUrl}
                            controls
                            autoPlay
                            playsInline
                            style={videoPlayerStyle}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

const containerStyle: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '1rem',
};

const headerStyle: React.CSSProperties = {
    marginBottom: '2rem',
    textAlign: 'center',
};

const titleStyle: React.CSSProperties = {
    fontSize: '2rem',
    color: '#fff',
    margin: '0 0 0.5rem 0',
};

const descStyle: React.CSSProperties = {
    color: '#888',
    fontSize: '1.1rem',
    margin: 0,
};

const weekSelectorStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.5rem',
    overflowX: 'auto',
    paddingBottom: '1rem',
    marginBottom: '2rem',
    justifyContent: 'center',
};

const weekButtonStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
};

const weekBodyStyle: React.CSSProperties = {
    backgroundColor: '#111',
    borderRadius: '16px',
    padding: '2rem',
    border: '1px solid #222',
};

const sessionsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
};

const sessionCardStyle: React.CSSProperties = {
    backgroundColor: '#0a0a0a',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid #333',
};

const sessionTitleStyle: React.CSSProperties = {
    color: '#ff4d4d',
    margin: '0 0 1.5rem 0',
    fontSize: '1.4rem',
    borderBottom: '1px solid #222',
    paddingBottom: '0.75rem',
};

const routineBoxStyle: React.CSSProperties = {
    marginBottom: '1.5rem',
};

const routineTitleStyle: React.CSSProperties = {
    fontSize: '1rem',
    color: '#fff',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
};

const exerciseListStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
};

const exerciseItemStyle: React.CSSProperties = {
    padding: '10px',
    backgroundColor: '#161616',
    borderRadius: '8px',
    borderLeft: '3px solid #ff4d4d',
};

const exerciseNameStyle: React.CSSProperties = {
    fontWeight: 'bold',
    marginBottom: '4px',
    fontSize: '0.95rem',
};

const exerciseDetailsStyle: React.CSSProperties = {
    fontSize: '0.8rem',
    color: '#666',
    display: 'flex',
    gap: '8px',
};

const videoIconButtonStyle: React.CSSProperties = {
    background: 'rgba(255, 77, 77, 0.1)',
    border: '1px solid #ff4d4d',
    color: '#ff4d4d',
    borderRadius: '4px',
    padding: '2px 8px',
    fontSize: '0.75rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s',
};

const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '1rem',
    backdropFilter: 'blur(5px)',
};

const modalContentStyle: React.CSSProperties = {
    backgroundColor: '#111',
    borderRadius: '16px',
    padding: '20px',
    maxWidth: '800px',
    width: '100%',
    position: 'relative',
    border: '1px solid #333',
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
};

const closeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '15px',
    right: '15px',
    background: '#222',
    border: '1px solid #444',
    color: '#fff',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
};

const videoPlayerStyle: React.CSSProperties = {
    width: '100%',
    borderRadius: '8px',
    backgroundColor: '#000',
    maxHeight: '70vh',
};
