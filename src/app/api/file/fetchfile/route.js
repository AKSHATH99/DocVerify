
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);


export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const hash = searchParams.get("hash");

        if (!hash) {
            return NextResponse.json({ error: "Hash required" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("uploads")
            .select("*")
            .eq("file_hash", hash)
        if (error) throw error;

        return NextResponse.json({ success: true, files: data }, { status: 200 });
    } catch (err) {
        console.error("Error fetching user files:", err);
        return NextResponse.json(
            { error: "Failed to fetch user files" },
            { status: 500 }
        );
    }
}
