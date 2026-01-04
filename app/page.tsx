import { redirect } from "next/navigation";

export default function Home() {
  // Pour l'instant : on redirige toujours vers /login
  // (on branchera la vraie logique "connecté / pas connecté" ensuite)
  redirect("/login");
}
