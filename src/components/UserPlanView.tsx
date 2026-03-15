'use client';

import React, { useState, useEffect } from 'react';
import { getTrainingPlan, getExerciseLogs, getExercises } from '@/services/workoutActions';
import RoutineDetailView from './RoutineDetailView';

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
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

    // Navigation state for Routine Detail
    const [activeSession, setActiveSession] = useState<AnyType | null>(null);
    const [activeRoutineIdx, setActiveRoutineIdx] = useState<number | null>(null);
    const [currentLogs, setCurrentLogs] = useState<AnyType[]>([]);
    const [warmupExercises, setWarmupExercises] = useState<AnyType[]>([]);
    const [stretchExercises, setStretchExercises] = useState<AnyType[]>([]);
    const [extraView, setExtraView] = useState<'WARMUP' | 'STRETCH' | null>(null);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const [planData, allExercises] = await Promise.all([
                getTrainingPlan(planId, userId),
                getExercises()
            ]);
            setPlan(planData);
            if (Array.isArray(allExercises)) {
                setWarmupExercises(allExercises.filter((ex: { type: string }) => ex.type === 'WARMUP'));
                setStretchExercises(allExercises.filter((ex: { type: string }) => ex.type === 'STRETCH'));
            }
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

    const handleStartRoutine = async (session: AnyType, routineIdx: number) => {
        const logs = await getExerciseLogs(userId, session.id);
        setCurrentLogs(logs);
        setActiveSession(session);
        setActiveRoutineIdx(routineIdx);
    };

    const handleNextRoutine = async () => {
        if (!activeSession) return;

        if (activeRoutineIdx !== null && activeRoutineIdx < activeSession.routines.length - 1) {
            setActiveRoutineIdx(activeRoutineIdx + 1);
            window.scrollTo(0, 0);
        } else {
            // Last routine finished
            if (!activeSession.isCompleted) {
                await handleToggleCompletion(activeSession.id, false);
            }
            setActiveRoutineIdx(null);
            setActiveSession(null);
        }
    };

    const getEmbedUrl = (url: string) => {
        if (!url) return null;
        if (url.includes('youtube.com/embed/')) return url;
        let videoId = '';
        if (url.includes('youtube.com/watch?v=')) {
            videoId = url.split('v=')[1]?.split('&')[0];
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1]?.split('?')[0];
        }
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
        return url;
    };

    const isExternalUrl = (url: string | null) => {
        if (!url) return false;
        return url.startsWith('http') && (url.includes('youtube.com') || url.includes('youtu.be'));
    };

    if (activeSession && activeRoutineIdx !== null) {
        return (
            <RoutineDetailView
                sessionId={activeSession.id}
                userId={userId}
                routine={activeSession.routines[activeRoutineIdx]}
                initialLogs={currentLogs}
                onNext={handleNextRoutine}
                onBack={() => {
                    setActiveRoutineIdx(null);
                    setActiveSession(null);
                }}
                isLastRoutine={activeRoutineIdx === activeSession.routines.length - 1}
            />
        );
    }

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <h2 style={titleStyle}>{plan.name}</h2>
                <p style={descStyle}>{plan.description || 'Tu plan personalizado'}</p>
            </div>

            {/* Week Selector */}
            {!selectedSessionId && (
                <div style={weekSelectorStyle}>
                    {plan.weeks.map((week: AnyType, idx: number) => (
                        <button
                            key={week.id}
                            onClick={() => {
                                setActiveWeekIdx(idx);
                                setSelectedSessionId(null);
                            }}
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
            )}

            {/* Active Week Content */}
            <div style={weekBodyStyle}>
                {plan.weeks[activeWeekIdx]?.sessions.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No hay sesiones configuradas para esta semana.</p>
                ) : selectedSessionId ? (
                    // DETAIL VIEW
                    (() => {
                        const session = plan.weeks[activeWeekIdx].sessions.find((s: AnyType) => s.id === selectedSessionId);
                        if (!session) return null;
                        return (
                            <div>
                                <button
                                    onClick={() => setSelectedSessionId(null)}
                                    style={backButtonStyle}
                                >
                                    ← Volver a las semanas
                                </button>
                                <div style={{
                                    ...sessionCardStyle,
                                    borderColor: session.isCompleted ? '#4ade80' : '#333',
                                    backgroundColor: session.isCompleted ? 'rgba(74, 222, 128, 0.05)' : '#0a0a0a',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #222', paddingBottom: '0.75rem' }}>
                                        <h3 style={{ ...sessionTitleStyle, borderBottom: 'none', margin: 0, paddingBottom: 0 }}>
                                            {session.name}
                                        </h3>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: session.isCompleted ? '#4ade80' : '#888' }}>
                                            <input
                                                type="checkbox"
                                                checked={!!session.isCompleted}
                                                onChange={() => handleToggleCompletion(session.id, !!session.isCompleted)}
                                                style={{ cursor: 'pointer', accentColor: '#4ade80', width: '18px', height: '18px' }}
                                            />
                                        </label>
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
                                        <button 
                                            onClick={() => setExtraView('WARMUP')}
                                            style={{ ...extraButtonStyle, backgroundColor: '#4a90e2' }}
                                        >
                                            🔥 Calentamiento
                                        </button>
                                        <button 
                                            onClick={() => setExtraView('STRETCH')}
                                            style={{ ...extraButtonStyle, backgroundColor: '#f5a623' }}
                                        >
                                            🧘 Estiramientos
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => handleStartRoutine(session, 0)}
                                        style={startSessionButtonStyle}
                                    >
                                        {session.isCompleted ? 'Repetir Entrenamiento' : 'Comenzar Entrenamiento'}
                                    </button>

                                    {session.routines.map((routine: AnyType, rIdx: number) => (
                                        <div key={routine.id} style={routineBoxStyle}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <h4 style={{ ...routineTitleStyle, margin: 0 }}>{routine.name}</h4>
                                                <button
                                                    onClick={() => handleStartRoutine(session, rIdx)}
                                                    style={startRoutineSmallButtonStyle}
                                                >
                                                    Ir a rutina
                                                </button>
                                            </div>
                                            <div style={exerciseListStyle}>
                                                {routine.exercises.map((item: AnyType) => {
                                                    return (
                                                        <div key={item.id} style={exerciseItemStyle}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                                <div style={exerciseNameStyle}>{item.exercise?.name}</div>
                                                                {(item.machine?.number || item.exercise?.machines?.[0]?.number) && (
                                                                    <div style={prominentMachineBadgeStyle}>
                                                                        MÁQUINA {item.machine?.number || item.exercise.machines[0].number}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <div style={exerciseDetailsStyle}>
                                                                    <span>{item.series} series</span>
                                                                    <span>•</span>
                                                                    <span>{Array.isArray(item.reps) ? item.reps.join('-') : item.reps} reps</span>
                                                                    <span>•</span>
                                                                    <span>{item.restingTime}s desc.</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()
                ) : (
                    // LIST VIEW
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {plan.weeks[activeWeekIdx].sessions.map((session: AnyType) => (
                            <div key={session.id} style={{
                                ...sessionCardStyle,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1.5rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                borderColor: session.isCompleted ? '#4ade80' : '#333',
                                backgroundColor: session.isCompleted ? 'rgba(74, 222, 128, 0.05)' : '#161616',
                            }} onClick={() => setSelectedSessionId(session.id)}>
                                <div>
                                    <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', color: session.isCompleted ? '#a7f3d0' : '#fff' }}>
                                        {session.name}
                                    </h3>
                                    <span style={{ fontSize: '0.85rem', color: session.isCompleted ? '#4ade80' : '#888' }}>
                                        {session.isCompleted ? '✅ Completada' : '⏳ Pendiente'}
                                    </span>
                                </div>
                                <div style={{ color: '#ff4d4d', fontWeight: 'bold' }}>
                                    Ver ➔
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Extra View Modal (Warmup/Stretch) */}
            {extraView && (
                <div style={modalOverlayStyle} onClick={() => setExtraView(null)}>
                    <div style={{ ...modalContentStyle, maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                        <button style={closeButtonStyle} onClick={() => setExtraView(null)}>✕</button>
                        <h3 style={{ ...sessionTitleStyle, borderBottom: '1px solid #333', marginBottom: '20px' }}>
                            {extraView === 'WARMUP' ? 'Calentamiento' : 'Estiramientos'}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '10px' }}>
                            {(extraView === 'WARMUP' ? warmupExercises : stretchExercises).map((ex: AnyType) => (
                                <div key={ex.id} style={{ ...exerciseItemStyle, cursor: 'default' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={exerciseNameStyle}>{ex.name}</div>
                                        {(ex.videoFile || ex.videoUrl) && (
                                            <button 
                                                onClick={() => setActiveVideoUrl(ex.videoFile || ex.videoUrl)}
                                                style={videoIconButtonStyle}
                                            >
                                                📹 Ver vídeo
                                            </button>
                                        )}
                                    </div>
                                    {ex.description && <p style={{ ...exerciseDetailsStyle, margin: '4px 0' }}>{ex.description}</p>}
                                    {ex.machines?.length > 0 && (
                                        <div style={{ fontSize: '0.75rem', color: '#ff4d4d', marginTop: '4px' }}>
                                            📍 Máquina {ex.machines[0].number}: {ex.machines[0].description}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {(extraView === 'WARMUP' ? warmupExercises : stretchExercises).length === 0 && (
                                <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                                    No hay ejercicios de {extraView === 'WARMUP' ? 'calentamiento' : 'estiramiento'} cargados.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Video Modal */}
            {activeVideoUrl && (
                <div style={modalOverlayStyle} onClick={() => setActiveVideoUrl(null)}>
                    <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
                        <button style={closeButtonStyle} onClick={() => setActiveVideoUrl(null)}>✕</button>
                        <h3 style={{ margin: '0 0 15px 0', color: '#fff', fontSize: '1.2rem' }}>Demostración del Ejercicio</h3>
                        {isExternalUrl(activeVideoUrl) ? (
                            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '8px' }}>
                                <iframe
                                    src={getEmbedUrl(activeVideoUrl) || ''}
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        ) : (
                            <video
                                src={activeVideoUrl}
                                controls
                                autoPlay
                                playsInline
                                style={videoPlayerStyle}
                            />
                        )}
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
    flexWrap: 'wrap',
    gap: '0.5rem',
    paddingBottom: '1rem',
    marginBottom: '2rem',
    justifyContent: 'center',
};

const weekButtonStyle: React.CSSProperties = {
    flex: '1 1 calc(50% - 0.5rem)',
    minWidth: '120px',
    maxWidth: '200px',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
    textAlign: 'center',
};

const backButtonStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    color: '#ff4d4d',
    border: '1px solid #ff4d4d',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '1.5rem',
    fontWeight: 'bold',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
};

const weekBodyStyle: React.CSSProperties = {
    padding: '1rem 0',
};

const sessionsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
    justifyContent: 'center',
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
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
};

const prominentMachineBadgeStyle: React.CSSProperties = {
    backgroundColor: '#ff4d4d',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: '900',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
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

const startSessionButtonStyle: React.CSSProperties = {
    width: '100%',
    padding: '1.25rem',
    backgroundColor: '#ff4d4d',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: '2rem',
    fontSize: '1.3rem',
    transition: 'all 0.2s',
    boxShadow: '0 6px 20px rgba(255, 77, 77, 0.3)',
};

const startRoutineSmallButtonStyle: React.CSSProperties = {
    padding: '8px 16px',
    backgroundColor: '#333',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    cursor: 'pointer',
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
const extraButtonStyle: React.CSSProperties = {
    flex: 1,
    padding: '10px',
    borderRadius: '10px',
    border: 'none',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
};
