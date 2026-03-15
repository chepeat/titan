'use client';

import React, { useState, useEffect, useRef } from 'react';
import { logExerciseProgress } from '@/services/workoutActions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyType = any;

interface RoutineDetailViewProps {
    sessionId: string;
    userId: string;
    routine: AnyType; // Using any for simplicity as it matches the dynamic schema
    onNext: () => void;
    onBack: () => void;
    isLastRoutine: boolean;
    initialLogs: AnyType[];
}

export default function RoutineDetailView({
    sessionId,
    userId,
    routine,
    onNext,
    onBack,
    isLastRoutine,
    initialLogs
}: RoutineDetailViewProps) {
    const [logs, setLogs] = useState<Record<string, number | string>>(() => {
        const initialMap: Record<string, number | string> = {};
        initialLogs.forEach(log => {
            // Keep the last weight logged for the exercise as the routine's weight
            initialMap[log.exerciseId] = log.weight;
        });
        return initialMap;
    });

    const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
    const [timerActive, setTimerActive] = useState(false);
    const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        setTimerActive(false);
        setTimerSeconds(null);
        if (timerRef.current) clearInterval(timerRef.current);

        // Reset logs when routine changes to avoid carrying over weights from previous routine
        // We re-initialize from initialLogs if available for the new routine
        const initialMap: Record<string, number | string> = {};
        initialLogs.forEach(log => {
            initialMap[log.exerciseId] = log.weight;
        });
        setLogs(initialMap);
    }, [routine.id, initialLogs]);

    useEffect(() => {
        if (timerActive && timerSeconds !== null && timerSeconds > 0) {
            timerRef.current = setInterval(() => {
                setTimerSeconds(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
            }, 1000);
        } else if (timerSeconds === 0) {
            setTimerActive(false);
            if (timerRef.current) clearInterval(timerRef.current);
            // Optional: Play a sound or visual cue
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [timerActive, timerSeconds]);

    const handleWeightChange = async (exerciseId: string, weight: string) => {
        if (weight === '') {
            setLogs(prev => ({ ...prev, [exerciseId]: '' }));
            return;
        }

        const weightNum = parseFloat(weight);
        if (isNaN(weightNum)) return;

        // Optimistic update
        setLogs(prev => ({
            ...prev,
            [exerciseId]: weightNum
        }));

        // Log it as the first series (standardized for "one weight per routine")
        await logExerciseProgress(userId, sessionId, exerciseId, 0, weightNum);
    };

    const startTimer = (seconds: number) => {
        setTimerSeconds(seconds);
        setTimerActive(true);
    };

    const getYouTubeId = (url: string) => {
        if (!url) return null;
        if (url.includes('youtube.com/embed/')) return url.split('embed/')[1]?.split('?')[0];
        if (url.includes('youtube.com/watch?v=')) return url.split('v=')[1]?.split('&')[0];
        if (url.includes('youtu.be/')) return url.split('youtu.be/')[1]?.split('?')[0];
        return null;
    };

    const getEmbedUrl = (url: string) => {
        if (!url) return null;
        if (url.includes('youtube.com/embed/')) return url;
        const videoId = getYouTubeId(url);
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
        return url; // Return as is if not recognized as YouTube
    };

    const getThumbnailUrl = (url: string) => {
        const videoId = getYouTubeId(url);
        if (videoId) {
            return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
        return null;
    };

    const isExternalUrl = (url: string | null) => {
        if (!url) return false;
        return url.startsWith('http') && (url.includes('youtube.com') || url.includes('youtu.be'));
    };

    return (
        <div style={containerStyle}>
            <div style={headerStyle(isMobile, timerActive)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', width: '100%' }}>
                    <button onClick={onBack} style={{ ...backButtonStyle, padding: '6px 10px', marginBottom: 0 }}>←</button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, overflow: 'hidden' }}>
                        <h2 style={{ ...titleStyle(isMobile), margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {routine.name}
                        </h2>
                    </div>
                </div>
            </div>

            <div style={exerciseListStyle}>
                {routine.exercises.map((item: AnyType) => {
                    const videoUrl = item.exercise?.videoFile || item.exercise?.videoUrl;
                    const isExternal = isExternalUrl(videoUrl);

                    return (
                        <div key={item.id} style={exerciseCardStyle}>
                            <div style={exerciseHeaderStyle}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                                        <div style={{ ...prominentMachineHeaderStyle, fontSize: isMobile ? '1.1rem' : '1.5rem', padding: isMobile ? '8px 16px' : '12px 24px' }}>
                                            {item.machine?.number
                                                ? `MÁQUINA Nº ${item.machine.number}`
                                                : (item.exercise?.machines?.[0]?.number
                                                    ? `MÁQUINA Nº ${item.exercise.machines[0].number}`
                                                    : 'MÁQUINA GENERICA')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style={horizontalSeriesContainerStyle}>
                                {Array.from({ length: item.series }).map((_, idx) => (
                                    <div key={idx} style={{ ...seriesCardStyle, minWidth: isMobile ? '80px' : '100px', padding: isMobile ? '1rem 0.5rem' : '1.5rem 1rem' }}>
                                        <span style={seriesIdxStyle}>{idx + 1}</span>
                                        <span style={{ ...repsStyle, fontSize: isMobile ? '1.8rem' : '2.5rem' }}>
                                            {Array.isArray(item.reps) ? item.reps[idx] || item.reps[0] : item.reps}
                                        </span>
                                        <span style={{ fontSize: isMobile ? '0.7rem' : '0.9rem', color: '#666' }}>REPS</span>
                                    </div>
                                ))}
                            </div>

                            <div style={exerciseContentContainerStyle}>
                                {/* Information and Video Column */}
                                <div style={infoColStyle}>
                                    <h3 style={{ ...exerciseNameStyle, fontSize: isMobile ? '1.3rem' : '1.8rem' }}>{item.exercise?.name}</h3>
                                    {videoUrl ? (
                                        <div
                                            onClick={() => setActiveVideoUrl(videoUrl)}
                                            style={{
                                                ...largeVideoPreviewStyle,
                                                backgroundImage: getThumbnailUrl(videoUrl) ? `url(${getThumbnailUrl(videoUrl)})` : 'none',
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            {!isExternal && (
                                                <video
                                                    src={`${videoUrl}#t=0.1`}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
                                                    preload="metadata"
                                                    muted
                                                    playsInline
                                                />
                                            )}
                                            <div style={{
                                                ...playOverlayStyle,
                                                backgroundColor: (getThumbnailUrl(videoUrl) || !isExternal) ? 'rgba(0,0,0,0.4)' : 'transparent',
                                                zIndex: 1
                                            }}>
                                                <span style={{ fontSize: isMobile ? '2rem' : '3rem' }}>▶</span>
                                                <span style={{ fontWeight: 'bold', fontSize: isMobile ? '0.8rem' : '1rem' }}>VER VÍDEO</span>
                                            </div>
                                            {!getThumbnailUrl(videoUrl) && isExternal && (
                                                <div style={placeholderImageStyle}>
                                                    <span style={{ fontSize: isMobile ? '3rem' : '4rem', opacity: 0.3 }}>🏋️‍♂️</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={placeholderImageStyle}>
                                            <span style={{ fontSize: isMobile ? '3.5rem' : '5rem', opacity: 0.2 }}>🏋️‍♀️</span>
                                            <span style={{ color: '#444', fontSize: isMobile ? '0.8rem' : '1rem' }}>Sin vídeo</span>
                                        </div>
                                    )}
                                </div>

                                {/* Interaction Column: Weight and Timer */}
                                <div style={interactionColStyle}>
                                    {timerSeconds !== null && (
                                        <div style={inlineTimerBoxStyle}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '4px' }}>
                                                <span style={{ fontSize: isMobile ? '1.8rem' : '2.5rem', fontWeight: 'bold', color: '#ff4d4d' }}>
                                                    {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        setTimerActive(false);
                                                        setTimerSeconds(null);
                                                    }}
                                                    style={stopTimerButtonStyle}
                                                >
                                                    PARAR
                                                </button>
                                            </div>
                                            <span style={{ fontSize: '0.7rem', color: '#666' }}>RECUPERACIÓN EN CURSO</span>
                                        </div>
                                    )}
                                    <div style={{ ...weightEntryBoxStyle, padding: isMobile ? '1.2rem' : '1.5rem', marginBottom: '10px' }}>
                                        <label style={{ fontSize: isMobile ? '1rem' : '1.2rem', color: '#aaa', marginBottom: '8px' }}>PESO UTILIZADO (kg)</label>
                                        <input
                                            type="number"
                                            value={logs[item.exerciseId] ?? ''}
                                            onChange={(e) => handleWeightChange(item.exerciseId, e.target.value)}
                                            style={{ ...weightInputHeaderStyle, width: isMobile ? '130px' : '180px', fontSize: isMobile ? '1.8rem' : '2.5rem', padding: isMobile ? '0.8rem' : '1.5rem' }}
                                        />
                                    </div>
                                    <button
                                        onClick={() => startTimer(parseInt(item.restingTime) || 60)}
                                        style={{ ...bigRestButtonStyle, fontSize: isMobile ? '1.2rem' : '1.5rem', padding: isMobile ? '15px' : '20px' }}
                                    >
                                        Iniciar Descanso ({item.restingTime}s)
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={footerStyle}>
                <button onClick={onNext} style={nextButtonStyle(isMobile)}>
                    {isLastRoutine ? 'Finalizar Sesión' : 'Siguiente Rutina →'}
                </button>
            </div>

            {/* Video Modal Integration */}
            {activeVideoUrl && (
                <div style={modalOverlayStyle} onClick={() => setActiveVideoUrl(null)}>
                    <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
                        <button style={closeButtonStyle} onClick={() => setActiveVideoUrl(null)}>✕</button>
                        {isExternalUrl(activeVideoUrl) ? (
                            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px' }}>
                                <iframe
                                    src={getEmbedUrl(activeVideoUrl) || ''}
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        ) : (
                            <video src={activeVideoUrl} controls autoPlay playsInline style={videoPlayerStyle} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const containerStyle: React.CSSProperties = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '1rem',
    color: '#fff',
};

const headerStyle: (isMobile: boolean, isActive: boolean) => React.CSSProperties = (isMobile, isActive) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: isMobile ? '1rem' : '2rem',
    borderBottom: '1px solid #222',
    position: 'sticky',
    top: 0,
    backgroundColor: 'rgba(5, 5, 5, 0.95)',
    zIndex: 100,
    backdropFilter: 'blur(10px)',
    boxShadow: isActive ? '0 4px 20px rgba(255, 77, 77, 0.2)' : 'none',
});

const titleStyle: (isMobile: boolean) => React.CSSProperties = (isMobile) => ({
    fontSize: isMobile ? '1.3rem' : '1.8rem',
    margin: 0,
    color: '#ff4d4d',
    fontWeight: 'bold',
});

const backButtonStyle: React.CSSProperties = {
    background: 'none',
    border: '1px solid #333',
    color: '#888',
    padding: '8px 12px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '1.2rem',
};

const exerciseListStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    marginBottom: '5rem',
};

const exerciseCardStyle: React.CSSProperties = {
    backgroundColor: '#111',
    borderRadius: '24px',
    padding: '1.2rem',
    marginBottom: '2rem',
    border: '1px solid #222',
    boxSizing: 'border-box',
    width: '100%',
    overflow: 'hidden',
};

const exerciseHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '10px',
};

const prominentMachineHeaderStyle: React.CSSProperties = {
    backgroundColor: '#ff4d4d',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: '12px',
    fontSize: '1.5rem',
    fontWeight: '900',
    boxShadow: '0 6px 15px rgba(255, 77, 77, 0.5)',
    whiteSpace: 'nowrap',
};

const exerciseNameStyle: React.CSSProperties = {
    fontSize: '1.8rem',
    margin: 0,
    fontWeight: 'bold',
};

const horizontalSeriesContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '15px',
    overflowX: 'auto',
    padding: '10px 5px 25px 5px',
    marginBottom: '20px',
    borderBottom: '1px solid #222',
};

const seriesCardStyle: React.CSSProperties = {
    flex: '1',
    minWidth: '100px',
    backgroundColor: '#0a0a0a',
    borderRadius: '16px',
    padding: '1.5rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '5px',
    border: '1px solid #1a1a1a',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
};

const exerciseContentContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '2rem',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    width: '100%',
    boxSizing: 'border-box',
};

const infoColStyle: React.CSSProperties = {
    flex: '1.5',
    minWidth: '280px',
    maxWidth: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    boxSizing: 'border-box',
};

const interactionColStyle: React.CSSProperties = {
    flex: '1',
    minWidth: '280px',
    maxWidth: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    boxSizing: 'border-box',
};

const inlineTimerBoxStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 77, 77, 0.05)',
    padding: '1rem 1.5rem',
    borderRadius: '16px',
    border: '1px solid rgba(255, 77, 77, 0.2)',
    marginBottom: '10px',
    width: '100%',
    boxSizing: 'border-box',
};

const stopTimerButtonStyle: React.CSSProperties = {
    backgroundColor: '#222',
    color: '#ff4d4d',
    border: '1px solid #333',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    cursor: 'pointer',
};

const weightEntryBoxStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    padding: '2rem',
    borderRadius: '20px',
    border: '1px solid #222',
};

const largeVideoPreviewStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    aspectRatio: '16/9',
    backgroundColor: '#050505',
    borderRadius: '16px',
    border: '2px solid #222',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s',
};

const playOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
    zIndex: 2,
    color: '#ff4d4d',
    transition: 'all 0.3s',
};

const placeholderImageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: '16px',
    border: '2px solid #1a1a1a',
};



const seriesIdxStyle: React.CSSProperties = {
    fontSize: '1rem',
    color: '#ff4d4d',
    fontWeight: 'bold',
    opacity: 0.8,
};

const repsStyle: React.CSSProperties = {
    fontSize: '2.5rem',
    fontWeight: '900',
    color: '#fff',
};


const bigRestButtonStyle: React.CSSProperties = {
    backgroundColor: '#333',
    border: '1px solid #444',
    color: '#fff',
    padding: '20px',
    borderRadius: '16px',
    cursor: 'pointer',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    transition: 'all 0.2s',
    marginTop: '20px',
    width: '100%',
};

const weightInputHeaderStyle: React.CSSProperties = {
    backgroundColor: '#000',
    border: '2px solid #ff4d4d',
    color: '#fff',
    padding: '1.5rem',
    borderRadius: '16px',
    width: '180px',
    fontSize: '2.5rem',
    fontWeight: '900',
    textAlign: 'center',
    outline: 'none',
};

const footerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 10, 10, 0.95)',
    padding: '1rem',
    borderTop: '1px solid #222',
    display: 'flex',
    justifyContent: 'center',
    zIndex: 10,
    backdropFilter: 'blur(5px)',
};

const nextButtonStyle: (isMobile: boolean) => React.CSSProperties = (isMobile) => ({
    backgroundColor: '#ff4d4d',
    color: '#fff',
    border: 'none',
    padding: isMobile ? '1rem 2rem' : '1.5rem 5rem',
    borderRadius: '16px',
    fontSize: isMobile ? '1.2rem' : '1.8rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 8px 25px rgba(255, 77, 77, 0.4)',
    width: isMobile ? '90%' : 'auto',
});


const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '1rem',
};

const modalContentStyle: React.CSSProperties = {
    position: 'relative',
    maxWidth: '900px',
    width: '100%',
};

const closeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '-40px',
    right: 0,
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '2rem',
    cursor: 'pointer',
};

const videoPlayerStyle: React.CSSProperties = {
    width: '100%',
    borderRadius: '12px',
};
