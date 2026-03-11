import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Deleting all routines to start fresh...");

    // The user said they deleted all routines. We can delete all RoutineItems and Routines.
    // We already added cascade delete, but let's run a manual cleanup just to be sure.
    const deletedItems = await prisma.routineItem.deleteMany({});
    console.log(`Deleted ${deletedItems.count} RoutineItems.`);

    const deletedRoutines = await prisma.routine.deleteMany({});
    console.log(`Deleted ${deletedRoutines.count} Routines.`);
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
