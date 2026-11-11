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
    allowExpand?: boolean;
}

export default function GymZoneMap({
    machineNumber,
    machineDescription,
    compact = false,
    allowExpand = true
}: GymZoneMapProps) {
    const [expanded, setExpanded] = useState(false);
    const activeZone = getMachineZone(machineNumber);

    const renderMapGraphic = (isModal = false) => (
        <div
            onClick={() => allowExpand && !isModal && setExpanded(true)}
            style={{
                position: 'relative',
                width: '100%',
                borderRadius: isModal ? '14px' : '12px',
                overflow: 'hidden',
                border: '2px solid rgba(255, 77, 77, 0.55)',
                backgroundColor: '#050505',
                cursor: allowExpand && !isModal ? 'zoom-in' : 'default',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5)'
            }}
            title={allowExpand && !isModal ? 'Pulsa para ampliar el plano' : undefined}
        >
            <img
                src="/gym-map.jpg"
                alt="Plano de zonas del gimnasio"
                style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    filter: 'brightness(0.78) contrast(1.05)'
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
                    const isActive = activeZone ? zone.id === activeZone.id : false;
                    const pointsAttr = zone.points.map(p => p.join(',')).join(' ');
                    const [lx, ly] = zone.labelPos;

                    return (
                        <g key={zone.id}>
                            <polygon
                                points={pointsAttr}
                                fill={
                                    isActive
                                        ? 'rgba(255, 77, 77, 0.45)'
                                        : activeZone
                                        ? 'rgba(10, 10, 10, 0.5)'
                                        : 'rgba(255, 77, 77, 0.18)'
                                }
                                stroke={isActive ? '#ff4d4d' : 'rgba(255, 255, 255, 0.35)'}
                                strokeWidth={isActive ? '1.2' : '0.45'}
                                strokeDasharray={isActive ? undefined : '1.5,1'}
                            />

                            {/* Zone label badge */}
                            <rect
                                x={lx - 11}
                                y={ly - (isActive ? 8 : 5.5)}
                                width="22"
                                height={isActive ? '16' : '11'}
                                rx="2.5"
                                fill={isActive ? '#ff4d4d' : 'rgba(0, 0, 0, 0.78)'}
                                stroke={isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.3)'}
                                strokeWidth={isActive ? '0.6' : '0.3'}
                            />
                            <text
                                x={lx}
                                y={isActive ? ly - 2 : ly - 1}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#ffffff"
                                fontSize={isActive ? '4.2' : '3.2'}
                                fontWeight="900"
                            >
                                {zone.name.toUpperCase()}
                            </text>
                            <text
                                x={lx}
                                y={isActive ? ly + 3.8 : ly + 3}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill={isActive ? '#ffe4e4' : '#cccccc'}
                                fontSize={isActive ? '2.7' : '2.1'}
                                fontWeight="700"
                            >
                                {isActive && machineNumber ? `MÁQ. ${machineNumber}` : zone.rangeLabel}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {allowExpand && !isModal && (
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                        style={{
                            backgroundColor: '#ff4d4d',
                            color: '#fff',
                            fontWeight: 900,
                            fontSize: compact ? '0.85rem' : '0.95rem',
                            padding: '5px 12px',
                            borderRadius: '999px',
                            letterSpacing: '0.4px'
                        }}
                    >
                        {activeZone
                            ? `📍 ${activeZone.name.toUpperCase()} (${activeZone.positionLabel})`
                            : '📍 PLANO DEL GIMNASIO (Zonas A, B y C)'}
                    </span>
                    {machineNumber && (
                        <span style={{ fontSize: '0.9rem', color: '#ddd', fontWeight: 700 }}>
                            Máquina Nº {machineNumber}
                            {machineDescription ? ` · ${machineDescription}` : ''}
                        </span>
                    )}
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
                                    {activeZone
                                        ? `📍 ${activeZone.name.toUpperCase()} — ${activeZone.positionLabel}`
                                        : '📍 PLANO DEL GIMNASIO'}
                                </div>
                                {machineNumber && (
                                    <div style={{ color: '#aaa', fontSize: '0.85rem' }}>
                                        Máquina Nº {machineNumber}
                                        {machineDescription ? ` (${machineDescription})` : ''}
                                    </div>
                                )}
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
