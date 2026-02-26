import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const prismaClientSingleton = () => {
    // Aseguramos que la URL esté presente antes de instanciar
    const connectionString = process.env.DATABASE_URL || "postgresql://postgres.lkllnhezfwndcsalyqyj:DdjtfUAUBRF6EQcT@aws-1-eu-west-1.pooler.supabase.com:5432/postgres";

    // Configuramos el adapter para PostgreSQL
    const pool = new pg.Pool({ connectionString })
    const adapter = new PrismaPg(pool)

    return new PrismaClient({
        adapter,
        log: ['query', 'info', 'warn', 'error'],
    })
}

declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
