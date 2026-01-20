import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth";

export default async function HomePage() {
  const profile = await getCurrentUserProfile();

  if (profile) {
    // Redirect directly to the appropriate workspace based on role
    const role = profile.role || "CLIENT";
    if (role === "ADMIN") {
      redirect("/admin/analytics");
    } else if (role === "AGENT") {
      redirect("/agent");
    } else {
      redirect("/dashboard");
    }
  } else {
    redirect("/login");
  }
}
