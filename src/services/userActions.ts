'use server';

import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

export async function createUser(formData: FormData) {
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const role = formData.get('role') as Role;

    if (!email || !role) {
        throw new Error('Email y Rol son obligatorios');
    }

    try {
        const password = randomBytes(8).toString('hex');
        const supabase = await createAdminClient();

        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role, name, mustChangePassword: true },
        });

        if (authError) {
            throw new Error('Supabase auth error: ' + authError.message);
        }

        await prisma.user.create({
            data: {
                email,
                name,
                role,
                supabaseId: authUser?.user.id,
            },
        });

        revalidatePath('/admin');
        return { success: true, password };
    } catch (error) {
        console.error('Error in createUser:', error);
        return { success: false, error: (error as Error).message };
    }
}

export async function updateUserRole(userId: string, role: Role) {
    try {
        const user = await prisma.user.update({
            where: { id: userId },
            data: { role },
        });

        if (user.supabaseId) {
            const supabase = await createAdminClient();
            await supabase.auth.admin.updateUserById(user.supabaseId, {
                user_metadata: { role }
            });
        }

        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function resetUserPassword(userId: string) {
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.supabaseId) throw new Error('Usuario no encontrado o sin ID de Supabase');

        const newPassword = randomBytes(8).toString('hex');
        const supabase = await createAdminClient();

        // Fetch current user data to preserve metadata
        const { data: { user: authUser }, error: getError } = await supabase.auth.admin.getUserById(user.supabaseId);
        if (getError || !authUser) throw new Error('Error al obtener datos de Supabase');

        const { error } = await supabase.auth.admin.updateUserById(user.supabaseId, {
            password: newPassword,
            user_metadata: { ...authUser.user_metadata, mustChangePassword: true }
        });

        if (error) throw error;

        return { success: true, password: newPassword };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function changePassword(password: string) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error('No autenticado');

        const { error: updateError } = await supabase.auth.updateUser({
            password,
            data: { mustChangePassword: false }
        });

        if (updateError) throw updateError;

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getUsers() {
    try {
        return await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

export async function getMembers() {
    try {
        return await prisma.user.findMany({
            where: { role: Role.USER },
            include: { trainingPlan: true },
            orderBy: { name: 'asc' },
        });
    } catch (error) {
        console.error('Error fetching members:', error);
        return [];
    }
}

export async function assignPlanToUser(userId: string, planId: string | null) {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { trainingPlanId: planId },
        });
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error assigning plan:', error);
        return { success: false, error: (error as Error).message };
    }
}
