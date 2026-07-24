const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function test() {
    const users = await prisma.user.findMany()
    console.log('Usuarios en BD:', JSON.stringify(users, null, 2))
    await prisma.$disconnect()
}

test()
