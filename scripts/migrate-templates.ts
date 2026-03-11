import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Updating existing templates...");

    // Update standalone sessions (weekId is null and they are not part of a plan)
    const sessionsRes = await prisma.session.updateMany({
        where: {
            weekId: null,
        },
        data: {
            isTemplate: true
        }
    });
    console.log(`Updated ${sessionsRes.count} sessions as templates`);

    const weeksRes = await prisma.week.updateMany({
        where: {
            trainingPlanId: null
        },
        data: {
            isTemplate: true
        }
    });
    console.log(`Updated ${weeksRes.count} weeks as templates`);
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
