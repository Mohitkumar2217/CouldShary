import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  const { data, error } = await supabaseAdmin.storage
    .from(process.env.SUPABASE_STORAGE_BUCKET!)
    .upload("test.txt", Buffer.from("hello world"), {
      contentType: "text/plain",
      upsert: true, // lets you re-run this script without a "already exists" error
    });

  if (error) {
    console.error("Upload failed:", error);
    return;
  }

  console.log("Upload succeeded:", data);
}

main();