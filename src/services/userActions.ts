'use server';

import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function createUser(formData: FormData) {
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const role = formData.get('role') as Role;

    if (!email || !role) {
        throw new Error('Email y Rol son obligatorios');
    }

    try {
        await prisma.user.create({
            data: {
                email,
                name,
                role,
            },
        });
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
