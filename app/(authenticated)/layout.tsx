import { Sidebar } from "@/components/sidebar";
import { createServerClient } from "@/utils/supabase";
import { redirect } from "next/navigation";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { UserRole } from "@/utils/supabase/types";
import { getUserRole } from "@/utils/supabase/database";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/actions";
import { CurrencySwitcher } from "@/components/currency-switcher";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get user role
  const userRole = (await getUserRole(user.id)) as UserRole;

  if (!userRole) {
    // If no role is found, redirect to sign-in
    redirect("/sing-in");
  }

  return (
    <div className="flex h-screen w-full">
      <Sidebar userRole={userRole} />
      <div className="flex-1 flex flex-col overflow-auto">
        <header className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-semibold">LeadInk</h1>
          <div className="flex items-center gap-4">
            <CurrencySwitcher />
            <form action={signOutAction}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
            <ThemeSwitcher />
            <div className="text-sm text-muted-foreground">
              Role:{" "}
              <span className="font-medium capitalize">
                {userRole.replace("_", " ")}
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
