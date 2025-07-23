import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Delivery - Sorveteria Conteiner',
  description: 'Peça online e receba em casa ou retire no local',
};

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="delivery-layout">
      {children}
    </div>
  );
} 