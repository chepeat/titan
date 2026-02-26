import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
            'Faltan las variables de entorno de Supabase. ' +
            'Asegúrate de configurar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en Vercel.'
        );
    }

    // Debug seguro para verificar integridad en Vercel
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
        console.log('--- Supabase Key Debug ---');
        console.log('URL length:', supabaseUrl.length);
        console.log('Key length:', supabaseAnonKey.length);
        console.log('Key prefix:', supabaseAnonKey.substring(0, 10));
        console.log('Key ends with quotes?', supabaseAnonKey.startsWith('"') || supabaseAnonKey.endsWith('"'));
        console.log('---------------------------');
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
