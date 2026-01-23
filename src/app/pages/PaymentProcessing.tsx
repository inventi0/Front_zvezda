import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { ordersService } from '@/app/services';
import { logger } from '@/app/utils/logger';
import { toast } from 'sonner';

export default function PaymentProcessingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (!orderId) {
      toast.error('Заказ не указан');
      navigate('/');
      return;
    }

    // Poll order status
    const pollInterval = setInterval(async () => {
      try {
        const order = await ordersService.getOrder(orderId);
        
        // If order is no longer pending, navigate to order status
        if (order.status !== 'pending') {
          clearInterval(pollInterval);
          navigate(`/order/${orderId}`, { replace: true });
        }
      } catch (error) {
        logger.error('Failed to poll order status', error);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 5 minutes
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      navigate(`/order/${orderId}`, { replace: true });
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [orderId, navigate]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Обработка платежа...</h1>
          <p className="text-muted-foreground mb-6">
            Пожалуйста, подождите. Мы обрабатываем ваш платеж.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Обычно занимает до 1–3 минут
          </p>
          {orderId && (
            <button
              type="button"
              onClick={() => navigate(`/order/${orderId}`, { replace: true })}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              Проверить статус заказа
            </button>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
