import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/components/ui/utils';
import { Home, LayoutDashboard, ShoppingCart, Package, TrendingUp, Menu, MessageCircle } from 'lucide-react';
import { useAuth } from '@/app/hooks/useAuth';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/app/components/ui/sheet';
import logoImage from '@/app/assets/icons/zvezda-brand.png';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  headerAside?: ReactNode;
  headerContent?: ReactNode;
}

export default function AdminLayout({ children, title, description, actions, headerAside, headerContent }: AdminLayoutProps) {
  const location = useLocation();
  const { isAdmin, isSupport } = useAuth();
  const adminHome = isSupport && !isAdmin ? '/admin/support' : '/admin/products';

  const navigation = [
    ...(isAdmin ? [
      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Заказы', href: '/admin/orders', icon: ShoppingCart },
      { name: 'Товары', href: '/admin/products', icon: Package },
      { name: 'Цены', href: '/admin/pricing', icon: TrendingUp },
    ] : []),
    ...(isAdmin || isSupport ? [
      { name: 'Поддержка', href: '/admin/support', icon: MessageCircle },
    ] : []),
  ];

  const NavItems = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group',
              isActive
                ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                : 'text-muted-foreground hover:text-white hover:bg-accent',
              mobile && 'text-base'
            )}
          >
            <Icon className={cn(
              'h-5 w-5 transition-colors',
              isActive ? 'text-primary-foreground' : 'group-hover:text-white'
            )} />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="lg:hidden rounded-lg hover:bg-muted transition-colors"
                    aria-label="Открыть меню"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[320px] p-0 flex flex-col">
                  <div className="px-6 pt-6 pb-4 border-b border-border">
                    <Link 
                      to={adminHome}
                      className="flex flex-col items-start gap-1 transition-opacity hover:opacity-80"
                    >
                      <img
                        src={logoImage}
                        alt="Звезда"
                        className="block h-auto w-40"
                      />
                      <div className="text-xs text-muted-foreground">Админ-панель</div>
                    </Link>
                  </div>
                  <nav className="flex-1 px-6 py-6 overflow-y-auto">
                    <div className="flex flex-col gap-2">
                    <NavItems mobile />
                    </div>
                    <div className="mt-8 pt-6 border-t border-border">
                      <Link to="/">
                        <Button 
                          variant="outline" 
                          className="w-full justify-start gap-2 hover:bg-accent transition-all duration-200"
                        >
                          <Home className="h-4 w-4" />
                          Вернуться на сайт
                        </Button>
                      </Link>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>

              {/* Logo */}
              <Link to={adminHome} className="hidden flex-col items-start gap-0.5 transition-opacity hover:opacity-80 sm:flex">
                <img
                  src={logoImage}
                  alt="Звезда"
                  className="block h-auto w-32"
                />
                <div className="text-xs text-muted-foreground">Админ-панель</div>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              {actions}
              <Link to="/" className="hidden sm:flex">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  На сайт
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden w-64 shrink-0 border-r border-border bg-card/50 lg:block">
          <nav className="sticky top-24 p-5 space-y-3">
            <NavItems />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1">
          <div className="container mx-auto min-w-0 px-4 py-9 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className={cn('mb-9', headerAside && 'grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(440px,0.8fr)] xl:items-start')}>
              <div className="min-w-0">
                <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">{title}</h1>
                {description && (
                  <p className="text-muted-foreground">{description}</p>
                )}
                {headerContent}
              </div>
              {headerAside}
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
