'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingCart, Home } from 'lucide-react';

interface DeliveryHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showCart?: boolean;
  showHome?: boolean;
  backUrl?: string;
  cartItems?: number;
}

export default function DeliveryHeader({
  title,
  subtitle,
  showBack = true,
  showCart = true,
  showHome = false,
  backUrl,
  cartItems = 0
}: DeliveryHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  const handleCart = () => {
    router.push('/delivery/carrinho');
  };

  const handleHome = () => {
    router.push('/delivery');
  };

  return (
    <div className="bg-white shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBack && (
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Voltar"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
            )}
            
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
              {subtitle && <p className="text-gray-600">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showHome && (
              <button
                onClick={handleHome}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Início"
              >
                <Home size={20} className="text-gray-600" />
              </button>
            )}
            
            {showCart && (
              <button
                onClick={handleCart}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Carrinho"
              >
                <ShoppingCart size={20} className="text-gray-600" />
                {cartItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItems > 99 ? '99+' : cartItems}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 