
import { createClient } from '@supabase/supabase-js';


const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);


export async function POST(request) {
    try {
        const { wallet_address, name, email } = await request.json()

        if (!wallet_address)
            return Response.json({ error: 'Wallet address required' }, { status: 400 })

        const { data, error } = await supabase
            .from('users')
            .insert([{ wallet_address, name, email }])
            .select()
            .single()

        if (error)
            return Response.json({ error: error.message }, { status: 500 })

        return Response.json({ user: data }, { status: 200 })
    } catch (err) {
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}