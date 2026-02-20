"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Globe2, Users, ShoppingBag, CalendarDays, ArrowRight, Check } from "lucide-react";

const STEPS = [
  {
    id: 1,
    title: "Bienvenue dans votre réseau",
    subtitle: "Partners Hub est le premier réseau privé dédié aux professionnels indépendants. Connexions, opportunités, croissance.",
    visual: "welcome",
  },
  {
    id: 2,
    title: "Ce qui vous attend",
    subtitle: "Tout ce dont vous avez besoin pour développer votre activité, au même endroit.",
    visual: "features",
    features: [
      {
        icon: Globe2,
        color: "#00F0FF",
        label: "Réseau mondial",
        desc: "Carte interactive de tous les membres. Trouvez des partenaires partout dans le monde.",
      },
      {
        icon: ShoppingBag,
        color: "#50B989",
        label: "Marketplace",
        desc: "Proposez vos services, découvrez des offres exclusives entre membres.",
      },
      {
        icon: CalendarDays,
        color: "#A78BFA",
        label: "Événements",
        desc: "Rencontres, webinaires, masterminds — restez connecté à la communauté.",
      },
      {
        icon: Users,
        color: "#F59E0B",
        label: "Messagerie directe",
        desc: "Échangez en privé avec n'importe quel membre du réseau.",
      },
    ],
  },
  {
    id: 3,
    title: "Votre réseau vous attend",
    subtitle: "Votre profil est prêt. Explorez la carte, connectez-vous avec d'autres membres et commencez à construire votre réseau.",
    visual: "ready",
  },
];

