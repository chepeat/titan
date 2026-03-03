'use client';

import { useState, useEffect } from 'react';
import { getExercises, getRoutines, getSessionTemplates, getWeekTemplates, createTrainingPlan } from '@/services/workoutActions';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyType = any;

export default function WorkoutEditor({ coachId, planId }: { coachId: string; planId?: string }) {
    const router = useRouter();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [exercises, setExercises] = useState<AnyType[]>([]);
    const [catalogRoutines, setCatalogRoutines] = useState<AnyType[]>([]);
    const [catalogSessions, setCatalogSessions] = useState<AnyType[]>([]);
    const [catalogWeeks, setCatalogWeeks] = useState<AnyType[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [weeks, setWeeks] = useState<AnyType[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function load() {
            const [exData, routineData, sessionData, weekData] = await Promise.all([
                getExercises(),
                getRoutines(coachId),
                getSessionTemplates(coachId),
                getWeekTemplates(coachId)
            ]);
            setExercises(exData);
            setCatalogRoutines(routineData);
            setCatalogSessions(sessionData);
            setCatalogWeeks(weekData);

            if (planId) {
                const { getTrainingPlan } = await import('@/services/workoutActions');
                const plan = await getTrainingPlan(planId);
                if (plan) {
                    setName(plan.name);
                    setDescription(plan.description || '');
                    // Map existing structure to editor state
                    const mappedWeeks = plan.weeks.map((w: AnyType) => ({
                        id: w.id,
                        number: w.number,
                        sessions: w.sessions.map((s: AnyType) => ({
                            id: s.id,
                            name: s.name,
                            order: s.order,
                            routines: s.routines.map((r: AnyType) => ({
                                id: r.id,
                                name: r.name,
                                order: r.order,
                                exercises: r.exercises.map((e: AnyType) => ({
                                    id: e.id,
                                    exerciseId: e.exerciseId,
                                    exercise: e.exercise,
                                    series: e.series,
                                    reps: e.reps,
                                    restingTime: e.restingTime,
                                    order: e.order
                                }))
                            }))
                        }))
                    }));
                    setWeeks(mappedWeeks);
                }
            }

            setLoading(false);
        }
        load();
    }, [coachId, planId]);

    const handleSave = async () => {
        if (!name) {
            alert('Por favor, indica un nombre para el entrenamiento');
            return;
        }
        setSaving(true);

        const planData = {
            name,
            description,
            coachId,
            weeks
        };

        let res;
        if (planId) {
            const { updateTrainingPlan } = await import('@/services/workoutActions');
            res = await updateTrainingPlan(planId, planData);
        } else {
            res = await createTrainingPlan(planData);
        }

        setSaving(false);
        if (res.success) {
            router.push('/');
        } else {
            alert('Error: ' + res.error);
        }
    };

    const addWeek = () => {
        setWeeks([...weeks, { number: weeks.length + 1, sessions: [] }]);
    };

    const removeWeek = (weekIndex: number) => {
        const newWeeks = [...weeks];
        newWeeks.splice(weekIndex, 1);
        // Re-number weeks to maintain order
        const renumberedWeeks = newWeeks.map((w, idx) => ({
            ...w,
            number: idx + 1
        }));
        setWeeks(renumberedWeeks);
    };

    const addWeekTemplateToPlan = (weekTemplate: AnyType) => {
        const newWeek = {
            number: weeks.length + 1,
            sessions: weekTemplate.sessions.map((s: AnyType, sIdx: number) => ({
                name: s.name,
                order: sIdx,
                routines: s.routines.map((r: AnyType, rIdx: number) => ({
                    name: r.name,
                    order: rIdx,
                    exercises: r.exercises.map((e: AnyType, eIdx: number) => ({
                        exerciseId: e.exerciseId || e.exercise?.id,
                        exercise: e.exercise,
                        series: e.series,
                        reps: e.reps,
                        restingTime: e.restingTime,
                        order: eIdx
                    }))
                }))
            }))
        };
        setWeeks([...weeks, newWeek]);
    };

    const addSessionToWeek = (weekIndex: number) => {
        const newWeeks = [...weeks];
        newWeeks[weekIndex].sessions.push({
            name: `Sesión ${newWeeks[weekIndex].sessions.length + 1}`,
            order: newWeeks[weekIndex].sessions.length,
            routines: []
        });
        setWeeks(newWeeks);
    };


    const addRoutineToSession = (weekIndex: number, sessionIndex: number, routineTemplate: AnyType) => {
        const newWeeks = [...weeks];
        const newRoutine = {
            name: routineTemplate.name,
            order: newWeeks[weekIndex].sessions[sessionIndex].routines.length,
            exercises: routineTemplate.exercises.map((item: AnyType, idx: number) => ({
                exerciseId: item.exerciseId || item.exercise?.id,
                exercise: item.exercise,
                series: item.series,
                reps: item.reps,
                restingTime: item.restingTime,
                order: idx
            }))
        };
        newWeeks[weekIndex].sessions[sessionIndex].routines.push(newRoutine);
        setWeeks(newWeeks);
    };

    const addSessionTemplateToWeek = (weekIndex: number, sessionTemplate: AnyType) => {
        const newWeeks = [...weeks];
        const newSession = {
            name: sessionTemplate.name,
            order: newWeeks[weekIndex].sessions.length,
            routines: sessionTemplate.routines.map((r: AnyType, rIdx: number) => ({
                name: r.name,
                order: rIdx,
                exercises: r.exercises.map((e: AnyType, eIdx: number) => ({
                    exerciseId: e.exerciseId || e.exercise?.id,
                    exercise: e.exercise,
                    series: e.series,
                    reps: e.reps,
                    restingTime: e.restingTime,
                    order: eIdx
                }))
            }))
        };
        newWeeks[weekIndex].sessions.push(newSession);
        setWeeks(newWeeks);
    };

    const removeRoutine = (weekIndex: number, sessionIndex: number, routineIndex: number) => {
        const newWeeks = [...weeks];
        newWeeks[weekIndex].sessions[sessionIndex].routines.splice(routineIndex, 1);
        setWeeks(newWeeks);
    };

    const updateRoutineName = (weekIndex: number, sessionIndex: number, routineIndex: number, name: string) => {
        const newWeeks = [...weeks];
        newWeeks[weekIndex].sessions[sessionIndex].routines[routineIndex].name = name;
        setWeeks(newWeeks);
    };

    if (loading) return <div style={{ padding: '2rem', color: '#fff' }}>Cargando editor...</div>;

    return (
        <div style={layoutContainerStyle}>
            {/* IZQUIERDA: CATÁLOGO DE RUTINAS */}
            <aside style={sidebarStyle}>
                <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '20px' }}>Catálogo de Bloques</h3>
                <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '20px' }}>
                    Selecciona un bloque para añadirlo a la sesión activa.
                </p>
                <div style={catalogListStyle}>
                    <h4 style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '10px' }}>Bloques de Sesiones (Plantillas)</h4>
                    {catalogWeeks.length === 0 ? (
                        <p style={{ color: '#444', textAlign: 'center', fontSize: '0.8rem' }}>No hay semanas.</p>
                    ) : catalogWeeks.map(w => (
                        <div key={w.id} style={{ ...catalogItemStyle, borderColor: '#ff4d4d' }} onClick={() => addWeekTemplateToPlan(w)} title="Añadir semana completa al plan">
                            <h4 style={{ margin: '0 0 5px 0', color: '#fff', fontSize: '0.9rem' }}>{w.name}</h4>
                            <p style={{ fontSize: '0.7rem', color: '#888', margin: 0 }}>
                                {w.sessions?.length || 0} Sesiones
                            </p>
                        </div>
                    ))}

                    <h4 style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', marginTop: '20px', marginBottom: '10px' }}>Bloques de Rutina</h4>
                    {catalogRoutines.length === 0 ? (
                        <p style={{ color: '#444', textAlign: 'center', fontSize: '0.8rem' }}>No hay bloques.</p>
                    ) : catalogRoutines.map(r => (
                        <div key={r.id} style={catalogItemStyle} title="Añadir a una sesión">
                            <h4 style={{ margin: '0 0 5px 0', color: '#fff', fontSize: '0.9rem' }}>{r.name}</h4>
                            <p style={{ fontSize: '0.7rem', color: '#888', margin: 0 }}>
                                {r.exercises?.length || 0} Ejercicios
                            </p>
                        </div>
                    ))}

                    <h4 style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', marginTop: '20px', marginBottom: '10px' }}>Sesiones Completas</h4>
                    {catalogSessions.length === 0 ? (
                        <p style={{ color: '#444', textAlign: 'center', fontSize: '0.8rem' }}>No hay sesiones.</p>
                    ) : catalogSessions.map(s => (
                        <div key={s.id} style={{ ...catalogItemStyle, borderColor: '#ff4d4d33' }} title="Añadir sesión completa">
                            <h4 style={{ margin: '0 0 5px 0', color: '#fff', fontSize: '0.9rem' }}>{s.name}</h4>
                            <p style={{ fontSize: '0.7rem', color: '#888', margin: 0 }}>
                                {s.routines?.length || 0} Rutinas
                            </p>
                        </div>
                    ))}
                </div>
            </aside>

            {/* DERECHA: CONSTRUCTOR DE ENTRENAMIENTO */}
            <main style={mainContentStyle}>
                <header style={headerStyle}>
                    <Link href="/" style={backButtonStyle}>← Volver</Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h2 style={{ margin: 0 }}>{planId ? 'Editar Entrenamiento' : 'Nuevo Entrenamiento'}</h2>
                        <button onClick={handleSave} disabled={saving} style={saveButtonStyle}>
                            {saving ? 'Guardando...' : (planId ? 'Actualizar Cambios' : 'Guardar Todo')}
                        </button>
                    </div>
                </header>

                <section style={sectionStyle}>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Nombre del Plan:</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                style={inputStyle}
                                placeholder="Ej: Hipertrofia Intermedio"
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Descripción:</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                style={{ ...inputStyle, minHeight: '42px' }}
                                placeholder="Objetivos, duración, etc."
                            />
                        </div>
                    </div>
                </section>

                <div style={{ marginTop: '20px' }}>
                    {weeks.length === 0 ? (
                        <div style={emptyStateStyle}>
                            <p>Empieza añadiendo la primera semana de tu plan.</p>
                            <button onClick={addWeek} style={addFirstButtonStyle}>+ Añadir Semana 1</button>
                        </div>
                    ) : (
                        <>
                            {weeks.map((week, wIdx) => (
                                <div key={wIdx} style={weekCardStyle}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <h3 style={{ margin: 0, color: '#ff4d4d' }}>Semana {week.number}</h3>
                                            <button onClick={() => removeWeek(wIdx)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '1.2rem', padding: '5px', borderRadius: '5px', transition: 'background 0.2s', backgroundColor: 'rgba(255,255,255,0.02)' }} title="Eliminar semana">🗑️</button>
                                        </div>
                                        <button onClick={() => addSessionToWeek(wIdx)} style={smallButtonStyle}>+ Añadir Sesion</button>
                                    </div>

                                    {/* ATAJOS DE SESIONES COMPLETAS */}
                                    {catalogSessions.length > 0 && (
                                        <div style={{ marginTop: '10px', display: 'flex', gap: '5px', overflowX: 'auto', padding: '5px 0' }}>
                                            {catalogSessions.map(s => (
                                                <button
                                                    key={s.id}
                                                    onClick={() => addSessionTemplateToWeek(wIdx, s)}
                                                    style={{ ...quickAddButtonStyle, borderColor: '#ff4d4d' }}
                                                >
                                                    + {s.name} (Sesión)
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {week.sessions.map((session: AnyType, sIdx: number) => (
                                        <div key={sIdx} style={sessionCardStyle}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                <input
                                                    value={session.name}
                                                    onChange={e => {
                                                        const nw = [...weeks];
                                                        nw[wIdx].sessions[sIdx].name = e.target.value;
                                                        setWeeks(nw);
                                                    }}
                                                    style={minimalInputStyle}
                                                />
                                                <span style={{ fontSize: '0.7rem', color: '#666' }}>
                                                    Añade bloques de la izquierda →
                                                </span>
                                            </div>

                                            <div style={routineDropZoneStyle}>
                                                {session.routines.length === 0 ? (
                                                    <div style={{ padding: '20px', textAlign: 'center', color: '#444', fontSize: '0.8rem' }}>
                                                        Haz clic en un bloque del catálogo para añadirlo a esta sesión.
                                                    </div>
                                                ) : session.routines.map((routine: AnyType, rIdx: number) => (
                                                    <div key={rIdx} style={routineCardStyle}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                            <input
                                                                value={routine.name}
                                                                onChange={e => updateRoutineName(wIdx, sIdx, rIdx, e.target.value)}
                                                                style={minimalInputStyle}
                                                            />
                                                            <button onClick={() => removeRoutine(wIdx, sIdx, rIdx)} style={{ ...smallButtonStyle, backgroundColor: '#333', color: '#ff4d4d' }}>✕</button>
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: '#888' }}>
                                                            {routine.exercises.map((ex: AnyType, iidx: number) => (
                                                                <div key={iidx} style={{ padding: '4px 0', borderBottom: iidx < routine.exercises.length - 1 ? '1px solid #333' : 'none' }}>
                                                                    {ex.exercise.name} - {ex.series} series
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* ATAJO DE CLICK: Si hay un bloque seleccionado en el catálogo, lo añadimos */}
                                                <div style={{ marginTop: '10px', display: 'flex', gap: '5px', overflowX: 'auto' }}>
                                                    {catalogRoutines.map(r => (
                                                        <button
                                                            key={r.id}
                                                            onClick={() => addRoutineToSession(wIdx, sIdx, r)}
                                                            style={quickAddButtonStyle}
                                                        >
                                                            + {r.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                            <button onClick={addWeek} style={addWeekButtonStyle}>+ Añadir Nueva Semana</button>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

const layoutContainerStyle: React.CSSProperties = {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#0a0a0a'
};

const sidebarStyle: React.CSSProperties = {
    width: '280px',
    backgroundColor: '#111',
    borderRight: '1px solid #222',
    padding: '30px 20px',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto'
};

const mainContentStyle: React.CSSProperties = {
    flex: 1,
    padding: '30px 40px',
    maxWidth: '1200px',
    margin: '0 auto'
};

const catalogListStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
};

const catalogItemStyle: React.CSSProperties = {
    backgroundColor: '#1a1a1a',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #333',
    cursor: 'pointer',
    transition: 'all 0.2s',
    hover: {
        borderColor: '#ff4d4d',
        backgroundColor: '#222'
    }
} as AnyType;

const emptyStateStyle: React.CSSProperties = {
    padding: '60px',
    textAlign: 'center',
    backgroundColor: '#111',
    borderRadius: '16px',
    border: '1px dashed #333',
    color: '#666',
    marginTop: '40px'
};

const addFirstButtonStyle: React.CSSProperties = {
    backgroundColor: '#ff4d4d',
    color: '#fff',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '20px'
};

const routineDropZoneStyle: React.CSSProperties = {
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    padding: '10px',
    minHeight: '60px',
    border: '1px solid #333'
};

const quickAddButtonStyle: React.CSSProperties = {
    whiteSpace: 'nowrap',
    backgroundColor: '#222',
    color: '#aaa',
    padding: '4px 10px',
    borderRadius: '4px',
    border: '1px solid #333',
    fontSize: '0.75rem',
    cursor: 'pointer'
};

const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    borderBottom: '1px solid #333',
    paddingBottom: '1rem'
};

const backButtonStyle = {
    color: '#888',
    textDecoration: 'none'
};

const saveButtonStyle = {
    backgroundColor: '#ff4d4d',
    color: '#fff',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold' as const
};

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
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #333',
    backgroundColor: '#000',
    color: '#fff',
    boxSizing: 'border-box' as const
};

const weekCardStyle: React.CSSProperties = {
    backgroundColor: '#111',
    padding: '1.5rem',
    borderRadius: '16px',
    border: '1px solid #222',
    marginBottom: '2rem'
};

const dayCardStyle: React.CSSProperties = {
    backgroundColor: '#161616',
    padding: '1.2rem',
    borderRadius: '12px',
    border: '1px solid #333',
    marginTop: '1.2rem'
};

const sessionCardStyle: React.CSSProperties = {
    backgroundColor: '#202020',
    padding: '1rem',
    borderRadius: '10px',
    marginTop: '1rem',
    border: '1px solid #444'
};

const routineCardStyle: React.CSSProperties = {
    backgroundColor: '#2a2a2a',
    padding: '10px',
    borderRadius: '8px',
    marginTop: '8px',
    border: '1px solid #555'
};

const minimalInputStyle = {
    background: 'none',
    border: '1px solid #444',
    color: '#fff',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '0.9rem',
    width: '200px'
};

const addWeekButtonStyle = {
    backgroundColor: '#111',
    color: '#ff4d4d',
    padding: '20px',
    border: '2px dashed #ff4d4d33',
    borderRadius: '16px',
    cursor: 'pointer',
    width: '100%',
    fontWeight: 'bold' as const,
    marginTop: '1rem',
    transition: 'all 0.2s'
};

const smallButtonStyle = {
    backgroundColor: '#222',
    color: '#fff',
    padding: '6px 12px',
    border: '1px solid #333',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.75rem'
};
