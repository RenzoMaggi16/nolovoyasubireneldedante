/**
 * app/cocina/layout.tsx
 * Layout dedicado para la vista de cocina.
 * Fullscreen sin sidebar, diseñado para pantallas de pared o tablets.
 */
export default function CocinaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505]">
      {children}
    </div>
  );
}
