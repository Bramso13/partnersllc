export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#060708] overflow-hidden">
      {children}
    </div>
  );
}
