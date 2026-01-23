import { Link } from 'react-router-dom';
import { Mail, MessageCircle } from 'lucide-react';
import logoImage from '@/app/assets/icons/Лого-Звезда.svg?url';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img 
                src={logoImage} 
                alt="Звезда"
                className="h-9 w-9 object-contain"
              />
              <span className="font-bold text-xl">Звезда</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Быстрое и безопасное пополнение игровых валют, подарочных карт и подписок.
            </p>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-semibold mb-4">Товары</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/catalog/games" className="text-muted-foreground hover:text-foreground transition-colors">
                  Игры
                </Link>
              </li>
              <li>
                <Link to="/catalog/subscriptions" className="text-muted-foreground hover:text-foreground transition-colors">
                  Подписки
                </Link>
              </li>
              <li>
                <Link to="/catalog/wallet" className="text-muted-foreground hover:text-foreground transition-colors">
                  Подарочные карты
                </Link>
              </li>
              <li>
                <Link to="/catalog/services" className="text-muted-foreground hover:text-foreground transition-colors">
                  Сервисы
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Поддержка</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <a href="mailto:support@zvezda.ru" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  support@zvezda.ru
                </a>
              </li>
              <li>
                <a href="https://t.me/zvezda_support" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" />
                  Telegram
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Документы</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/legal/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Оферта
                </Link>
              </li>
              <li>
                <Link to="/legal/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Политика конфиденциальности
                </Link>
              </li>
              <li>
                <Link to="/legal/payment-terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Условия оплаты
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-border text-center text-xs sm:text-sm text-muted-foreground px-2">
          <p>&copy; 2026 Звезда. Все права защищены.</p>
          <p className="mt-1 sm:mt-2">Последнее обновление: 19 января 2026</p>
        </div>
      </div>
    </footer>
  );
}
