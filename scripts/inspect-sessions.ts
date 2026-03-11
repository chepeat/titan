import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Fetching sessions...");
    const sessions = await prisma.session.findMany({
        select: {
            id: true,
            name: true,
            weekId: true,
            coachId: true,
            week: {
                select: {
                    id: true,
                    name: true,
                    trainingPlanId: true
                }
            }
        }
    });

    console.table(sessions);
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
