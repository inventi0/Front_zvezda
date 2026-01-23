import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Menu, User, HelpCircle, ShoppingCart, Home } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/app/components/ui/sheet';
import { debounce } from '@/app/utils/debounce';
import { DemoModeIndicator } from '@/app/components/DemoModeIndicator';
import logoImage from '@/app/assets/icons/Лого-Звезда.svg?url';

export default function Header() {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 10;

  const handleScroll = useCallback(
    debounce(() => {
      const currentScrollY = window.scrollY;

      if (window.innerWidth >= 1024) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      if (Math.abs(currentScrollY - lastScrollY.current) < scrollThreshold) {
        return;
      }

      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    }, 100),
    []
  );

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <header 
      className={`sticky top-4 z-50 w-full px-4 sm:px-6 lg:px-8 transition-transform duration-300 ease-in-out lg:translate-y-0 ${
        isVisible ? 'translate-y-0' : '-translate-y-[150%]'
      }`}
    >
      <div className="mx-auto lg:max-w-5xl lg:w-full lg:rounded-2xl lg:border lg:border-border lg:bg-background/95 lg:shadow-sm lg:backdrop-blur lg:supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-between lg:justify-between p-0 lg:p-3 sm:p-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img 
              src={logoImage} 
              alt="Звезда"
              className="h-11 w-11 object-contain"
            />
            <span className="hidden lg:inline font-bold text-2xl tracking-tight">Звезда</span>
          </Link>

          {/* Desktop Navigation - только на больших экранах */}
          <nav className="hidden lg:flex items-center gap-7 flex-1 justify-center">
            <Link to="/" className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
              <Home className="h-5 w-5" />
              Главная
            </Link>
            <Link to="/catalog" className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Каталог
            </Link>
            <Link to="/faq" className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              FAQ
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <DemoModeIndicator />
            <Link to="/account" className="hidden lg:flex">
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-6 w-6" />
              </Button>
            </Link>

            {/* Mobile Menu - только на мобильных */}
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="lg:hidden rounded-lg hover:bg-muted transition-colors"
                  aria-label="Открыть меню"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[360px] p-0 flex flex-col">
                <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
                  <SheetTitle className="flex items-center gap-3">
                      <img
                        src={logoImage}
                        alt="Звезда"
                        className="h-11 w-11 object-contain"
                      />
                    <span className="font-bold text-2xl tracking-tight">Звезда</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex-1 px-6 py-6 overflow-y-auto">
                  <div className="flex flex-col gap-2">
                    <Link 
                      to="/" 
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-muted-foreground hover:text-white hover:bg-accent transition-all duration-200 group"
                    >
                      <Home className="h-5 w-5 transition-colors group-hover:text-white" />
                    Главная
                  </Link>
                    <Link 
                      to="/catalog" 
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-muted-foreground hover:text-white hover:bg-accent transition-all duration-200 group"
                    >
                      <ShoppingCart className="h-5 w-5 transition-colors group-hover:text-white" />
                    Каталог
                  </Link>
                    <Link 
                      to="/faq" 
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-muted-foreground hover:text-white hover:bg-accent transition-all duration-200 group"
                    >
                      <HelpCircle className="h-5 w-5 transition-colors group-hover:text-white" />
                    FAQ
                  </Link>
                    <Link 
                      to="/account" 
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-muted-foreground hover:text-white hover:bg-accent transition-all duration-200 group"
                    >
                      <User className="h-5 w-5 transition-colors group-hover:text-white" />
                    Личный кабинет
                  </Link>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-border">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 px-4">
                      Документы
                    </p>
                    <div className="flex flex-col gap-1">
                      <Link 
                        to="/legal/terms" 
                        className="px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-white hover:bg-accent transition-all duration-200"
                      >
                      Оферта
                    </Link>
                      <Link 
                        to="/legal/privacy" 
                        className="px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-white hover:bg-accent transition-all duration-200"
                      >
                      Политика конфиденциальности
                    </Link>
                      <Link 
                        to="/legal/payment-terms" 
                        className="px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-white hover:bg-accent transition-all duration-200"
                      >
                      Условия оплаты
                    </Link>
                    </div>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}