export function HubOnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 80);
    return () => clearTimeout(t);
  }, [step]);

  const goNext = () => {
    if (step < STEPS.length - 1) {
      setLeaving(true);
      setTimeout(() => {
        setRevealed(false);
        setLeaving(false);
        setStep((s) => s + 1);
      }, 260);
    } else {
      router.push("/hub/dashboard");
    }
  };

  const current = STEPS[step];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-5 py-10 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full opacity-[0.04]"
          style={{
            background: "radial-gradient(circle, #00F0FF 0%, transparent 70%)",
            animation: "pulse 8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vw] rounded-full opacity-[0.03]"
          style={{
            background: "radial-gradient(circle, #50B989 0%, transparent 70%)",
            animation: "pulse 10s ease-in-out infinite 2s",
          }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,240,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.04; }
          50% { transform: scale(1.1); opacity: 0.07; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes orbitSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes counterSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .reveal { animation: fadeUp 0.5s ease forwards; }
        .reveal-delay-1 { animation: fadeUp 0.5s ease 0.1s both; }
        .reveal-delay-2 { animation: fadeUp 0.5s ease 0.2s both; }
        .reveal-delay-3 { animation: fadeUp 0.5s ease 0.3s both; }
        .reveal-delay-4 { animation: fadeUp 0.5s ease 0.4s both; }
      `}</style>

      {/* Content */}
      <div
        className="relative z-10 w-full max-w-lg"
        style={{ opacity: leaving ? 0 : 1, transition: "opacity 0.25s ease" }}
      >
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className="transition-all duration-500"
              style={{
                width: i === step ? 28 : 6,
                height: 6,
                borderRadius: 3,
                background: i === step ? "#00F0FF" : i < step ? "rgba(0,240,255,0.35)" : "rgba(255,255,255,0.12)",
                boxShadow: i === step ? "0 0 8px rgba(0,240,255,0.6)" : "none",
              }}
            />
          ))}
        </div>

        {/* Visual */}
        {revealed && (
          <div className="flex justify-center mb-10 reveal">
            {current.visual === "welcome" && <WelcomeVisual />}
            {current.visual === "features" && current.features && (
              <FeaturesVisual features={current.features} />
            )}
            {current.visual === "ready" && <ReadyVisual />}
          </div>
        )}

        {/* Text */}
        {revealed && (
          <div className="text-center space-y-4">
            <h1
              className="text-3xl sm:text-4xl font-bold text-white leading-tight reveal-delay-1"
              style={{ letterSpacing: "-0.02em" }}
            >
              {current.title}
            </h1>
            <p className="text-white/50 text-base leading-relaxed max-w-sm mx-auto reveal-delay-2">
              {current.subtitle}
            </p>
          </div>
        )}

        {/* CTA */}
        {revealed && (
          <div className="flex justify-center mt-10 reveal-delay-3">
            <button
              onClick={goNext}
              className="group flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-semibold text-[#060708] text-sm transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #00F0FF, #00C8D4)",
                boxShadow: "0 0 24px rgba(0,240,255,0.25), 0 4px 16px rgba(0,0,0,0.4)",
              }}
            >
              {step < STEPS.length - 1 ? (
                <>
                  Continuer
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </>
              ) : (
                <>
                  Explorer le réseau
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Skip */}
        {revealed && step < STEPS.length - 1 && (
          <div className="flex justify-center mt-5 reveal-delay-4">
            <button
              onClick={() => router.push("/hub/dashboard")}
              className="text-white/25 hover:text-white/50 text-sm transition-colors"
            >
              Passer l&apos;introduction
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Visuals ── */

function WelcomeVisual() {
  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      {/* Outer orbit */}
      <div
        className="absolute inset-0 rounded-full border border-white/[0.06]"
        style={{ animation: "orbitSpin 20s linear infinite" }}
      >
        <div
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
          style={{ background: "#00F0FF", boxShadow: "0 0 8px rgba(0,240,255,0.8)" }}
        />
      </div>
      {/* Middle orbit */}
      <div
        className="absolute rounded-full border border-white/[0.05]"
        style={{
          inset: "20px",
          animation: "orbitSpin 14s linear infinite reverse",
        }}
      >
        <div
          className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
          style={{ background: "#50B989", boxShadow: "0 0 6px rgba(80,185,137,0.8)" }}
        />
      </div>
      {/* Center */}
      <div
        className="relative w-20 h-20 rounded-full flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, rgba(0,240,255,0.1) 0%, rgba(80,185,137,0.08) 100%)",
          border: "1px solid rgba(0,240,255,0.2)",
          boxShadow: "0 0 30px rgba(0,240,255,0.12), inset 0 0 20px rgba(0,240,255,0.05)",
        }}
      >
        <span
          className="text-2xl font-black tracking-tight"
          style={{ color: "#00F0FF" }}
        >
          PH
        </span>
      </div>
    </div>
  );
}

function FeaturesVisual({
  features,
}: {
  features: { icon: React.ElementType; color: string; label: string; desc: string }[];
}) {
  return (
    <div className="w-full grid grid-cols-1 gap-3">
      {features.map(({ icon: Icon, color, label, desc }, i) => (
        <div
          key={label}
          className="flex items-start gap-4 px-4 py-4 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.05)",
            animation: `fadeUp 0.5s ease ${i * 0.08}s both`,
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5"
            style={{
              background: `${color}15`,
              border: `1px solid ${color}25`,
            }}
          >
            <Icon size={16} style={{ color }} />
          </div>
          <div>
            <p className="text-white text-sm font-semibold">{label}</p>
            <p className="text-white/40 text-xs leading-relaxed mt-0.5">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReadyVisual() {
  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      {/* Checkmark circle */}
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, rgba(80,185,137,0.15), rgba(0,240,255,0.1))",
          border: "1px solid rgba(80,185,137,0.3)",
          boxShadow: "0 0 40px rgba(80,185,137,0.15)",
        }}
      >
        <Check size={32} className="text-[#50B989]" strokeWidth={2.5} />
      </div>
      {/* Ripple rings */}
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className="absolute inset-0 rounded-full border border-[#50B989]/10"
          style={{
            animation: `pulse ${1.5 + n * 0.5}s ease-in-out infinite`,
            animationDelay: `${n * 0.3}s`,
            transform: `scale(${0.9 + n * 0.2})`,
          }}
        />
      ))}
    </div>
  );
}
