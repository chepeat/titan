'use client';

import React, { useState } from 'react';

export interface GymZoneInfo {
    id: 'A' | 'B' | 'C';
    name: string;
    positionLabel: string;
    rangeLabel: string;
    points: [number, number][];
    labelPos: [number, number];
}

export const GYM_ZONES: GymZoneInfo[] = [
    {
        id: 'C',
        name: 'Zona C',
        positionLabel: 'Izquierda',
        rangeLabel: 'Máquinas 41+',
        points: [[25, 20], [40, 20], [29, 98], [1, 98]],
        labelPos: [23, 62]
    },
    {
        id: 'B',
        name: 'Zona B',
        positionLabel: 'Centro',
        rangeLabel: 'Máquinas 21–40',
        points: [[41, 20], [56, 20], [60, 98], [31, 98]],
        labelPos: [47, 62]
    },
    {
        id: 'A',
        name: 'Zona A',
        positionLabel: 'Derecha',
        rangeLabel: 'Máquinas 1–20',
        points: [[57, 20], [72, 20], [99, 98], [62, 98]],
        labelPos: [74, 62]
    }
];

export function getMachineZone(machineNumber?: number | null): GymZoneInfo | null {
    if (machineNumber == null || isNaN(Number(machineNumber)) || Number(machineNumber) < 1) {
        return null;
    }
    const num = Number(machineNumber);
    if (num <= 20) return GYM_ZONES.find(z => z.id === 'A')!;
    if (num <= 40) return GYM_ZONES.find(z => z.id === 'B')!;
    return GYM_ZONES.find(z => z.id === 'C')!;
}

interface GymZoneMapProps {
    machineNumber?: number | null;
    machineDescription?: string | null;
    compact?: boolean;
}

export default function GymZoneMap({
    machineNumber,
    machineDescription,
    compact = false
}: GymZoneMapProps) {
    const [expanded, setExpanded] = useState(false);
    const activeZone = getMachineZone(machineNumber);

    if (!activeZone) return null;

    const renderMapGraphic = (isModal = false) => (
        <div
            onClick={() => !isModal && setExpanded(true)}
            style={{
                position: 'relative',
                width: '100%',
                borderRadius: isModal ? '14px' : '12px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 77, 77, 0.4)',
                backgroundColor: '#050505',
                cursor: isModal ? 'default' : 'zoom-in',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.45)'
            }}
            title={isModal ? undefined : 'Pulsa para ampliar el plano'}
        >
            <img
                src="/gym-map.jpg"
                alt="Plano de zonas del gimnasio"
                style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    filter: 'brightness(0.75) contrast(1.05)'
                }}
            />

            <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none'
                }}
            >
                {GYM_ZONES.map(zone => {
                    const isActive = zone.id === activeZone.id;
                    const pointsAttr = zone.points.map(p => p.join(',')).join(' ');
                    const [lx, ly] = zone.labelPos;

                    return (
                        <g key={zone.id}>
                            <polygon
                                points={pointsAttr}
                                fill={isActive ? 'rgba(255, 77, 77, 0.42)' : 'rgba(15, 15, 15, 0.45)'}
                                stroke={isActive ? '#ff4d4d' : 'rgba(255, 255, 255, 0.3)'}
                                strokeWidth={isActive ? '1.1' : '0.4'}
                                strokeDasharray={isActive ? undefined : '1.5,1'}
                            />

                            {/* Zone label badge */}
                            <rect
                                x={lx - 10}
                                y={ly - (isActive ? 7.5 : 5)}
                                width="20"
                                height={isActive ? '15' : '10'}
                                rx="2.5"
                                fill={isActive ? '#ff4d4d' : 'rgba(0, 0, 0, 0.72)'}
                                stroke={isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.25)'}
                                strokeWidth={isActive ? '0.5' : '0.25'}
                            />
                            <text
                                x={lx}
                                y={isActive ? ly - 1.5 : ly + 0.5}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#ffffff"
                                fontSize={isActive ? '4.2' : '3.3'}
                                fontWeight="900"
                            >
                                {zone.name.toUpperCase()}
                            </text>
                            {isActive && (
                                <text
                                    x={lx}
                                    y={ly + 4}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill="#ffe4e4"
                                    fontSize="2.7"
                                    fontWeight="700"
                                >
                                    MÁQ. {machineNumber}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>

            {!isModal && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        color: '#ccc',
                        fontSize: '0.7rem',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        pointerEvents: 'none'
                    }}
                >
                    🔍 Ampliar plano
                </div>
            )}
        </div>
    );

    return (
        <div
            style={{
                backgroundColor: '#0a0a0a',
                border: '1px solid #262626',
                borderRadius: '16px',
                padding: compact ? '10px' : '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                width: '100%',
                boxSizing: 'border-box'
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                        style={{
                            backgroundColor: '#ff4d4d',
                            color: '#fff',
                            fontWeight: 900,
                            fontSize: '0.8rem',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            letterSpacing: '0.4px'
                        }}
                    >
                        📍 {activeZone.name.toUpperCase()} ({activeZone.positionLabel})
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#bbb', fontWeight: 600 }}>
                        Máquina Nº {machineNumber}
                        {machineDescription ? ` · ${machineDescription}` : ''}
                    </span>
                </div>
            </div>

            {renderMapGraphic(false)}

            {expanded && (
                <div
                    onClick={() => setExpanded(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.88)',
                        zIndex: 1100,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '1rem',
                        backdropFilter: 'blur(5px)'
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            position: 'relative',
                            maxWidth: '900px',
                            width: '100%',
                            backgroundColor: '#111',
                            borderRadius: '18px',
                            padding: '16px',
                            border: '1px solid #333'
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '12px',
                                gap: '12px'
                            }}
                        >
                            <div>
                                <div style={{ color: '#ff4d4d', fontWeight: 900, fontSize: '1.1rem' }}>
                                    📍 {activeZone.name.toUpperCase()} — {activeZone.positionLabel}
                                </div>
                                <div style={{ color: '#aaa', fontSize: '0.85rem' }}>
                                    Máquina Nº {machineNumber}
                                    {machineDescription ? ` (${machineDescription})` : ''}
                                </div>
                            </div>
                            <button
                                onClick={() => setExpanded(false)}
                                style={{
                                    background: '#222',
                                    border: '1px solid #444',
                                    color: '#fff',
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    fontSize: '1.1rem'
                                }}
                            >
                                ✕
                            </button>
                        </div>
                        {renderMapGraphic(true)}
                    </div>
                </div>
            )}
        </div>
    );
}
