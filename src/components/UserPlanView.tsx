'use client';

import React, { useState, useEffect } from 'react';
import { getTrainingPlan } from '@/services/workoutActions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyType = any;

interface UserPlanViewProps {
    planId: string;
}

export default function UserPlanView({ planId }: UserPlanViewProps) {
    const [plan, setPlan] = useState<AnyType | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeWeekIdx, setActiveWeekIdx] = useState(0);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const data = await getTrainingPlan(planId);
            setPlan(data);
            setLoading(false);
        }
        if (planId) load();
    }, [planId]);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando tu entrenamiento...</div>;
    if (!plan) return <div style={{ padding: '2rem', textAlign: 'center' }}>No se pudo cargar el plan de entrenamiento.</div>;

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
                            <div key={session.id} style={sessionCardStyle}>
                                <h3 style={sessionTitleStyle}>{session.name}</h3>
                                {session.routines.map((routine: AnyType) => (
                                    <div key={routine.id} style={routineBoxStyle}>
                                        <h4 style={routineTitleStyle}>{routine.name}</h4>
                                        <div style={exerciseListStyle}>
                                            {routine.exercises.map((item: AnyType) => (
                                                <div key={item.id} style={exerciseItemStyle}>
                                                    <div style={exerciseNameStyle}>{item.exercise?.name}</div>
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
