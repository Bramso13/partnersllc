import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { EventsList } from "@/components/hub/events/EventsList";

export const metadata: Metadata = {
  title: "Événements | Partners Hub",
  description: "Webinaires, masterminds et rencontres Partners Hub",
};

export default function HubEvenementsPage() {
  return (
    <div className="min-h-full bg-[#0A0B0D] p-5 md:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.2)" }}
          >
            <CalendarDays size={17} style={{ color: "#A78BFA" }} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ letterSpacing: "-0.02em" }}>
            Événements
          </h1>
        </div>
        <p className="text-white/40 text-sm ml-12">
          Webinaires, masterminds et rencontres de la communauté
        </p>
      </div>

      <EventsList />
    </div>
  );
}
