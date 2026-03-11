import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Fetching all RoutineItems and their relations...");
    const items = await prisma.routineItem.findMany({
        include: {
            routine: true,
            exercise: true
        }
    });

    console.log(`Found ${items.length} RoutineItems in the database.`);

    // Check if any belong to deleted/orphan routines or what kind of routines they belong to
    const orphanItems = items.filter(item => !item.routine);
    console.log(`Found ${orphanItems.length} orphaned RoutineItems (no routine attached).`);

    const activeRoutines = items.map(i => i.routine?.name).filter(Boolean);
    const uniqueRoutines = [...new Set(activeRoutines)];
    console.log(`These items belong to the following routines:`, uniqueRoutines);
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
