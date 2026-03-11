import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Updating existing routine templates...");

    // Update standalone routines (sessionId is null)
    const routinesRes = await prisma.routine.updateMany({
        where: {
            sessionId: null,
        },
        data: {
            isTemplate: true
        }
    });
    console.log(`Updated ${routinesRes.count} routines as templates`);
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
