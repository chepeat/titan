import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import WorkoutEditor from '@/components/WorkoutEditor';
import { redirect } from 'next/navigation';

export default async function NewWorkoutPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
    });

    if (!dbUser || (dbUser.role !== 'COACH' && dbUser.role !== 'ADMIN')) {
        redirect('/');
    }

    return (
        <main style={{ backgroundColor: '#0a0a0a', minHeight: '100vh' }}>
            <WorkoutEditor coachId={dbUser.id} />
        </main>
    );
}
