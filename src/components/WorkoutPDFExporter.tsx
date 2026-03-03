'use client';

import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyType = any;

interface WorkoutPDFExporterProps {
    plan: AnyType;
    onComplete?: () => void;
}

export default function WorkoutPDFExporter({ plan, onComplete }: WorkoutPDFExporterProps) {
    const exportPDF = async () => {
        const container = document.getElementById(`pdf-content-${plan.id}`);
        if (!container) return;

        try {
            // Force temporary visibility for processing
            container.style.display = 'block';

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 15; // 15mm margin
            const contentWidth = pdfWidth - (margin * 2);

            let currentY = margin;

            // 1. Capture Header
            const header = container.querySelector('.pdf-header') as HTMLElement;
            if (header) {
                const canvas = await html2canvas(header, { scale: 2, backgroundColor: '#ffffff' });
                const imgData = canvas.toDataURL('image/png');
                const imgHeight = (canvas.height * contentWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', margin, currentY, contentWidth, imgHeight);
                currentY += imgHeight + 10;
            }

            // 2. Iterate through Weeks and their Sessions
            const weeks = container.querySelectorAll('.pdf-week-section');
            for (let i = 0; i < weeks.length; i++) {
                const week = weeks[i] as HTMLElement;

                // Capture Week Header
                const weekHeader = week.querySelector('.pdf-week-header') as HTMLElement;
                if (weekHeader) {
                    const canvas = await html2canvas(weekHeader, { scale: 2, backgroundColor: '#ffffff' });
                    const imgData = canvas.toDataURL('image/png');
                    const imgHeight = (canvas.height * contentWidth) / canvas.width;

                    // Check if week header fits, if not, new page (though unlikely to not fit alone)
                    if (currentY + imgHeight > pdfHeight - margin) {
                        pdf.addPage();
                        currentY = margin;
                    }

                    pdf.addImage(imgData, 'PNG', margin, currentY, contentWidth, imgHeight);
                    currentY += imgHeight + 5;
                }

                // Capture each Session independently to prevent cutting
                const sessions = week.querySelectorAll('.pdf-session-card');
                for (let j = 0; j < sessions.length; j++) {
                    const session = sessions[j] as HTMLElement;
                    const canvas = await html2canvas(session, { scale: 2, backgroundColor: '#ffffff' });
                    const imgData = canvas.toDataURL('image/png');
                    const imgHeight = (canvas.height * contentWidth) / canvas.width;

                    // If it doesn't fit in current page, move to next
                    if (currentY + imgHeight > pdfHeight - margin) {
                        pdf.addPage();
                        currentY = margin;

                        // Optional: Repeat week header on new page for context? 
                        // For now just continue.
                    }

                    pdf.addImage(imgData, 'PNG', margin, currentY, contentWidth, imgHeight);
                    currentY += imgHeight + 10; // Space between sessions
                }

                currentY += 5; // Extra space after a week
            }

            // 3. Add Footer
            const footer = container.querySelector('.pdf-footer') as HTMLElement;
            if (footer) {
                const canvas = await html2canvas(footer, { scale: 2, backgroundColor: '#ffffff' });
                const imgData = canvas.toDataURL('image/png');
                const imgHeight = (canvas.height * contentWidth) / canvas.width;

                if (currentY + imgHeight > pdfHeight - margin) {
                    pdf.addPage();
                    currentY = margin;
                }
                pdf.addImage(imgData, 'PNG', margin, currentY, contentWidth, imgHeight);
            }

            pdf.save(`${plan.name.replace(/\s+/g, '_')}_Plan.pdf`);

            // Hide again
            container.style.display = 'none';
            if (onComplete) onComplete();
        } catch (error) {
            console.error('Error generating PDF:', error);
            container.style.display = 'none';
        }
    };

    return (
        <>
            <button
                onClick={exportPDF}
                className="pdf-download-btn"
                style={{
                    backgroundColor: 'rgba(255, 77, 77, 0.1)',
                    color: '#ff4d4d',
                    border: '1px solid #ff4d4d',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'all 0.2s',
                    marginTop: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#ff4d4d';
                    e.currentTarget.style.color = '#fff';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 77, 77, 0.1)';
                    e.currentTarget.style.color = '#ff4d4d';
                }}
            >
                <span>📥</span> Descargar PDF
            </button>

            {/* Hidden content for PDF generation with structured classes */}
            <div
                id={`pdf-content-${plan.id}`}
                style={{
                    display: 'none',
                    position: 'absolute',
                    left: '-9999px',
                    width: '180mm', // Adjusted for margin
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    fontFamily: 'Arial, sans-serif',
                }}
            >
                {/* Header Section */}
                <div className="pdf-header" style={{ paddingBottom: '15px', borderBottom: '3px solid #ff4d4d', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <h1 style={{ color: '#000', margin: '0 0 5px 0', fontSize: '2.5rem', fontWeight: 'bold' }}>{plan.name}</h1>
                            <p style={{ color: '#666', margin: 0, fontSize: '1.2rem', fontStyle: 'italic' }}>{plan.description || 'Plan de entrenamiento personalizado'}</p>
                        </div>
                        <div style={{ color: '#ff4d4d', fontWeight: 'bold', fontSize: '1.5rem' }}>TITAN</div>
                    </div>
                </div>

                {plan.weeks && plan.weeks.map((week: AnyType, wIdx: number) => (
                    <div key={wIdx} className="pdf-week-section" style={{ marginBottom: '30px' }}>
                        {/* Week Header */}
                        <div className="pdf-week-header" style={{
                            backgroundColor: '#000',
                            color: '#fff',
                            padding: '12px 20px',
                            marginBottom: '15px',
                            borderRadius: '4px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h2 style={{ margin: 0, fontSize: '1.6rem', textTransform: 'uppercase' }}>SEMANA {week.number}</h2>
                            <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>Bloque de Sesiones</span>
                        </div>

                        {/* Sessions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {week.sessions && week.sessions.map((session: AnyType, sIdx: number) => (
                                <div key={sIdx} className="pdf-session-card" style={{ border: '2px solid #f0f0f0', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff' }}>
                                    <div style={{ backgroundColor: '#f9f9f9', padding: '10px 15px', borderBottom: '2px solid #f0f0f0' }}>
                                        <h3 style={{ margin: 0, color: '#ff4d4d', fontSize: '1.2rem' }}>
                                            {session.name}
                                        </h3>
                                    </div>

                                    <div style={{ padding: '15px' }}>
                                        {session.routines && session.routines.map((routine: AnyType, rIdx: number) => (
                                            <div key={rIdx} style={{ marginBottom: rIdx < session.routines.length - 1 ? '20px' : 0 }}>
                                                <h4 style={{
                                                    margin: '0 0 10px 0',
                                                    fontSize: '1rem',
                                                    color: '#333',
                                                    borderLeft: '4px solid #ff4d4d',
                                                    paddingLeft: '10px'
                                                }}>
                                                    {routine.name}
                                                </h4>

                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <thead>
                                                        <tr style={{ textAlign: 'left', backgroundColor: '#fafafa' }}>
                                                            <th style={{ padding: '8px', borderBottom: '2px solid #eee', color: '#666', fontSize: '0.8rem', width: '45%' }}>EJERCICIO</th>
                                                            <th style={{ padding: '8px', borderBottom: '2px solid #eee', color: '#666', fontSize: '0.8rem', textAlign: 'center' }}>SERIES</th>
                                                            <th style={{ padding: '8px', borderBottom: '2px solid #eee', color: '#666', fontSize: '0.8rem', textAlign: 'center' }}>REPETICIONES</th>
                                                            <th style={{ padding: '8px', borderBottom: '2px solid #eee', color: '#666', fontSize: '0.8rem', textAlign: 'center' }}>DESCANSO</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {routine.exercises && routine.exercises.map((item: AnyType, eIdx: number) => (
                                                            <tr key={eIdx} style={{ borderBottom: '1px solid #eee' }}>
                                                                <td style={{ padding: '10px 8px', fontWeight: 'bold', fontSize: '0.9rem' }}>{item.exercise?.name}</td>
                                                                <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: '0.9rem' }}>{item.series}</td>
                                                                <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: '0.9rem' }}>
                                                                    {Array.isArray(item.reps) ? item.reps.join(' - ') : item.reps}
                                                                </td>
                                                                <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: '0.9rem' }}>{item.restingTime}s</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <div className="pdf-footer" style={{ marginTop: '30px', textAlign: 'center', borderTop: '2px solid #ff4d4d', paddingTop: '15px', fontSize: '0.85rem', color: '#999' }}>
                    Este plan ha sido diseñado profesionalmente para tu progreso.<br />
                    <strong>TITAN - Tu asistente de entrenamiento personal</strong>
                </div>
            </div>
        </>
    );
}
