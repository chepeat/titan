const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
    datasourceUrl: 'postgresql://postgres.lkllnhezfwndcsalyqyj:DdjtfUAUBRF6EQcT@aws-1-eu-west-1.pooler.supabase.com:5432/postgres'
})

async function test() {
    const users = await prisma.user.findMany()
    console.log('Usuarios en BD:', JSON.stringify(users, null, 2))
    await prisma.$disconnect()
}

test()
