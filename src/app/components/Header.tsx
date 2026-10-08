import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, LayoutDashboard, HelpCircle, LayoutGrid, Search } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { useAuth } from '@/app/hooks/useAuth';
import logoImage from '@/app/assets/icons/zvezda-brand.png';
import CatalogSearch from '@/app/components/CatalogSearch';

const profileButtonClassName =
  'size-9 rounded-full bg-muted/70 text-foreground hover:bg-muted hover:text-foreground focus-visible:border-transparent focus-visible:ring-1 focus-visible:ring-primary/50';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isAdmin, isSupport, logout } = useAuth();
  const isHome = location.pathname === '/';
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleCatalogClick = (e: React.MouseEvent) => {
    if (isHome) {
      e.preventDefault();
      document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 w-full items-center gap-3 pl-2 pr-4 sm:pl-3 sm:pr-6 lg:gap-5 lg:pl-4 lg:pr-8">
          <Link to="/" className="shrink-0 transition-opacity hover:opacity-80">
            <img src={logoImage} alt="Звезда" className="block h-auto w-32 sm:w-36" />
          </Link>

          <div className="hidden min-w-0 flex-1 md:block">
            <CatalogSearch />
          </div>

          <nav
            className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2"
            aria-label="Основная навигация"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full md:hidden"
              aria-label="Открыть поиск"
              onClick={() => setMobileSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
            <Link
              to="/#catalog"
              onClick={handleCatalogClick}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-muted/50"
            >
              <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden lg:inline">Каталог</span>
            </Link>
            <Link
              to="/faq"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-muted/50"
            >
              <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden lg:inline">FAQ</span>
            </Link>
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={profileButtonClassName}
                    aria-label="Профиль"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full">
                      <User className="h-5 w-5" />
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="truncate px-2 py-1.5 text-sm text-muted-foreground">
                    {user.email}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/account" className="cursor-pointer">
                      <User className="h-4 w-4" />
                      Личный кабинет
                    </Link>
                  </DropdownMenuItem>
                  {(isAdmin || isSupport) && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        <LayoutDashboard className="h-4 w-4" />
                        Админка
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    className="cursor-pointer"
                    onClick={async () => {
                      await logout();
                      navigate('/');
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/account" title="Личный кабинет">
                <Button
                  variant="ghost"
                  size="icon"
                  className={profileButtonClassName}
                  aria-label="Профиль"
                >
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </div>

      <Dialog open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
        <DialogContent className="top-4 translate-y-0 gap-3 p-4 sm:top-8 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Поиск по каталогу</DialogTitle>
          </DialogHeader>
          <CatalogSearch mobile autoFocus onNavigate={() => setMobileSearchOpen(false)} />
        </DialogContent>
      </Dialog>
    </header>
  );
}
