import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, LayoutDashboard, HelpCircle, LayoutGrid } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { useAuth } from '@/app/hooks/useAuth';
import logoImage from '@/app/assets/icons/Лого-Звезда.svg?url';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isAdmin, isSupport, logout } = useAuth();
  const isHome = location.pathname === '/';

  const handleCatalogClick = (e: React.MouseEvent) => {
    if (isHome) {
      e.preventDefault();
      document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center justify-between px-4 sm:px-6 h-14">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
          <img src={logoImage} alt="Звезда" className="h-8 w-8 sm:h-9 sm:w-9 object-contain" />
          <span className="font-bold text-lg sm:text-xl tracking-tight">Звезда</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/#catalog"
            onClick={handleCatalogClick}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-muted/50"
          >
            <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Каталог</span>
          </Link>
          <Link
            to="/faq"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-muted/50"
          >
            <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">FAQ</span>
          </Link>
          {isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="Профиль">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <User className="h-5 w-5" />
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm text-muted-foreground truncate">
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
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="Профиль">
                <User className="h-6 w-6" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
