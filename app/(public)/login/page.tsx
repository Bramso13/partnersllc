import LoginForm from "@/components/auth/LoginForm";
import { Metadata } from "next";
import Image from "next/image";
import { AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Connexion - Partners LLC",
  description: "Connectez-vous à votre compte Partners LLC",
};

const LOGIN_ACCENT = "#50B989";

interface LoginPageProps {
  searchParams: Promise<{ message?: string; redirect?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { message } = await searchParams;

  return (
    <div
      className="login-page relative min-h-screen w-full overflow-hidden bg-[#0f1114]"
      style={{ ["--color-accent" as string]: LOGIN_ACCENT }}
    >
      <style>{`
        @keyframes loginPageFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes loginCardUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes loginOrb {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
          50% { transform: translate(10%, -15%) scale(1.05); opacity: 0.55; }
        }
        .login-page { animation: loginPageFade 0.4s ease-out; }
        .login-page .login-card { animation: loginCardUp 0.5s ease-out 0.15s backwards; }
        .login-page .login-orb { animation: loginOrb 12s ease-in-out infinite; }
      `}</style>

      {/* Fond : gradient + grain */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(165deg, #0f1114 0%, #14181a 35%, #0d1214 70%, #0f1114 100%),
            radial-gradient(ellipse 120% 80% at 70% 20%, rgba(80, 185, 137, 0.08) 0%, transparent 55%),
            radial-gradient(ellipse 100% 60% at 20% 80%, rgba(80, 185, 137, 0.06) 0%, transparent 50%)
          `,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Orbes d'ambiance verts */}
      <div
        className="login-orb absolute h-[480px] w-[480px] rounded-full opacity-40"
        style={{
          left: "-120px",
          top: "-80px",
          background: `radial-gradient(circle, ${LOGIN_ACCENT}40 0%, ${LOGIN_ACCENT}15 40%, transparent 70%)`,
          filter: "blur(60px)",
        }}
      />
      <div
        className="login-orb absolute h-[400px] w-[400px] rounded-full opacity-30"
        style={{
          right: "-100px",
          bottom: "-60px",
          background: `radial-gradient(circle, ${LOGIN_ACCENT}30 0%, transparent 65%)`,
          filter: "blur(50px)",
          animationDelay: "-4s",
        }}
      />

      {/* Contenu centré */}
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12 sm:px-6">
        <div className="login-card w-full max-w-[440px]">
          {/* Carte principale */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#1a1d21] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)]">
            {/* Ligne d'accent en haut */}
            <div
              className="h-1 w-full"
              style={{ background: LOGIN_ACCENT }}
            />

            <div className="px-8 py-10 sm:px-10 sm:py-12">
              {/* Logo */}
              <div className="mb-10 flex justify-center">
                <Image
                  src="/logo_partnersllc_blanc.png"
                  alt="PARTNERS LLC"
                  width={180}
                  height={56}
                  className="h-10 w-auto object-contain"
                  priority
                />
              </div>

              {/* Titre */}
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
                  Connexion
                </h1>
                <p className="mt-1.5 text-sm text-[#9ca3af]">
                  Accédez à votre espace PARTNERS
                </p>
              </div>

              {/* Message paiement annulé */}
              {message === "payment_cancelled" && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3.5 text-amber-400">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-medium">Paiement annulé</p>
                    <p className="mt-0.5 text-sm text-amber-400/90">
                      Connectez-vous pour réessayer et finaliser votre
                      inscription.
                    </p>
                  </div>
                </div>
              )}

              <LoginForm />
            </div>
          </div>

          {/* Pied de page discret */}
          <p className="mt-8 text-center text-xs text-[#6b7280]">
            © Partners LLC · Connexion sécurisée
          </p>
        </div>
      </div>
    </div>
  );
}
