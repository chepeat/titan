import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Testing exercise creation...");
    try {
        const exercise = await prisma.exercise.create({
            data: {
                name: 'Test Exercise Debug',
                description: 'Test description',
                observations: null,
                videoFile: null,
                videoUrl: null
            }
        });
        console.log("Exercise created successfully:", exercise.id);

        // Clean up
        await prisma.exercise.delete({ where: { id: exercise.id } });
        console.log("Exercise cleaned up.");
    } catch (error) {
        console.error("Error creating exercise:", error);
    }

    console.log("\nTesting getMachines...");
    try {
        const machines = await prisma.machine.findMany({ orderBy: { number: 'asc' } });
        console.log(`Found ${machines.length} machines:`, machines.map(m => `#${m.number} ${m.description}`));
    } catch (error) {
        console.error("Error fetching machines:", error);
    }
}

main()
    .then(async () => { await prisma.$disconnect() })
    .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) });
