import type { Metadata } from "next";
import Link from "next/link";
import { Globe2, ShoppingBag, CalendarDays, MessageSquare, TrendingUp, Users, ArrowRight, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard | Partners Hub",
  description: "Votre tableau de bord Partners Hub",
};

const STATS = [
  { label: "Membres actifs", value: "1 240", delta: "+12 cette semaine", color: "#00F0FF" },
  { label: "Pays représentés", value: "34", delta: "6 continents", color: "#50B989" },
  { label: "Connexions ce mois", value: "87", delta: "+23%", color: "#A78BFA" },
  { label: "Opportunités ouvertes", value: "156", delta: "Marketplace", color: "#F59E0B" },
];

const QUICK_LINKS = [
  {
    href: "/hub/reseau",
    icon: Globe2,
    label: "Explorer le réseau",
    desc: "Trouvez des partenaires sur la carte mondiale",
    color: "#00F0FF",
    gradient: "from-[#00F0FF]/10 to-[#00F0FF]/[0.03]",
    border: "border-[#00F0FF]/12",
  },
  {
    href: "/hub/marketplace",
    icon: ShoppingBag,
    label: "Marketplace",
    desc: "Services exclusifs entre membres",
    color: "#50B989",
    gradient: "from-[#50B989]/10 to-[#50B989]/[0.03]",
    border: "border-[#50B989]/12",
  },
  {
    href: "/hub/evenements",
    icon: CalendarDays,
    label: "Événements à venir",
    desc: "Webinaires, masterminds et rencontres",
    color: "#A78BFA",
    gradient: "from-[#A78BFA]/10 to-[#A78BFA]/[0.03]",
    border: "border-[#A78BFA]/12",
  },
  {
    href: "/hub/messages",
    icon: MessageSquare,
    label: "Messages",
    desc: "3 conversations non lues",
    color: "#F59E0B",
    gradient: "from-[#F59E0B]/10 to-[#F59E0B]/[0.03]",
    border: "border-[#F59E0B]/12",
  },
];

const ACTIVITY = [
  {
    type: "new_member",
    text: "Jean-Philippe M. a rejoint le réseau",
    sub: "Consultant, Paris · il y a 2h",
    dot: "#00F0FF",
  },
  {
    type: "marketplace",
    text: "Nouvelle offre : Audit juridique express",
    sub: "Droit des affaires · Avocat certifié",
    dot: "#50B989",
  },
  {
    type: "event",
    text: "Mastermind mensuel — 27 fév. 2026",
    sub: "12 participants confirmés",
    dot: "#A78BFA",
  },
  {
    type: "connection",
    text: "Sophie L. a connecté avec Marc D.",
    sub: "Architecture · Luxembourg",
    dot: "#F59E0B",
  },
  {
    type: "new_member",
    text: "Carlos R. a rejoint le réseau",
    sub: "Développeur, Madrid · il y a 5h",
    dot: "#00F0FF",
  },
];

export default function HubDashboardPage() {
  return (
    <div className="min-h-full bg-[#0A0B0D] p-5 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl md:text-3xl font-bold text-white"
            style={{ letterSpacing: "-0.02em" }}
          >
            Bonjour 👋
          </h1>
          <p className="mt-1 text-white/40 text-sm">
            Voici ce qui se passe dans votre réseau
          </p>
        </div>
        <Link
          href="/hub/reseau"
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-[#0A0B0D] transition-all hover:scale-[1.02]"
          style={{
            background: "linear-gradient(135deg, #00F0FF, #00C8D4)",
            boxShadow: "0 0 20px rgba(0,240,255,0.2)",
          }}
        >
          <Zap size={14} />
          Explorer le réseau
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {STATS.map(({ label, value, delta, color }) => (
          <div
            key={label}
            className="rounded-2xl p-4 md:p-5 relative overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div
              className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.06] -translate-y-8 translate-x-8"
              style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }}
            />
            <p className="text-white/40 text-xs font-medium mb-2">{label}</p>
            <p
              className="text-2xl md:text-3xl font-bold text-white"
              style={{ letterSpacing: "-0.03em" }}
            >
              {value}
            </p>
            <p className="mt-1.5 text-[11px] font-medium" style={{ color }}>
              {delta}
            </p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-white/60 text-xs font-semibold uppercase tracking-[0.15em] mb-4">
          Accès rapide
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {QUICK_LINKS.map(({ href, icon: Icon, label, desc, color, gradient, border }) => (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-4 rounded-2xl p-4 md:p-5 bg-gradient-to-r ${gradient} border ${border} transition-all duration-200 hover:border-opacity-30 hover:scale-[1.01]`}
            >
              <div
                className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                style={{
                  background: `${color}15`,
                  border: `1px solid ${color}25`,
                }}
              >
                <Icon size={18} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold">{label}</p>
                <p className="text-white/40 text-xs mt-0.5 truncate">{desc}</p>
              </div>
              <ArrowRight
                size={16}
                className="text-white/20 group-hover:text-white/50 flex-shrink-0 transition-all group-hover:translate-x-0.5"
              />
            </Link>
          ))}
        </div>
      </div>

      {/* Activity feed */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white/60 text-xs font-semibold uppercase tracking-[0.15em]">
            Activité du réseau
          </h2>
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#50B989", boxShadow: "0 0 6px rgba(80,185,137,0.8)" }}
            />
            <span className="text-[11px] text-white/35">En direct</span>
          </div>
        </div>
        <div
          className="rounded-2xl overflow-hidden divide-y divide-white/[0.04]"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {ACTIVITY.map(({ text, sub, dot }, i) => (
            <div
              key={i}
              className="flex items-start gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors"
            >
              <div className="mt-1.5 flex-shrink-0 relative">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: dot, boxShadow: `0 0 6px ${dot}80` }}
                />
              </div>
              <div className="min-w-0">
                <p className="text-white/80 text-sm">{text}</p>
                <p className="text-white/35 text-xs mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending topics */}
      <div>
        <h2 className="text-white/60 text-xs font-semibold uppercase tracking-[0.15em] mb-4">
          Tendances
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            "#IA & Business",
            "#Freelance",
            "#Droit des affaires",
            "#E-commerce",
            "#Finance",
            "#Immobilier",
            "#Marketing Digital",
            "#Consulting",
          ].map((tag) => (
            <span
              key={tag}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-white/50 cursor-pointer hover:text-white/80 transition-colors"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom spacer */}
      <div className="h-4" />
    </div>
  );
}
