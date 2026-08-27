import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

// Parsear el archivo .env de forma manual para evitar dependencias
const envPath = path.join(process.cwd(), '.env')
if (!fs.existsSync(envPath)) {
    console.error('❌ El archivo .env no existe en:', envPath)
    process.exit(1)
}

const envContent = fs.readFileSync(envPath, 'utf8')
const env: { [key: string]: string } = {}
envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const index = trimmed.indexOf('=')
    if (index === -1) return
    const key = trimmed.substring(0, index).trim()
    let val = trimmed.substring(index + 1).trim()
    if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1)
    }
    if (val.startsWith("'") && val.endsWith("'")) {
        val = val.substring(1, val.length - 1)
    }
    env[key] = val
})

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseServiceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY']

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el archivo .env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

const prisma = new PrismaClient()

async function main() {
    const email = 'chepeat.tecnologia@gmail.com'
    const password = 'TitanClub2026!'
    const name = 'Chepe Admin'

    console.log(`Creando usuario en Supabase Auth: ${email}...`)
    
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: 'ADMIN', name, mustChangePassword: false }
    })

    if (authError) {
        console.error('❌ Error al crear usuario en Supabase Auth:', authError.message)
        process.exit(1)
    }

    const supabaseId = authUser.user.id
    console.log(`✅ Usuario creado en Supabase Auth con ID: ${supabaseId}`)

    console.log('Registrando usuario en la base de datos (Prisma)...')

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            role: 'ADMIN',
            supabaseId,
            name
        },
        create: {
            email,
            role: 'ADMIN',
            name,
            supabaseId
        }
    })

    console.log('✅ Usuario ADMIN registrado correctamente en Prisma:', user)
    await prisma.$disconnect()
}

main().catch(err => {
    console.error('❌ Error general durante la ejecución:', err)
    process.exit(1)
})
