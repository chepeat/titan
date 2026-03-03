'use client';

import { useState, useEffect, useRef } from 'react';
import {
    getExercises,
    getMachines,
    createExercise,
    updateExercise,
    createMachine,
    updateMachine,
    getTrainingPlans,
    getRoutines,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    getSessionTemplates,
    createSessionTemplate,
    updateSessionTemplate,
    deleteSessionTemplate,
    getWeekTemplates,
    createWeekTemplate,
    updateWeekTemplate,
    deleteWeekTemplate
} from '@/services/workoutActions';
import { getMembers, assignPlanToUser } from '@/services/userActions';
import Link from 'next/link';
import WorkoutPDFExporter from './WorkoutPDFExporter';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyType = any;

export default function TrainerDashboard({ coachId }: { coachId: string }) {
    const [view, setView] = useState<'hub' | 'plans' | 'exercises' | 'machines' | 'routines' | 'sessions' | 'weeks' | 'users'>('hub');
    const [plans, setPlans] = useState<AnyType[]>([]);
    const [members, setMembers] = useState<AnyType[]>([]);
    const [exercises, setExercises] = useState<AnyType[]>([]);
    const [machines, setMachines] = useState<AnyType[]>([]);
    const [routines, setRoutines] = useState<AnyType[]>([]);
    const [sessions, setSessions] = useState<AnyType[]>([]);
    const [weeks, setWeeks] = useState<AnyType[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [uploading, setUploading] = useState(false);

    // Edit states
    const [editingExercise, setEditingExercise] = useState<AnyType | null>(null);
    const [editingMachine, setEditingMachine] = useState<AnyType | null>(null);
    const [editingRoutine, setEditingRoutine] = useState<AnyType | null>(null);
    const [editingSession, setEditingSession] = useState<AnyType | null>(null);
    const [editingWeek, setEditingWeek] = useState<AnyType | null>(null);
    const [selectedMachineIds, setSelectedMachineIds] = useState<string[]>([]);

    // Routine construction state
    const [routineItems, setRoutineItems] = useState<AnyType[]>([]);
    const [routineName, setRoutineName] = useState('');
    const [routineDesc, setRoutineDesc] = useState('');

    // Session construction state
    const [sessionRoutines, setSessionRoutines] = useState<AnyType[]>([]);
    const [sessionName, setSessionName] = useState('');

    // Week construction state
    const [weekName, setWeekName] = useState('');
    const [weekSessions, setWeekSessions] = useState<AnyType[]>([]);

    const exerciseFormRef = useRef<HTMLFormElement>(null);
    const machineFormRef = useRef<HTMLFormElement>(null);

    const fetchData = async () => {
        if (view === 'hub') return;
        setLoading(true);
        try {
            if (view === 'plans') {
                const data = await getTrainingPlans();
                setPlans(data);
            } else if (view === 'exercises') {
                const data = await getExercises();
                setExercises(data);
                const mData = await getMachines();
                setMachines(mData);
            } else if (view === 'machines') {
                const data = await getMachines();
                setMachines(data);
            } else if (view === 'routines') {
                const data = await getRoutines(coachId);
                setRoutines(data);
                const exData = await getExercises();
                setExercises(exData);
            } else if (view === 'sessions') {
                const data = await getSessionTemplates(coachId);
                setSessions(data);
                const rData = await getRoutines(coachId);
                setRoutines(rData);
            } else if (view === 'weeks') {
                const data = await getWeekTemplates(coachId);
                setWeeks(data);
                const sData = await getSessionTemplates(coachId);
                setSessions(sData);
            } else if (view === 'users') {
                const [mList, pList] = await Promise.all([getMembers(), getTrainingPlans()]);
                setMembers(mList);
                setPlans(pList);
            }
        } catch (err) {
            console.error("Error fetching data:", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
        // Reset edit states when changing view
        setEditingExercise(null);
        setEditingMachine(null);
        setRoutineName('');
        setRoutineDesc('');
        setEditingSession(null);
        setSessionRoutines([]);
        setSessionName('');
        setEditingWeek(null);
        setWeekName('');
        setWeekSessions([]);
    }, [view]);

    // HANDLERS
    const handleMachineSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setUploading(true);
        setMessage('');
        const formData = new FormData(e.currentTarget);

        let res;
        if (editingMachine) {
            res = await updateMachine(editingMachine.id, formData);
        } else {
            res = await createMachine(formData);
        }

        setUploading(false);
        if (res.success) {
            setMessage(editingMachine ? 'Máquina actualizada' : 'Máquina registrada');
            e.currentTarget.reset();
            setEditingMachine(null);
            fetchData();
        } else {
            setMessage('Error: ' + (res as AnyType).error);
        }
    };

    const handleExerciseSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setUploading(true);
        setMessage('');
        const formData = new FormData(e.currentTarget);

        let res;
        if (editingExercise) {
            res = await updateExercise(editingExercise.id, formData);
        } else {
            res = await createExercise(formData);
        }

        setUploading(false);
        if (res.success) {
            setMessage(editingExercise ? 'Ejercicio actualizado' : 'Ejercicio guardado');
            e.currentTarget.reset();
            setEditingExercise(null);
            setSelectedMachineIds([]);
            fetchData();
        } else {
            setMessage('Error: ' + (res as AnyType).error);
        }
    };

    const handleRoutineSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!routineName) {
            setMessage('Error: La rutina necesita un nombre');
            return;
        }
        if (routineItems.length === 0) {
            setMessage('Error: Añade al menos un ejercicio a la rutina');
            return;
        }

        setUploading(true);
        setMessage('');

        const data = {
            name: routineName,
            description: routineDesc,
            coachId: coachId,
            items: routineItems
        };

        let res;
        if (editingRoutine) {
            res = await updateRoutine(editingRoutine.id, data);
        } else {
            res = await createRoutine(data);
        }

        setUploading(false);
        if (res.success) {
            setMessage(editingRoutine ? 'Rutina actualizada' : 'Rutina guardada');
            setEditingRoutine(null);
            setRoutineItems([]);
            setRoutineName('');
            setRoutineDesc('');
            fetchData();
        } else {
            setMessage('Error: ' + (res as AnyType).error);
        }
    };

    // SESSION HANDLERS
    const addRoutineToSessionList = (routine: AnyType) => {
        setSessionRoutines([...sessionRoutines, routine]);
    };

    const removeRoutineFromSessionList = (index: number) => {
        const newR = [...sessionRoutines];
        newR.splice(index, 1);
        setSessionRoutines(newR);
    };

    const handleSessionSubmit = async () => {
        if (!sessionName || sessionRoutines.length === 0) {
            alert('Indica un nombre y añade al menos una rutina');
            return;
        }
        setUploading(true);
        const data = {
            name: sessionName,
            coachId,
            routines: sessionRoutines
        };

        let res;
        if (editingSession) {
            res = await updateSessionTemplate(editingSession.id, data);
        } else {
            res = await createSessionTemplate(data);
        }

        setUploading(false);
        if (res.success) {
            setMessage(editingSession ? 'Sesión actualizada' : 'Sesión de plantilla creada');
            setEditingSession(null);
            setSessionName('');
            setSessionRoutines([]);
            fetchData();
        } else {
            alert('Error: ' + (res as AnyType).error);
        }
    };

    const handleDeleteSession = async (id: string) => {
        if (!confirm('¿Seguro que quieres borrar esta sesión?')) return;
        const res = await deleteSessionTemplate(id);
        if (res.success) {
            setMessage('Sesión borrada');
            fetchData();
        }
    };

    // WEEK HANDLERS
    const addSessionToWeek = (session: AnyType) => {
        setWeekSessions([...weekSessions, session]);
    };

    const removeSessionFromWeek = (sessionIdx: number) => {
        const newSessions = [...weekSessions];
        newSessions.splice(sessionIdx, 1);
        setWeekSessions(newSessions);
    };

    const handleWeekSubmit = async () => {
        if (!weekName) {
            alert('Indica un nombre para la semana');
            return;
        }
        setUploading(true);
        const data = {
            name: weekName,
            coachId,
            sessions: weekSessions
        };

        console.log('[DEBUG] Enviando datos de semana:', data);

        let res;
        if (editingWeek) {
            res = await updateWeekTemplate(editingWeek.id, data);
        } else {
            res = await createWeekTemplate(data);
        }

        setUploading(false);
        if (res.success) {
            setMessage(editingWeek ? 'Semana actualizada' : 'Semana de plantilla creada');
            setEditingWeek(null);
            setWeekName('');
            setWeekSessions([]);
            fetchData();
        } else {
            alert('Error: ' + (res as AnyType).error);
        }
    };

    const handleDeleteWeek = async (id: string) => {
        if (!confirm('¿Seguro que quieres borrar esta semana?')) return;
        const res = await deleteWeekTemplate(id);
        if (res.success) {
            setMessage('Semana borrada');
            fetchData();
        }
    };

    const handleAssignPlan = async (userId: string, planId: string) => {
        const res = await assignPlanToUser(userId, planId === "" ? null : planId);
        if (res.success) {
            setMessage('Plan asignado correctamente');
            fetchData();
        } else {
            alert('Error al asignar plan: ' + res.error);
        }
    };

    // ROUTINE EDITOR HELPERS
    const addExerciseToRoutine = (exercise: AnyType) => {
        setRoutineItems(prev => [
            ...prev,
            {
                exerciseId: exercise.id,
                exercise: exercise, // Store for local display
                series: 3,
                reps: ["10", "10", "10"],
                restingTime: 60
            }
        ]);
    };

    const removeRoutineItem = (index: number) => {
        setRoutineItems(prev => prev.filter((_, i) => i !== index));
    };

    const updateItemField = (index: number, field: string, value: AnyType) => {
        setRoutineItems(prev => prev.map((item, i) => {
            if (i === index) {
                const updatedItem = { ...item, [field]: value };
                // Sync reps array if series changes
                if (field === 'series') {
                    const newSeriesCount = parseInt(value) || 1;
                    let newReps = [...(Array.isArray(updatedItem.reps) ? updatedItem.reps : [updatedItem.reps])];
                    if (newReps.length < newSeriesCount) {
                        const lastValue = newReps[newReps.length - 1] || "10";
                        while (newReps.length < newSeriesCount) newReps.push(lastValue);
                    } else if (newReps.length > newSeriesCount) {
                        newReps = newReps.slice(0, newSeriesCount);
                    }
                    updatedItem.reps = newReps;
                }
                return updatedItem;
            }
            return item;
        }));
    };

    const updateRepValue = (itemIndex: number, repIndex: number, value: string) => {
        setRoutineItems(prev => prev.map((item, i) => {
            if (i === itemIndex) {
                const newReps = [...(Array.isArray(item.reps) ? item.reps : [item.reps])];
                newReps[repIndex] = value;
                return { ...item, reps: newReps };
            }
            return item;
        }));
    };

    const moveItem = (index: number, direction: 'up' | 'down') => {
        const newItems = [...routineItems];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newItems.length) return;

        [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
        setRoutineItems(newItems);
    };

    // EDIT TOGGLES
    const startEditExercise = (ex: AnyType) => {
        setEditingExercise(ex);
        const machineIds = ex.machines?.map((m: AnyType) => m.id) || [];
        setSelectedMachineIds(machineIds);
        setMessage('');

        setTimeout(() => {
            if (exerciseFormRef.current) {
                const form = exerciseFormRef.current;
                (form.elements.namedItem('name') as HTMLInputElement).value = ex.name || '';
                (form.elements.namedItem('description') as HTMLTextAreaElement).value = ex.description || '';
                (form.elements.namedItem('observations') as HTMLTextAreaElement).value = ex.observations || '';
                form.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    };

    const startEditMachine = (m: AnyType) => {
        setEditingMachine(m);
        setMessage('');
        setTimeout(() => {
            if (machineFormRef.current) {
                const form = machineFormRef.current;
                (form.elements.namedItem('number') as HTMLInputElement).value = m.number.toString();
                (form.elements.namedItem('description') as HTMLInputElement).value = m.description || '';
                (form.elements.namedItem('observations') as HTMLTextAreaElement).value = m.observations || '';
                form.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    };

    const startEditSession = (s: AnyType) => {
        setEditingSession(s);
        setSessionName(s.name);
        // Deep copy the routines in the session
        setSessionRoutines(s.routines.map((r: AnyType) => ({
            ...r,
            exercises: r.exercises.map((e: AnyType) => ({ ...e }))
        })));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const startEditWeek = (w: AnyType) => {
        setEditingWeek(w);
        setWeekName(w.name || '');
        // Load sessions list directly
        setWeekSessions((w.sessions || []).map((s: AnyType) => ({
            ...s,
            routines: (s.routines || []).map((r: AnyType) => ({
                ...r,
                exercises: (r.exercises || []).map((e: AnyType) => ({ ...e }))
            }))
        })));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const startEditRoutine = (r: AnyType) => {
        setEditingRoutine(r);
        setRoutineName(r.name);
        setRoutineDesc(r.description || '');
        setRoutineItems(r.exercises.map((item: AnyType) => ({
            exerciseId: item.exerciseId,
            exercise: item.exercise,
            series: item.series,
            reps: item.reps,
            restingTime: item.restingTime
        })));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleMachineSelection = (id: string) => {
        setSelectedMachineIds(prev =>
            prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
        );
    };

    return (
        <div style={containerStyle}>
            {view === 'hub' ? (
                <div style={hubGridStyle}>
                    <div style={hubCardStyle} onClick={() => setView('plans')}>
                        <div style={iconStyle}>📋</div>
                        <h3 style={cardTitleStyle}>Entrenamientos</h3>
                        <p style={cardDescStyle}>Crea y gestiona planes, semanas y rutinas para los socios.</p>
                        <button style={cardButtonStyle}>Acceder</button>
                    </div>
                    <div style={hubCardStyle} onClick={() => setView('weeks')}>
                        <div style={{ ...iconStyle, filter: 'hue-rotate(180deg)', transform: 'scale(1.1)' }}>🗓️</div>
                        <h3 style={cardTitleStyle}>Bloque de sesiones</h3>
                        <p style={cardDescStyle}>Organiza bloques de sesiones para tus planes.</p>
                        <button style={cardButtonStyle}>Acceder</button>
                    </div>
                    <div style={hubCardStyle} onClick={() => setView('sessions')}>
                        <div style={{ ...iconStyle, filter: 'hue-rotate(150deg)' }}>📅</div>
                        <h3 style={cardTitleStyle}>Sesiones</h3>
                        <p style={cardDescStyle}>Crea sesiones completas combinando varios bloques de rutina.</p>
                        <button style={cardButtonStyle}>Acceder</button>
                    </div>
                    <div style={hubCardStyle} onClick={() => setView('routines')}>
                        <div style={{ ...iconStyle, filter: 'hue-rotate(90deg)' }}>🧩</div>
                        <h3 style={cardTitleStyle}>Bloques de rutinas</h3>
                        <p style={cardDescStyle}>Crea conjuntos de ejercicios (bloques) reutilizables.</p>
                        <button style={cardButtonStyle}>Acceder</button>
                    </div>
                    <div style={hubCardStyle} onClick={() => setView('exercises')}>
                        <div style={{ ...iconStyle, filter: 'hue-rotate(200deg)' }}>💪</div>
                        <h3 style={cardTitleStyle}>Ejercicios</h3>
                        <p style={cardDescStyle}>Administra el catálogo completo de ejercicios disponibles.</p>
                        <button style={cardButtonStyle}>Acceder</button>
                    </div>
                    <div style={hubCardStyle} onClick={() => setView('machines')}>
                        <div style={{ ...iconStyle, filter: 'hue-rotate(300deg)' }}>⚙️</div>
                        <h3 style={cardTitleStyle}>Máquinas</h3>
                        <p style={cardDescStyle}>Gestiona el inventario de máquinas y equipamiento del club.</p>
                        <button style={cardButtonStyle}>Acceder</button>
                    </div>
                    <div style={{ ...hubCardStyle, border: '1px solid #4ade80' }} onClick={() => setView('users')}>
                        <div style={{ ...iconStyle, filter: 'hue-rotate(120deg)' }}>👥</div>
                        <h3 style={cardTitleStyle}>Socios</h3>
                        <p style={cardDescStyle}>Asigna planes de entrenamiento a los socios registrados.</p>
                        <button style={{ ...cardButtonStyle, backgroundColor: '#4ade80' }}>Gestionar</button>
                    </div>
                </div>
            ) : (
                <>
                    <button onClick={() => setView('hub')} style={backButtonStyle}>← Volver al Panel Principal</button>
                    {message && <div style={alertStyle}>{message}</div>}

                    {view === 'plans' && (
                        <section style={managementSectionStyle}>
                            <div style={headerActionStyle}>
                                <h3 style={sectionTitleStyle}>Gestión de Entrenamientos</h3>
                                <Link href="/coach/workouts/new" style={buttonStyle}>+ Nuevo Entrenamiento</Link>
                            </div>
                            {loading ? <p>Cargando...</p> : (
                                <div style={gridStyle}>
                                    {plans.length === 0 ? <p style={{ color: '#666' }}>No hay entrenamientos creados todavía.</p> : plans.map(p => (
                                        <div key={p.id} style={itemCardStyle}>
                                            <h4 style={{ margin: '0 0 10px 0', color: '#ff4d4d' }}>{p.name}</h4>
                                            <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '15px' }}>{p.description || 'Sin descripción'}</p>
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <Link href={`/coach/workouts/${p.id}`} style={smallButtonStyle}>Editar Plan</Link>
                                                <WorkoutPDFExporter plan={p} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {view === 'users' && (
                        <section style={managementSectionStyle}>
                            <h3 style={sectionTitleStyle}>Gestión de Socios</h3>
                            <p style={{ color: '#888', marginBottom: '20px' }}>
                                Aquí puedes asignar planes de entrenamiento a los usuarios registrados por el administrador.
                            </p>
                            {loading ? <p>Cargando...</p> : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#111', borderRadius: '8px' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
                                                <th style={{ padding: '15px', color: '#888' }}>Socio</th>
                                                <th style={{ padding: '15px', color: '#888' }}>Plan Asignado</th>
                                                <th style={{ padding: '15px', color: '#888' }}>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {members.length === 0 ? (
                                                <tr><td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No hay socios registrados.</td></tr>
                                            ) : members.map(m => (
                                                <tr key={m.id} style={{ borderBottom: '1px solid #222' }}>
                                                    <td style={{ padding: '15px' }}>
                                                        <div style={{ fontWeight: 'bold' }}>{m.name || 'Sin nombre'}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{m.email}</div>
                                                    </td>
                                                    <td style={{ padding: '15px' }}>
                                                        <span style={{
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            backgroundColor: m.trainingPlan ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                                            color: m.trainingPlan ? '#4ade80' : '#888',
                                                            fontSize: '0.9rem'
                                                        }}>
                                                            {m.trainingPlan?.name || 'Ninguno'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '15px' }}>
                                                        <select
                                                            onChange={(e) => handleAssignPlan(m.id, e.target.value)}
                                                            value={m.trainingPlanId || ""}
                                                            style={{
                                                                backgroundColor: '#000',
                                                                color: '#fff',
                                                                border: '1px solid #333',
                                                                padding: '6px 10px',
                                                                borderRadius: '6px',
                                                                fontSize: '0.85rem',
                                                                width: '200px'
                                                            }}
                                                        >
                                                            <option value="">-- Sin Plan --</option>
                                                            {plans.map(p => (
                                                                <option key={p.id} value={p.id}>{p.name}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    )}

                    {view === 'routines' && (
                        <section style={managementSectionStyle}>
                            <h3 style={sectionTitleStyle}>{editingRoutine ? 'Editando Bloque de Rutina' : 'Administración de Rutinas (Bloques)'}</h3>

                            <div style={routineEditorLayout}>
                                {/* LADO IZQUIERDO: FORMULARIO Y COMPOSICIÓN */}
                                <div style={{ flex: 1.2 }}>
                                    <div style={formStyle}>
                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={labelStyle}>Nombre del Bloque (Ej: Fuerza Superior A)</label>
                                            <input
                                                type="text"
                                                value={routineName}
                                                onChange={(e) => setRoutineName(e.target.value)}
                                                placeholder="Nombre de la rutina..."
                                                style={inputStyle}
                                            />
                                        </div>
                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={labelStyle}>Descripción / Notas</label>
                                            <textarea
                                                value={routineDesc}
                                                onChange={(e) => setRoutineDesc(e.target.value)}
                                                placeholder="Ej: Calentamiento específico..."
                                                style={{ ...inputStyle, minHeight: '60px' }}
                                            />
                                        </div>

                                        <h4 style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '15px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                                            Composición del Bloque ({routineItems.length} ejercicios)
                                        </h4>

                                        {routineItems.length === 0 ? (
                                            <div style={{ padding: '30px', textAlign: 'center', backgroundColor: '#0a0a0a', borderRadius: '12px', border: '1px dashed #333', color: '#666' }}>
                                                Selecciona ejercicios del catálogo de la derecha para empezar.
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {routineItems.map((item, idx) => (
                                                    <div key={idx} style={routineItemCardStyle}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                            <strong style={{ color: '#ff4d4d' }}>{idx + 1}. {item.exercise.name}</strong>
                                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                                <button onClick={() => moveItem(idx, 'up')} style={miniButtonStyle}>↑</button>
                                                                <button onClick={() => moveItem(idx, 'down')} style={miniButtonStyle}>↓</button>
                                                                <button onClick={() => removeRoutineItem(idx)} style={{ ...miniButtonStyle, color: '#ff4d4d' }}>✕</button>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                                            <div style={{ width: '60px' }}>
                                                                <label style={microLabelStyle}>Series</label>
                                                                <input
                                                                    type="number"
                                                                    value={item.series}
                                                                    onChange={(e) => updateItemField(idx, 'series', parseInt(e.target.value))}
                                                                    style={smallInputStyle}
                                                                />
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <label style={microLabelStyle}>Repeticiones por serie</label>
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                                                    {(Array.isArray(item.reps) ? item.reps : [item.reps]).map((reps: string, rIdx: number) => (
                                                                        <div key={rIdx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                                            <span style={{ fontSize: '0.6rem', color: '#444' }}>S{rIdx + 1}</span>
                                                                            <input
                                                                                type="text"
                                                                                value={reps}
                                                                                onChange={(e) => updateRepValue(idx, rIdx, e.target.value)}
                                                                                style={{ ...smallInputStyle, width: '35px', padding: '4px' }}
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div style={{ width: '80px' }}>
                                                                <label style={microLabelStyle}>Descanso (s)</label>
                                                                <input
                                                                    type="number"
                                                                    value={item.restingTime}
                                                                    onChange={(e) => updateItemField(idx, 'restingTime', parseInt(e.target.value))}
                                                                    style={smallInputStyle}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                                            <button onClick={handleRoutineSubmit} disabled={uploading} style={{ ...buttonStyle, flex: 1 }}>
                                                {uploading ? 'Guardando...' : (editingRoutine ? 'Actualizar Bloque' : 'Guardar Rutina')}
                                            </button>
                                            {(editingRoutine || routineItems.length > 0) && (
                                                <button onClick={() => { setEditingRoutine(null); setRoutineItems([]); setRoutineName(''); setRoutineDesc(''); }} style={cancelButtonStyle}>
                                                    Cancelar / Limpiar
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* LISTADO DE RUTINAS EXISTENTES */}
                                    <div style={{ marginTop: '40px' }}>
                                        <h4 style={{ color: '#888', marginBottom: '20px' }}>Tus Bloques Guardados</h4>
                                        {routines.map(r => (
                                            <div key={r.id} style={{ ...itemCardStyle, marginBottom: '15px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                    <div>
                                                        <h5 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: '#fff' }}>{r.name}</h5>
                                                        <p style={{ fontSize: '0.85rem', color: '#666', margin: '0 0 10px 0' }}>{r.description || 'Sin descripción'}</p>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                                            {r.exercises?.map((ei: AnyType, i: number) => (
                                                                <span key={i} style={tagStyle}>{ei.exercise.name}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <button onClick={() => startEditRoutine(r)} style={editIconButtonStyle}>✏️</button>
                                                        <button onClick={async () => { if (confirm('¿Eliminar rutina?')) { await deleteRoutine(r.id); fetchData(); } }} style={{ ...editIconButtonStyle, filter: 'grayscale(1)' }}>🗑️</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* LADO DERECHO: CATÁLOGO DE EJERCICIOS (PARA "ARRASTRAR" / AÑADIR) */}
                                <div style={{ flex: 0.8, backgroundColor: '#0a0a0a', padding: '20px', borderRadius: '20px', border: '1px solid #222', maxHeight: '1000px', overflowY: 'auto' }}>
                                    <h4 style={{ color: '#fff', marginBottom: '20px', fontSize: '1rem' }}>Catálogo de Ejercicios</h4>
                                    <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '20px' }}>Haz clic en el botón <span style={{ color: '#ff4d4d' }}>+</span> para añadir al bloque.</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {exercises.map(ex => (
                                            <div key={ex.id} style={{ ...listItemStyle, padding: '10px 15px', justifyContent: 'space-between', backgroundColor: '#111' }}>
                                                <div style={{ overflow: 'hidden' }}>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#eee', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ex.name}</div>
                                                    {ex.machines?.length > 0 && (
                                                        <div style={{ fontSize: '0.7rem', color: '#666' }}>Máq: {ex.machines.map((m: AnyType) => m.number).join(', ')}</div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => addExerciseToRoutine(ex)}
                                                    style={{ backgroundColor: '#ff4d4d', color: '#fff', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontWeight: 'bold' }}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {view === 'machines' && (
                        <section style={managementSectionStyle}>
                            <h3 style={sectionTitleStyle}>{editingMachine ? 'Editando Máquina' : 'Administración de Máquinas'}</h3>
                            <form ref={machineFormRef} onSubmit={handleMachineSubmit} style={formStyle}>
                                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                                    <div style={{ width: '100px' }}>
                                        <label style={labelStyle}>Número</label>
                                        <input type="number" name="number" placeholder="Ej: 1" required style={inputStyle} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={labelStyle}>Descripción / Nombre</label>
                                        <input type="text" name="description" placeholder="Ej: Prensa de Piernas" required style={inputStyle} />
                                    </div>
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={labelStyle}>Observaciones / Estado</label>
                                    <textarea name="observations" placeholder="Detalles sobre el mantenimiento o uso..." style={{ ...inputStyle, minHeight: '80px' }} />
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={labelStyle}>Imagen de la Máquina {editingMachine ? '(Opcional, deja vacío para mantener actual)' : '(Opcional)'}</label>
                                    <div style={fileInputContainerStyle}>
                                        <input
                                            type="file"
                                            name="imageFile"
                                            accept="image/*"
                                            style={fileInputStyle}
                                            id="machine-upload"
                                        />
                                        <label htmlFor="machine-upload" style={fileLabelStyle}>
                                            {uploading ? '⬆️ Subiendo...' : '📸 Seleccionar foto de la máquina'}
                                        </label>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button type="submit" disabled={uploading} style={{ ...buttonStyle, flex: 1, opacity: uploading ? 0.6 : 1 }}>
                                        {uploading ? 'Guardando...' : (editingMachine ? 'Actualizar Máquina' : 'Registrar Máquina')}
                                    </button>
                                    {editingMachine && (
                                        <button type="button" onClick={() => { setEditingMachine(null); machineFormRef.current?.reset(); }} style={cancelButtonStyle}>
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </form>
                            <div style={listStyle}>
                                <h4 style={{ color: '#888', marginBottom: '15px' }}>Máquinas Registradas</h4>
                                {loading ? <p>Cargando...</p> : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                                        {machines.map(m => (
                                            <div key={m.id} style={itemCardStyle}>
                                                <div style={{ display: 'flex', gap: '15px', alignItems: 'start' }}>
                                                    {m.imageFile && (
                                                        <img src={m.imageFile} alt={m.description} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #333' }} />
                                                    )}
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                            <div>
                                                                <span style={{ color: '#ff4d4d', fontWeight: 'bold' }}>#{m.number}</span>
                                                                <strong style={{ display: 'block', fontSize: '1rem' }}>{m.description}</strong>
                                                            </div>
                                                            <button onClick={() => startEditMachine(m)} style={editIconButtonStyle}>✏️</button>
                                                        </div>
                                                        {m.observations && <p style={{ fontSize: '0.8rem', color: '#888', margin: '5px 0 0 0' }}>{m.observations}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {view === 'exercises' && (
                        <section style={managementSectionStyle}>
                            <h3 style={sectionTitleStyle}>{editingExercise ? 'Editando Ejercicio' : 'Administración de Ejercicios'}</h3>
                            <form ref={exerciseFormRef} onSubmit={handleExerciseSubmit} style={formStyle}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={labelStyle}>Nombre del Ejercicio *</label>
                                    <input type="text" name="name" placeholder="Ej: Press de Banca" required style={inputStyle} />
                                </div>
                                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={labelStyle}>Descripción Técnica</label>
                                        <textarea name="description" placeholder="Instrucciones de ejecución..." style={{ ...inputStyle, minHeight: '80px' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={labelStyle}>Observaciones / Notas</label>
                                        <textarea name="observations" placeholder="Cuidado con la espalda, etc." style={{ ...inputStyle, minHeight: '80px' }} />
                                    </div>
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={labelStyle}>Vídeo del Ejercicio {editingExercise ? '(Opcional, deja vacío para mantener actual)' : '(Opcional)'}</label>

                                    {editingExercise?.videoFile && (
                                        <div style={videoStatusIndicatorStyle}>
                                            <span>✅ Vídeo ya asignado:</span>
                                            <a href={editingExercise.videoFile} target="_blank" rel="noreferrer" style={{ color: '#ff4d4d', fontWeight: 'bold' }}>Ver vídeo actual</a>
                                        </div>
                                    )}

                                    <div style={fileInputContainerStyle}>
                                        <input
                                            type="file"
                                            name="videoFile"
                                            accept="video/*"
                                            style={fileInputStyle}
                                            id="video-upload"
                                        />
                                        <label htmlFor="video-upload" style={fileLabelStyle}>
                                            {uploading ? '⬆️ Subiendo...' : '📹 Subir nuevo vídeo'}
                                        </label>
                                    </div>
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={labelStyle}>Máquinas Asociadas (Selecciona para asignar)</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px' }}>
                                        {machines.map(m => {
                                            const isSelected = selectedMachineIds.includes(m.id);
                                            return (
                                                <label key={m.id} style={{
                                                    ...checkboxLabelStyle,
                                                    backgroundColor: isSelected ? 'rgba(255, 77, 77, 0.15)' : '#000',
                                                    borderColor: isSelected ? '#ff4d4d' : '#222',
                                                    color: isSelected ? '#fff' : '#888'
                                                }}>
                                                    <input
                                                        type="checkbox"
                                                        name="machineIds"
                                                        value={m.id}
                                                        checked={isSelected}
                                                        onChange={() => toggleMachineSelection(m.id)}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                    <span style={{ fontWeight: isSelected ? 'bold' : 'normal' }}>
                                                        {isSelected ? '📍 ' : ''}Máquina {m.number}: {m.description}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button type="submit" disabled={uploading} style={{ ...buttonStyle, flex: 1, opacity: uploading ? 0.6 : 1 }}>
                                        {uploading ? 'Guardando...' : (editingExercise ? 'Actualizar Ejercicio' : 'Guardar Ejercicio')}
                                    </button>
                                    {editingExercise && (
                                        <button type="button" onClick={() => { setEditingExercise(null); setSelectedMachineIds([]); exerciseFormRef.current?.reset(); }} style={cancelButtonStyle}>
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </form>
                            <div style={listStyle}>
                                <h4 style={{ color: '#888', marginBottom: '15px' }}>Catálogo Actual</h4>
                                {loading ? <p>Cargando...</p> : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {exercises.map(ex => (
                                            <div key={ex.id} style={listItemStyle}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%', overflow: 'hidden' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <strong>{ex.name}</strong>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                            <span style={{ fontSize: '0.8rem', color: '#666' }}>
                                                                {ex.machines?.length > 0 ? ex.machines.map((m: AnyType) => `Máquina ${m.number}`).join(', ') : 'Sin máquina'}
                                                            </span>
                                                            <button onClick={() => startEditExercise(ex)} style={editIconButtonStyle}>✏️</button>
                                                        </div>
                                                    </div>
                                                    {ex.description && <p style={{ fontSize: '0.85rem', color: '#888', margin: 0 }}>{ex.description}</p>}
                                                    <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
                                                        {ex.videoFile && (
                                                            <a href={ex.videoFile} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#ff4d4d', textDecoration: 'none' }}>
                                                                📹 Ver Vídeo
                                                            </a>
                                                        )}
                                                        {ex.observations && <span style={{ fontSize: '0.75rem', color: '#4caf50' }}>📝 {ex.observations}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    )}
                    {view === 'sessions' && (
                        <section style={managementSectionStyle}>
                            <h3 style={sectionTitleStyle}>Biblioteca de Sesiones</h3>

                            <div style={formStyle}>
                                <h4 style={{ color: '#fff', marginBottom: '15px' }}>{editingSession ? 'Editando Sesión' : 'Crear Nueva Sesión (Bloque)'}</h4>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={labelStyle}>Nombre de la Sesión</label>
                                    <input
                                        type="text"
                                        value={sessionName}
                                        onChange={e => setSessionName(e.target.value)}
                                        placeholder="Ej: Empuje A - Hipertrofia"
                                        style={inputStyle}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                    <div>
                                        <h5 style={{ color: '#888', marginBottom: '10px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Bloques de Rutina Disponibles</h5>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', paddingRight: '10px' }}>
                                            {routines.map(r => (
                                                <div key={r.id} style={{ ...itemCardStyle, padding: '10px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <strong style={{ fontSize: '0.9rem' }}>{r.name}</strong>
                                                            <p style={{ fontSize: '0.7rem', color: '#666', margin: 0 }}>{r.exercises?.length || 0} ejercicios</p>
                                                        </div>
                                                        <button onClick={() => addRoutineToSessionList(r)} style={smallButtonStyle}>+ Añadir</button>
                                                    </div>
                                                </div>
                                            ))}
                                            {routines.length === 0 && <p style={{ color: '#444', fontSize: '0.8rem' }}>No hay rutinas creadas. Crea una primero.</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <h5 style={{ color: '#888', marginBottom: '10px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Rutinas en esta Sesión</h5>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '100px', padding: '15px', backgroundColor: '#000', borderRadius: '12px', border: '1px dashed #333' }}>
                                            {sessionRoutines.map((r, idx) => (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', padding: '10px', borderRadius: '8px', border: '1px solid #222' }}>
                                                    <span style={{ fontSize: '0.9rem' }}>{idx + 1}. {r.name}</span>
                                                    <button onClick={() => removeRoutineFromSessionList(idx)} style={{ color: '#ff4d4d', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                                                </div>
                                            ))}
                                            {sessionRoutines.length === 0 && <p style={{ color: '#444', fontSize: '0.8rem', textAlign: 'center' }}>Añade rutinas desde la izquierda</p>}
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                            <button
                                                onClick={handleSessionSubmit}
                                                disabled={uploading}
                                                style={{ ...saveButtonStyle, flex: 1 }}
                                            >
                                                {uploading ? 'Guardando...' : (editingSession ? 'Actualizar Bloque de Sesión' : 'Guardar Bloque de Sesión')}
                                            </button>
                                            {editingSession && (
                                                <button
                                                    onClick={() => { setEditingSession(null); setSessionName(''); setSessionRoutines([]); }}
                                                    style={cancelButtonStyle}
                                                >
                                                    Cancelar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={listStyle}>
                                <h4 style={{ color: '#888', marginBottom: '20px' }}>Tus Sesiones Guardadas</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                                    {sessions.map(s => (
                                        <div key={s.id} style={itemCardStyle}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                <div>
                                                    <h4 style={{ margin: '0 0 10px 0' }}>{s.name}</h4>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                                        {s.routines?.map((r: AnyType, idx: number) => (
                                                            <span key={idx} style={{ fontSize: '0.7rem', backgroundColor: '#222', padding: '2px 8px', borderRadius: '10px', color: '#888' }}>
                                                                {r.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button onClick={() => startEditSession(s)} style={editIconButtonStyle}>✏️</button>
                                                    <button onClick={() => handleDeleteSession(s.id)} style={{ ...editIconButtonStyle, filter: 'grayscale(1) opacity(0.5)' }}>🗑️</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {sessions.length === 0 && <p style={{ color: '#444' }}>No hay sesiones guardadas en la biblioteca.</p>}
                                </div>
                            </div>
                        </section>
                    )}
                    {view === 'weeks' && (
                        <section style={managementSectionStyle}>
                            <h3 style={sectionTitleStyle}>Biblioteca de Bloques de Sesiones</h3>

                            <div style={formStyle}>
                                <h4 style={{ color: '#fff', marginBottom: '15px' }}>{editingWeek ? 'Editando Bloque' : 'Crear Nuevo Bloque de Sesiones'}</h4>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={labelStyle}>Nombre del Bloque</label>
                                    <input
                                        type="text"
                                        value={weekName}
                                        onChange={e => setWeekName(e.target.value)}
                                        placeholder="Ej: Bloque A - Fuerza"
                                        style={inputStyle}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
                                    <div style={{ flex: 1.2 }}>
                                        <div style={{ backgroundColor: '#000', borderRadius: '12px', border: '1px solid #222', padding: '20px', minHeight: '300px' }}>
                                            <h5 style={{ color: '#ff4d4d', margin: '0 0 15px 0' }}>Planificación del Bloque (Lista de Sesiones)</h5>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {weekSessions.map((s: AnyType, sIdx: number) => (
                                                    <div key={sIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', padding: '12px', borderRadius: '10px', border: '1px solid #333' }}>
                                                        <div>
                                                            <strong style={{ fontSize: '1.1rem', color: '#eee' }}>Sesión {sIdx + 1}: {s.name}</strong>
                                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{s.routines?.length || 0} bloques de rutina</div>
                                                        </div>
                                                        <button onClick={() => removeSessionFromWeek(sIdx)} style={{ color: '#ff4d4d', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                                                    </div>
                                                ))}
                                                {weekSessions.length === 0 && (
                                                    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#444' }}>
                                                        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📅</div>
                                                        <p>No hay sesiones en este bloque.<br />Añade sesiones desde el catálogo de la derecha.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                            <button
                                                onClick={handleWeekSubmit}
                                                disabled={uploading}
                                                style={{ ...saveButtonStyle, flex: 1 }}
                                            >
                                                {uploading ? 'Guardando...' : (editingWeek ? 'Actualizar Bloque' : 'Guardar Bloque de Sesiones')}
                                            </button>
                                            {editingWeek && (
                                                <button onClick={() => setEditingWeek(null)} style={cancelButtonStyle}>Cancelar</button>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h5 style={{ color: '#888', marginBottom: '15px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Sesiones Disponibles</h5>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
                                            {sessions.map(s => (
                                                <div key={s.id} style={{ ...itemCardStyle, padding: '12px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <strong style={{ fontSize: '0.9rem' }}>{s.name}</strong>
                                                            <p style={{ fontSize: '0.7rem', color: '#666', margin: 0 }}>{s.routines?.length || 0} bloques</p>
                                                        </div>
                                                        <button onClick={() => addSessionToWeek(s)} style={smallButtonStyle}>+ Añadir</button>
                                                    </div>
                                                </div>
                                            ))}
                                            {sessions.length === 0 && <p style={{ color: '#444', fontSize: '0.8rem' }}>No hay sesiones creadas.</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={listStyle}>
                                <h4 style={{ color: '#888', marginBottom: '20px' }}>Bloques de Sesiones Guardados</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                                    {weeks.map(w => (
                                        <div key={w.id} style={itemCardStyle}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ margin: '0 0 10px 0', color: '#fff' }}>{w.name}</h4>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                        {(w.sessions || []).map((s: AnyType, idx: number) => (
                                                            <div key={idx} style={{ fontSize: '0.85rem', color: '#888' }}>
                                                                <span style={{ color: '#ff4d4d' }}>Sesión {idx + 1}:</span> {s.name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button onClick={() => startEditWeek(w)} style={editIconButtonStyle}>✏️</button>
                                                    <button onClick={() => handleDeleteWeek(w.id)} style={{ ...editIconButtonStyle, filter: 'grayscale(1) opacity(0.5)' }}>🗑️</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {weeks.length === 0 && <p style={{ color: '#444' }}>No hay semanas guardadas en la biblioteca.</p>}
                                </div>
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}

// STYLES
const containerStyle: React.CSSProperties = {
    padding: '40px 20px',
    maxWidth: '1200px',
    margin: '0 auto',
    color: '#fff',
    fontFamily: 'inherit'
};

const hubGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '30px',
    padding: '20px 0'
};

const hubCardStyle: React.CSSProperties = {
    backgroundColor: '#111',
    padding: '40px 25px',
    borderRadius: '24px',
    border: '1px solid #333',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
    position: 'relative',
    overflow: 'hidden'
};

const iconStyle: React.CSSProperties = {
    fontSize: '3rem',
    background: 'linear-gradient(45deg, #ff4d4d, #ff8080)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '5px'
};

const cardTitleStyle: React.CSSProperties = {
    fontSize: '1.4rem',
    margin: 0,
    fontWeight: 'bold'
};

const cardDescStyle: React.CSSProperties = {
    fontSize: '0.9rem',
    color: '#888',
    margin: 0,
    lineHeight: '1.4'
};

const cardButtonStyle: React.CSSProperties = {
    marginTop: '10px',
    backgroundColor: 'transparent',
    border: '1px solid #ff4d4d',
    color: '#ff4d4d',
    padding: '8px 20px',
    borderRadius: '30px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s'
};

const backButtonStyle: React.CSSProperties = {
    background: '#222',
    border: '1px solid #333',
    color: '#888',
    padding: '10px 20px',
    borderRadius: '12px',
    cursor: 'pointer',
    marginBottom: '30px',
    fontSize: '0.9rem',
    transition: 'all 0.2s'
};

const managementSectionStyle: React.CSSProperties = {
    animation: 'fadeIn 0.4s ease-out'
};

const sectionTitleStyle: React.CSSProperties = {
    fontSize: '2rem',
    marginBottom: '30px',
    color: '#fff',
    borderLeft: '4px solid #ff4d4d',
    paddingLeft: '20px'
};

const headerActionStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
};

const formStyle: React.CSSProperties = {
    backgroundColor: '#161616',
    padding: '30px',
    borderRadius: '20px',
    marginBottom: '40px',
    border: '1px solid #333'
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 15px',
    borderRadius: '10px',
    border: '1px solid #333',
    backgroundColor: '#000',
    color: '#fff',
    fontSize: '1rem',
    outline: 'none',
    boxSizing: 'border-box'
};

const smallInputStyle: React.CSSProperties = {
    ...inputStyle,
    padding: '8px 10px',
    fontSize: '0.9rem',
    textAlign: 'center'
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '0.85rem',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '1px'
};

const microLabelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '4px',
    fontSize: '0.7rem',
    color: '#555',
    textTransform: 'uppercase'
};

const videoStatusIndicatorStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: '10px 15px',
    borderRadius: '10px',
    marginBottom: '10px',
    fontSize: '0.85rem',
    border: '1px solid #333'
};

const buttonStyle: React.CSSProperties = {
    backgroundColor: '#ff4d4d',
    color: '#fff',
    padding: '12px 25px',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 'bold',
    textDecoration: 'none',
    fontSize: '1rem',
    transition: 'background 0.2s'
};

const smallButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    padding: '8px 15px',
    fontSize: '0.8rem'
};

const miniButtonStyle: React.CSSProperties = {
    backgroundColor: '#222',
    color: '#fff',
    padding: '4px 8px',
    border: '1px solid #333',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.75rem'
};

const cancelButtonStyle: React.CSSProperties = {
    backgroundColor: '#333',
    color: '#ccc',
    padding: '12px 25px',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1rem'
};

const editIconButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: '1.1rem',
    cursor: 'pointer',
    padding: '5px',
    borderRadius: '6px',
    transition: 'background 0.2s',
    backgroundColor: 'rgba(255,255,255,0.05)'
};

const gridStyle: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px'
};

const itemCardStyle: React.CSSProperties = {
    backgroundColor: '#1a1a1a',
    padding: '25px',
    borderRadius: '18px',
    border: '1px solid #333'
};

const saveButtonStyle: React.CSSProperties = {
    backgroundColor: '#ff4d4d',
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '1rem'
};

const routineItemCardStyle: React.CSSProperties = {
    backgroundColor: '#0c0c0c',
    padding: '15px',
    borderRadius: '12px',
    border: '1px solid #222'
};

const listStyle: React.CSSProperties = {
    marginTop: '20px'
};

const listItemStyle: React.CSSProperties = {
    padding: '15px 20px',
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    border: '1px solid #222',
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.95rem',
    overflow: 'hidden'
};

const tagStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    backgroundColor: '#222',
    color: '#888',
    padding: '2px 8px',
    borderRadius: '10px',
    border: '1px solid #333'
};

const routineEditorLayout: React.CSSProperties = {
    display: 'flex',
    gap: '30px',
    alignItems: 'flex-start'
};

const fileInputContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%'
};

const fileInputStyle: React.CSSProperties = {
    opacity: 0,
    width: '100%',
    height: '45px',
    position: 'absolute',
    left: 0,
    top: 0,
    cursor: 'pointer',
    zIndex: 2
};

const fileLabelStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '12px 15px',
    backgroundColor: '#222',
    color: '#888',
    borderRadius: '10px',
    border: '1px dashed #444',
    textAlign: 'center',
    fontSize: '0.9rem',
    cursor: 'pointer',
    boxSizing: 'border-box'
};

const checkboxLabelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    backgroundColor: '#000',
    padding: '8px 15px',
    borderRadius: '8px',
    border: '1px solid #222'
};

const alertStyle: React.CSSProperties = {
    padding: '15px 20px',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    color: '#4caf50',
    borderRadius: '12px',
    marginBottom: '30px',
    border: '1px solid rgba(76, 175, 80, 0.3)',
    textAlign: 'center'
};
