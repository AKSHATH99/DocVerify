import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

export async function POST(request) {

    console.log("SUPABASE_SERVICE_KEY:",process.env.SUPABASE_SERVICE_KEY);
    console.log("NEXT_PUBLIC_SUPABASE_URL:",process.env.NEXT_PUBLIC_SUPABASE_URL);
    try {
        const { wallet_address } = await request.json()
        if (!wallet_address)
            return Response.json({ error: 'Wallet address required' }, { status: 400 })

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('wallet_address', wallet_address)
            .single()

        if (error || !data)
            return Response.json({ error: 'User not found' }, { status: 404 })

        return Response.json({ user: data }, { status: 200 })
    } catch (err) {
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
