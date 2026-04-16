import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }
  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }
  redirect("/products");
}
