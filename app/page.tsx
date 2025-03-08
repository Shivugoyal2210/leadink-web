import { createServerClient } from "@/utils/supabase";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createServerClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is authenticated, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  // Otherwise, redirect to sing-in
  redirect("/sign-in");
}
