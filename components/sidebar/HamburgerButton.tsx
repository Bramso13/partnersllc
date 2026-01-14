"use client";

interface HamburgerButtonProps {
  onClick: () => void;
}

export function HamburgerButton({ onClick }: HamburgerButtonProps) {
  return (
    <button
      onClick={onClick}
      className="md:hidden p-3 text-[#F9F9F9] hover:bg-[#2D3033] rounded-lg transition-colors"
      aria-label="Ouvrir le menu"
      aria-expanded="false"
    >
      <i className="fa-solid fa-bars text-2xl"></i>
    </button>
  );
}
