import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const email = 'chepeat.tecnologia@gmail.com'

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: { role: 'ADMIN' },
            create: {
                email,
                role: 'ADMIN',
                name: 'Chepe Admin'
            },
        })
        console.log('✅ Usuario ADMIN registrado en la base de datos:', user)
    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
