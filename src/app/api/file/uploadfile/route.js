import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

export async function POST(req) {
    try {
        const body = await req.json();
        const {
            user_id,
            file_name,
            file_hash,
            transaction_signature,
            file_type,
            file_size,
            note,
            wallet_address
        } = body;

        // ✅ Validate required fields
        if (!user_id || !file_name || !file_hash || !wallet_address) {
            return NextResponse.json(
                { error: "Missing required fields: user_id, file_name, file_hash, or wallet_address" },
                { status: 400 }
            );
        }

        // ✅ Insert into DB
        const { data, error } = await supabase
            .from("uploads")
            .insert([
                {
                    user_id,
                    file_name,
                    file_hash,
                    transaction_signature,
                    file_type,
                    file_size,
                    note,
                    wallet_address
                },
            ])
            .select();

        if (error) throw error;

        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (err) {
        console.error("Error adding file details:", err);
        return NextResponse.json(
            { error: "Failed to add file details" },
            { status: 500 }
        );
    }
}
