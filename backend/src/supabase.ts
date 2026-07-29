import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);

const { data, error } = await supabaseAdmin.storage
  .from(process.env.SUPABASE_STORAGE_BUCKET!)
  .upload("test.txt", Buffer.from("hello world"));

console.log(data, error);