import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 - Page non trouvée | Partners LLC",
  description: "La page que vous recherchez n'existe pas",
};

export default function NotFound() {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* Gradient Background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #000000 0%, #2d2d2d 50%, #000000 100%)",
        }}
      />

      {/* Floating Shapes */}
      <div
        className="floating-shape absolute w-[672px] h-[694px] right-[-200px] top-[-100px] opacity-10"
        style={{
          animation: "float 20s infinite ease-in-out",
        }}
      >
        <div className="w-full h-full bg-accent/20 rounded-full blur-3xl" />
      </div>

      <div
        className="floating-shape absolute w-[689px] h-[690px] left-[-250px] bottom-[-200px] opacity-10"
        style={{
          animation: "float 20s infinite ease-in-out 5s",
        }}
      >
        <div className="w-full h-full bg-accent/20 rounded-full blur-3xl" />
      </div>

      {/* Backdrop */}
      <div className="absolute inset-0 backdrop-blur-[9px] bg-black/50 flex items-center justify-center p-8">
        <div className="relative bg-[#363636] rounded-[18px] w-full max-w-[600px] p-12 shadow-2xl text-center">
          {/* Logo Section */}
          <div className="flex items-center justify-center mb-8">
            <Image
              src="/logo_partnersllc_blanc.png"
              alt="PARTNERS LLC Logo"
              width={200}
              height={200}
              className="object-contain"
            />
          </div>

          {/* 404 Content */}
          <div className="mb-8">
            <h1 className="text-8xl font-bold text-accent mb-4" style={{ 
              textShadow: "0 0 20px rgba(0, 240, 255, 0.5)" 
            }}>
              404
            </h1>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Page non trouvée
            </h2>
            <p className="text-text-secondary text-lg mb-2">
              Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
            </p>
            <p className="text-text-secondary">
              Vérifiez l'URL ou retournez à la page d'accueil.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-accent text-brand-dark-bg font-semibold rounded-lg hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/30"
            >
              <i className="fa-solid fa-home mr-2"></i>
              Retour à l'accueil
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 bg-surface border border-border text-foreground font-semibold rounded-lg hover:bg-border transition-all"
            >
              <i className="fa-solid fa-sign-in-alt mr-2"></i>
              Se connecter
            </Link>
          </div>

          {/* Helpful Links */}
          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-text-secondary text-sm mb-4">
              Vous pouvez également :
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link
                href="/dashboard"
                className="text-accent hover:text-accent/80 transition-colors"
              >
                <i className="fa-solid fa-chart-line mr-1"></i>
                Tableau de bord
              </Link>
              <Link
                href="/support"
                className="text-accent hover:text-accent/80 transition-colors"
              >
                <i className="fa-solid fa-headset mr-1"></i>
                Support
              </Link>
              <Link
                href="/admin/analytics"
                className="text-accent hover:text-accent/80 transition-colors"
              >
                <i className="fa-solid fa-shield-halved mr-1"></i>
                Administration
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
