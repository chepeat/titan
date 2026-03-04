const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reproduce() {
    const coachId = "cmm67rbyv0000rqszx3pbg65h";
    const exerciseId = "cmm9ezk300000rq7le676kt22";

    const data = {
        name: "Test Reproduce",
        days: [
            {
                number: 1,
                sessions: [
                    {
                        name: "Test Session",
                        routines: [
                            {
                                name: "Test Routine",
                                exercises: [
                                    {
                                        exerciseId: exerciseId,
                                        series: 3,
                                        reps: ["10", "10", "10"],
                                        restingTime: 60
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    };

    try {
        console.log('Attempting to create week...');
        const result = await prisma.week.create({
            data: {
                name: data.name,
                number: 0,
                coachId: coachId,
                days: {
                    create: data.days.map((day) => ({
                        number: day.number,
                        sessions: {
                            create: day.sessions.map((s, sIdx) => ({
                                name: s.name,
                                order: sIdx,
                                coachId: coachId,
                                routines: {
                                    create: s.routines.map((r, rIdx) => ({
                                        name: r.name,
                                        order: rIdx,
                                        coachId: coachId,
                                        exercises: {
                                            create: r.exercises.map((e, eIdx) => ({
                                                exerciseId: e.exerciseId,
                                                series: e.series,
                                                reps: e.reps, // Json type
                                                restingTime: e.restingTime,
                                                order: eIdx
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
        console.log('Success!', result.id);
    } catch (error) {
        console.error('FAILED TO CREATE WEEK:');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

reproduce();
