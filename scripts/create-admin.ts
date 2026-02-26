import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const email = process.argv[2]
    if (!email) {
        console.error('Por favor, indica un email: npm run create-admin user@example.com')
        process.exit(1)
    }

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: { role: 'ADMIN' },
            create: {
                email,
                role: 'ADMIN',
                name: 'Administrador Inicial'
            },
        })
        console.log('✅ Usuario ADMIN creado/actualizado con éxito en la base de datos:', user)
    } catch (error) {
        console.error('❌ Error al crear admin:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
