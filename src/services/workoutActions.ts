'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createAdminClient, createClient } from '@/lib/supabase/server';

// Exercise Actions
export async function getExercises() {
    try {
        return await prisma.exercise.findMany({
            include: {
                machines: true
            },
            orderBy: { name: 'asc' }
        });
    } catch (error: unknown) {
        console.error('Error fetching exercises:', error);
        return [];
    }
}

export async function createExercise(formData: FormData) {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const observations = formData.get('observations') as string;
    const videoFile = formData.get('videoFile') as File | null;
    const machineIds = formData.getAll('machineIds') as string[];

    let videoUrl = '';

    try {
        if (videoFile && videoFile.size > 0 && videoFile.name !== 'undefined') {
            const supabase = await createAdminClient();

            // Note: The bucket 'exercises' must exist and be public or have appropriate policies.
            const fileExt = videoFile.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `videos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('exercises')
                .upload(filePath, videoFile, {
                    contentType: videoFile.type,
                    upsert: false
                });

            if (uploadError) {
                console.error('Error uploading to Supabase Storage:', uploadError);
            } else {
                const { data: { publicUrl } } = supabase.storage
                    .from('exercises')
                    .getPublicUrl(filePath);
                videoUrl = publicUrl;
            }
        }

        await prisma.exercise.create({
            data: {
                name,
                description,
                observations,
                videoFile: videoUrl,
                machines: {
                    connect: machineIds.map(id => ({ id }))
                }
            }
        });
        revalidatePath('/');
        return { success: true };
    } catch (error: unknown) {
        console.error('Error in createExercise:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
}

export async function updateExercise(exerciseId: string, formData: FormData) {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const observations = formData.get('observations') as string;
    const videoFile = formData.get('videoFile') as File | null;
    const machineIds = formData.getAll('machineIds') as string[];

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {
            name,
            description,
            observations,
            machines: {
                set: machineIds.map(id => ({ id }))
            }
        };

        if (videoFile && videoFile.size > 0 && videoFile.name !== 'undefined') {
            const supabase = await createAdminClient();
            const fileExt = videoFile.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `videos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('exercises')
                .upload(filePath, videoFile, {
                    contentType: videoFile.type,
                    upsert: false
                });

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage
                    .from('exercises')
                    .getPublicUrl(filePath);
                updateData.videoFile = publicUrl;
            }
        }

        await prisma.exercise.update({
            where: { id: exerciseId },
            data: updateData
        });
        revalidatePath('/');
        return { success: true };
    } catch (error: unknown) {
        console.error('Error updating exercise:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
}

export async function deleteExercise(id: string) {
    try {
        await prisma.exercise.delete({ where: { id } });
        revalidatePath('/');
        return { success: true };
    } catch (error: unknown) {
        console.error('Error deleting exercise:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
}

// Machine Actions
export async function getMachines() {
    try {
        return await prisma.machine.findMany({
            orderBy: { number: 'asc' }
        });
    } catch (error: unknown) {
        console.error('Error fetching machines:', error);
        return [];
    }
}

export async function createMachine(formData: FormData) {
    const number = parseInt(formData.get('number') as string);
    const description = formData.get('description') as string;
    const observations = formData.get('observations') as string;
    const imageFile = formData.get('imageFile') as File | null;

    let imageUrl = '';

    try {
        if (imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
            const supabase = await createAdminClient();
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `images/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('machines')
                .upload(filePath, imageFile, {
                    contentType: imageFile.type,
                    upsert: false
                });

            if (uploadError) {
                console.error('Error uploading machine image:', uploadError);
            } else {
                const { data: { publicUrl } } = supabase.storage
                    .from('machines')
                    .getPublicUrl(filePath);
                imageUrl = publicUrl;
            }
        }

        await prisma.machine.create({
            data: {
                number,
                description,
                observations,
                imageFile: imageUrl
            }
        });
        revalidatePath('/');
        return { success: true };
    } catch (error: unknown) {
        console.error('Error creating machine:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
}

export async function updateMachine(machineId: string, formData: FormData) {
    const number = parseInt(formData.get('number') as string);
    const description = formData.get('description') as string;
    const observations = formData.get('observations') as string;
    const imageFile = formData.get('imageFile') as File | null;

    try {
        const updateData: { number: number; description: string; observations: string; imageFile?: string } = {
            number,
            description,
            observations
        };

        if (imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
            const supabase = await createAdminClient();
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `images/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('machines')
                .upload(filePath, imageFile, {
                    contentType: imageFile.type,
                    upsert: false
                });

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage
                    .from('machines')
                    .getPublicUrl(filePath);
                updateData.imageFile = publicUrl;
            }
        }

        await prisma.machine.update({
            where: { id: machineId },
            data: updateData
        });
        revalidatePath('/');
        return { success: true };
    } catch (error: unknown) {
        console.error('Error updating machine:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
}

export async function deleteMachine(id: string) {
    try {
        await prisma.machine.delete({ where: { id } });
        revalidatePath('/');
        return { success: true };
    } catch (error: unknown) {
        console.error('Error deleting machine:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
}

// Workout (TrainingPlan) Actions
export async function getTrainingPlans() {
    try {
        return await prisma.trainingPlan.findMany({
            include: {
                weeks: {
                    include: {
                        sessions: {
                            include: {
                                routines: {
                                    include: {
                                        exercises: {
                                            include: {
                                                exercise: true,
                                                machine: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { id: 'desc' }
        });
    } catch (error: unknown) {
        console.error('Error fetching training plans:', error);
        return [];
    }
}

export async function getTrainingPlan(id: string, userId?: string) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sessionInclude: any = {
            routines: {
                include: {
                    exercises: {
                        include: {
                            exercise: true,
                            machine: true
                        },
                        orderBy: { order: 'asc' }
                    }
                },
                orderBy: { order: 'asc' }
            }
        };

        if (userId) {
            sessionInclude.completions = {
                where: { userId }
            };
        }

        const plan = await prisma.trainingPlan.findUnique({
            where: { id },
            include: {
                weeks: {
                    include: {
                        sessions: {
                            include: sessionInclude,
                            orderBy: { dayNumber: 'asc' }
                        }
                    },
                    orderBy: { number: 'asc' }
                }
            }
        });

        if (!plan) return null;

        // Transform to include a flag for easy UI consumption
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transformedWeeks = (plan as any).weeks.map((week: any) => ({
            ...week,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sessions: week.sessions.map((session: any) => ({
                ...session,
                isCompleted: session.completions && session.completions.length > 0
            }))
        }));

        return { ...plan, weeks: transformedWeeks };
    } catch (error: unknown) {
        console.error('Error fetching training plan:', error);
        return null;
    }
}

interface ExercisesData {
    exerciseId?: string;
    exercise?: { id: string };
    series: number | string;
    reps: string[] | string;
    restingTime: number | string;
    machineId?: string;
    machine?: { id: string };
    order?: number | string;
}

interface RoutinesData {
    name: string;
    order?: number | string;
    exercises?: ExercisesData[];
    items?: ExercisesData[];
}

interface SessionsData {
    name: string;
    order?: number | string;
    routines: RoutinesData[];
}

interface WeeksData {
    number: number | string;
    sessions: SessionsData[];
}

interface TrainingPlanData {
    name: string;
    description?: string;
    coachId: string;
    weeks: WeeksData[];
}

export async function createTrainingPlan(data: TrainingPlanData) {
    try {
        const plan = await prisma.trainingPlan.create({
            data: {
                name: data.name,
                description: data.description,
                coachId: data.coachId,
                weeks: {
                    create: (data.weeks || []).map((week) => ({
                        number: parseInt(String(week.number)) || 0,
                        sessions: {
                            create: (week.sessions || []).map((session, sIdx) => ({
                                name: String(session.name),
                                order: sIdx,
                                dayNumber: 0, // Keeping for schema compatibility but not used for grouping
                                routines: {
                                    create: (session.routines || []).map((routine, rIdx) => ({
                                        name: String(routine.name),
                                        order: rIdx,
                                        exercises: {
                                            create: (routine.exercises || routine.items || []).map((item, eIdx) => ({
                                                series: parseInt(String(item.series)) || 3,
                                                reps: Array.isArray(item.reps) ? item.reps : (typeof item.reps === 'string' ? item.reps.split(',') : ["10", "10", "10"]),
                                                restingTime: parseInt(String(item.restingTime)) || 60,
                                                order: eIdx,
                                                exercise: { connect: { id: String(item.exerciseId || item.exercise?.id) } },
                                                machine: (item.machineId || item.machine?.id) ? { connect: { id: String(item.machineId || item.machine?.id) } } : undefined
                                            }))
                                        }
                                    }))
                                }
                            }))
                        }
                    }))
                }
            }
        });
        revalidatePath('/');
        return { success: true, id: plan.id };
    } catch (error: unknown) {
        console.error('Error creating training plan:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
}

export async function updateTrainingPlan(id: string, data: TrainingPlanData) {
    try {
        // We do a transaction to ensure atomic update
        await prisma.$transaction([
            // 1. Delete all existing relations (cascading cleanup)
            // Note: In our schema, many relations don't have onDelete: Cascade explicitly set everywhere
            // so we manually clean up to be safe since we are recreating.
            prisma.week.deleteMany({ where: { trainingPlanId: id } }),

            // 2. Update the main plan and recreate everything
            prisma.trainingPlan.update({
                where: { id },
                data: {
                    name: data.name,
                    description: data.description,
                    weeks: {
                        create: (data.weeks || []).map((week) => ({
                            number: parseInt(String(week.number)) || 0,
                            sessions: {
                                create: (week.sessions || []).map((session, sIdx) => ({
                                    name: String(session.name),
                                    order: sIdx,
                                    dayNumber: 0,
                                    routines: {
                                        create: (session.routines || []).map((routine, rIdx) => ({
                                            name: String(routine.name),
                                            order: rIdx,
                                            exercises: {
                                                create: (routine.exercises || routine.items || []).map((item, eIdx) => ({
                                                    series: parseInt(String(item.series)) || 3,
                                                    reps: Array.isArray(item.reps) ? item.reps : (typeof item.reps === 'string' ? item.reps.split(',') : ["10", "10", "10"]),
                                                    restingTime: parseInt(String(item.restingTime)) || 60,
                                                    order: eIdx,
                                                    exercise: { connect: { id: String(item.exerciseId || item.exercise?.id) } },
                                                    machine: (item.machineId || item.machine?.id) ? { connect: { id: String(item.machineId || item.machine?.id) } } : undefined
                                                }))
                                            }
                                        }))
                                    }
                                }))
                            }
                        }))
                    }
                }
            })
        ]);

        revalidatePath('/');
        return { success: true, id };
    } catch (error: unknown) {
        console.error('Error updating training plan:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
}

export async function deleteTrainingPlan(id: string) {
    try {
        await prisma.trainingPlan.delete({ where: { id } });
        revalidatePath('/');
        return { success: true };
    } catch (error: unknown) {
        console.error('Error deleting training plan:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
}

// Routine Actions (Catalog)
export async function getRoutines(coachId?: string) {
    try {
        return await prisma.routine.findMany({
            where: {
                sessionId: null,
                coachId: coachId || undefined
            },
            include: {
                exercises: {
                    include: {
                        exercise: true,
                        machine: true
                    },
                    orderBy: { order: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    } catch (error: unknown) {
        console.error('Error fetching routines:', error);
        return [];
    }
}

export interface RoutineItemData {
    exerciseId?: string;
    exercise?: { id: string };
    series: number | string;
    reps: string[] | string;
    restingTime: number | string;
    machineId?: string;
    machine?: { id: string };
    order?: number | string;
}

export interface RoutineData {
    name: string;
    items?: RoutineItemData[];
    exercises?: RoutineItemData[];
    description?: string;
}

export async function createRoutine(data: RoutineData & { coachId?: string }) {
    try {
        await prisma.routine.create({
            data: {
                name: data.name,
                description: data.description || null,
                coachId: data.coachId || null,
                order: 0,
                exercises: {
                    create: (data.exercises || data.items || []).map((item, index) => ({
                        series: parseInt(String(item.series)) || 3,
                        reps: Array.isArray(item.reps) ? item.reps : (typeof item.reps === 'string' ? item.reps.split(',') : ["10", "10", "10"]),
                        restingTime: parseInt(String(item.restingTime)) || 60,
                        order: index,
                        exercise: { connect: { id: String(item.exerciseId || item.exercise?.id) } },
                        machine: (item.machineId || item.machine?.id) ? { connect: { id: String(item.machineId || item.machine?.id) } } : undefined
                    }))
                }
            }
        });
        revalidatePath('/');
        return { success: true };
    } catch (error: unknown) {
        console.error('Error creating routine:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
}

export async function updateRoutine(routineId: string, data: RoutineData) {
    try {
        await prisma.$transaction([
            prisma.routineItem.deleteMany({
                where: { routineId: routineId }
            }),
            prisma.routine.update({
                where: { id: routineId },
                data: {
                    name: data.name,
                    description: data.description || undefined,
                    order: 0,
                    exercises: {
                        create: (data.exercises || data.items || []).map((item, index) => ({
                            series: parseInt(String(item.series)) || 3,
                            reps: Array.isArray(item.reps) ? item.reps : (typeof item.reps === 'string' ? item.reps.split(',') : ["10", "10", "10"]),
                            restingTime: parseInt(String(item.restingTime)) || 60,
                            order: index,
                            exercise: { connect: { id: String(item.exerciseId || item.exercise?.id) } },
                            machine: (item.machineId || item.machine?.id) ? { connect: { id: String(item.machineId || item.machine?.id) } } : undefined
                        }))
                    }
                }
            })
        ]);
        revalidatePath('/');
        return { success: true };
    } catch (error: unknown) {
        console.error('Error updating routine:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
}

export async function deleteRoutine(routineId: string) {
    try {
        await prisma.routine.delete({
            where: { id: routineId }
        });
        revalidatePath('/');
        return { success: true };
    } catch (error: unknown) {
        console.error('Error deleting routine:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
}

// Session Actions (Catalog)
export async function getSessionTemplates(coachId: string) {
    try {
        return await prisma.session.findMany({
            where: {
                weekId: null,
                coachId: coachId
            },
            include: {
                routines: {
                    include: {
                        exercises: {
                            include: {
                                exercise: true,
                                machine: true
                            },
                            orderBy: { order: 'asc' }
                        }
                    },
                    orderBy: { order: 'asc' }
                }
            },
            orderBy: { name: 'asc' }
        });
    } catch (error: unknown) {
        console.error('Error fetching session templates:', error);
        return [];
    }
}

export interface SessionData {
    name: string;
    routines: RoutineData[];
}

export async function createSessionTemplate(data: SessionData & { coachId: string }) {
    try {
        await prisma.session.create({
            data: {
                name: data.name,
                coachId: data.coachId,
                weekId: null,
                dayNumber: null,
                order: 0,
                routines: {
                    create: data.routines.map((r, rIdx) => ({
                        name: r.name,
                        order: rIdx,
                        coachId: data.coachId,
                        exercises: {
                            create: (r.exercises || r.items || []).map((e, eIdx) => ({
                                series: parseInt(String(e.series)) || 3,
                                reps: e.reps || ["10", "10", "10"],
                                restingTime: parseInt(String(e.restingTime)) || 60,
                                order: eIdx,
                                exercise: { connect: { id: String(e.exerciseId || e.exercise?.id) } },
                                machine: (e.machineId || e.machine?.id) ? { connect: { id: String(e.machineId || e.machine?.id) } } : undefined
                            }))
                        }
                    }))
                }
            }
        });
        revalidatePath('/');
        return { success: true };
    } catch (error: unknown) {
        console.error('Error creating session template:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
}

export async function updateSessionTemplate(sessionId: string, data: SessionData & { coachId: string }) {
    try {
        await prisma.$transaction([
            prisma.routine.deleteMany({
                where: { sessionId: sessionId }
            }),
            prisma.session.update({
                where: { id: sessionId },
                data: {
                    name: data.name,
                    routines: {
                        create: data.routines.map((r, rIdx) => ({
                            name: r.name,
                            order: rIdx,
                            coachId: data.coachId,
                            exercises: {
                                create: (r.exercises || r.items || []).map((e, eIdx) => ({
                                    series: parseInt(String(e.series)) || 3,
                                    reps: e.reps || ["10", "10", "10"],
                                    restingTime: parseInt(String(e.restingTime)) || 60,
                                    order: eIdx,
                                    exercise: { connect: { id: String(e.exerciseId || e.exercise?.id) } },
                                    machine: (e.machineId || e.machine?.id) ? { connect: { id: String(e.machineId || e.machine?.id) } } : undefined
                                }))
                            }
                        }))
                    }
                }
            })
        ]);
        revalidatePath('/');
        return { success: true };
    } catch (error: unknown) {
        console.error('Error updating session template:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
}

export async function deleteSessionTemplate(sessionId: string) {
    try {
        await prisma.session.delete({
            where: { id: sessionId }
        });
        revalidatePath('/');
        return { success: true };
    } catch (error: unknown) {
        console.error('Error deleting session template:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
}

// Week Actions (Catalog)
export async function getWeekTemplates(coachId: string) {
    try {
        return await prisma.week.findMany({
            where: {
                trainingPlanId: null,
                coachId: coachId
            },
            include: {
                sessions: {
                    include: {
                        routines: {
                            include: {
                                exercises: {
                                    include: {
                                        exercise: true,
                                        machine: true
                                    },
                                    orderBy: { order: 'asc' }
                                }
                            },
                            orderBy: { order: 'asc' }
                        }
                    },
                    orderBy: { dayNumber: 'asc' }
                }
            },
            orderBy: { name: 'asc' }
        });
    } catch (error: unknown) {
        console.error('Error fetching week templates:', error);
        return [];
    }
}

// DayData removed in favor of direct session list

export interface WeekUpdateData {
    name?: string;
    coachId?: string;
    sessions: SessionData[];
}

export async function createWeekTemplate(data: WeekUpdateData) {
    try {
        console.log('[DEBUG] Creating Week Template:', data.name);
        const coachId = data.coachId || null;

        const result = await prisma.week.create({
            data: {
                name: String(data.name || 'Sin nombre'),
                number: 0,
                coachId: coachId,
                sessions: {
                    create: (data.sessions || []).filter((s) => s && s.name).map((s, sIdx) => ({
                        name: String(s.name),
                        order: sIdx,
                        dayNumber: 0,
                        coachId: coachId,
                        routines: {
                            create: (s.routines || []).filter((r) => r && r.name).map((r, rIdx) => ({
                                name: String(r.name),
                                order: rIdx,
                                coachId: coachId,
                                exercises: {
                                    create: (r.exercises || r.items || []).filter((e) => e && (e.exerciseId || e.exercise?.id)).map((e, eIdx) => ({
                                        series: parseInt(String(e.series)) || 3,
                                        reps: Array.isArray(e.reps) ? e.reps : (typeof e.reps === 'string' ? e.reps.split(',') : ["10", "10", "10"]),
                                        restingTime: parseInt(String(e.restingTime)) || 60,
                                        order: eIdx,
                                        exercise: { connect: { id: String(e.exerciseId || e.exercise?.id) } },
                                        machine: (e.machineId || e.machine?.id) ? { connect: { id: String(e.machineId || e.machine?.id) } } : undefined
                                    }))
                                }
                            }))
                        }
                    }))
                }
            }
        });
        revalidatePath('/');
        return { success: true, id: result.id };
    } catch (error: unknown) {
        console.error('[ERROR] createWeekTemplate:', error);
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        return { success: false, error: 'PRISMA_ERR: ' + errorMsg };
    }
}

export async function updateWeekTemplate(weekId: string, data: WeekUpdateData) {
    try {
        console.log('[DEBUG] Updating Week Template:', weekId);
        const coachId = data.coachId || null;

        // In a real application, you might want a more sophisticated way to update nested relations,
        // but for a template editor, deleting and recreating is often simpler.
        await prisma.$transaction([
            // Delete existing sessions (routines and items will be deleted or orphaned depending on schema)
            // Note: Since RoutineItem has Cascade delete from Routine, we should delete Routines too.
            prisma.routine.deleteMany({
                where: { session: { weekId: weekId } }
            }),
            prisma.session.deleteMany({
                where: { weekId: weekId }
            }),
            prisma.week.update({
                where: { id: weekId },
                data: {
                    name: String(data.name || 'Sin nombre'),
                    coachId: coachId,
                    sessions: {
                        create: (data.sessions || []).filter((s) => s && s.name).map((s, sIdx) => ({
                            name: String(s.name),
                            order: sIdx,
                            dayNumber: 0,
                            coachId: coachId,
                            routines: {
                                create: (s.routines || []).filter((r) => r && r.name).map((r, rIdx) => ({
                                    name: String(r.name),
                                    order: rIdx,
                                    coachId: coachId,
                                    exercises: {
                                        create: (r.exercises || r.items || []).filter((e) => e && (e.exerciseId || e.exercise?.id)).map((e, eIdx) => ({
                                            series: parseInt(String(e.series)) || 3,
                                            reps: Array.isArray(e.reps) ? e.reps : (typeof e.reps === 'string' ? e.reps.split(',') : ["10", "10", "10"]),
                                            restingTime: parseInt(String(e.restingTime)) || 60,
                                            order: eIdx,
                                            exercise: { connect: { id: String(e.exerciseId || e.exercise?.id) } },
                                            machine: (e.machineId || e.machine?.id) ? { connect: { id: String(e.machineId || e.machine?.id) } } : undefined
                                        }))
                                    }
                                }))
                            }
                        }))
                    }
                }
            })
        ]);
        revalidatePath('/');
        return { success: true };
    } catch (error: unknown) {
        console.error('[ERROR] updateWeekTemplate:', error);
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        return { success: false, error: 'PRISMA_ERR: ' + errorMsg };
    }
}

export async function deleteWeekTemplate(weekId: string) {
    try {
        await prisma.week.delete({
            where: { id: weekId }
        });
        revalidatePath('/');
        return { success: true };
    } catch (error: unknown) {
        console.error('Error deleting week template:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
}

export async function toggleSessionCompletion(sessionId: string, completed: boolean) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No autenticado');

        const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (!dbUser) throw new Error('Usuario no encontrado');

        if (completed) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (prisma as any).sessionCompletion.upsert({
                where: {
                    userId_sessionId: {
                        userId: dbUser.id,
                        sessionId: sessionId
                    }
                },
                update: {},
                create: {
                    userId: dbUser.id,
                    sessionId: sessionId
                }
            });
        } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (prisma as any).sessionCompletion.deleteMany({
                where: {
                    userId: dbUser.id,
                    sessionId: sessionId
                }
            });
        }

        revalidatePath('/');
        return { success: true };
    } catch (error: unknown) {
        console.error('Error toggling session completion:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
}
