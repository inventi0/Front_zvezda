import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Checkbox } from '@/app/components/ui/checkbox';
import { useAuth } from '@/app/hooks/useAuth';
import { useAuthStore } from '@/app/stores/auth.store';
import { loginSchema, registerSchema } from '@/app/utils/schemas';
import { toast } from 'sonner';
import { config } from '@/app/config/env';

function getRedirectPath(user: { role: string } | null): string {
  if (user?.role === 'admin' || user?.role === 'support') return '/admin';
  return '/';
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, register, user, isAuthenticated, isLoading: authLoading, error: authError } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});
  
  // Register state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [registerErrors, setRegisterErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getRedirectPath(user), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Show auth errors
  useEffect(() => {
    if (authError) {
      toast.error(authError);
    }
  }, [authError]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrors({});
    
    // Validate with zod
    const result = loginSchema.safeParse({
      email: loginEmail,
      password: loginPassword,
    });

    if (!result.success) {
      const fieldErrors: typeof loginErrors = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'email') {
          fieldErrors.email = err.message;
        } else if (err.path[0] === 'password') {
          fieldErrors.password = err.message;
        }
      });
      setLoginErrors(fieldErrors);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await login(result.data.email, result.data.password);
      toast.success('Вы успешно вошли в систему!');
      const loggedInUser = useAuthStore.getState().user;
      navigate(getRedirectPath(loggedInUser), { replace: true });
    } catch (error) {
      // Error is handled by store and shown via toast
      setLoginErrors({
        email: authError ? 'Неверный email или пароль' : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterErrors({});
    
    // Validate with zod
    const result = registerSchema.safeParse({
      name: registerName,
      email: registerEmail,
      password: registerPassword,
      confirmPassword: registerConfirmPassword,
      acceptTerms,
    });

    if (!result.success) {
      const fieldErrors: typeof registerErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof typeof registerErrors;
        if (field in registerErrors) {
          fieldErrors[field] = err.message;
        }
      });
      setRegisterErrors(fieldErrors);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await register(result.data.name, result.data.email, result.data.password, result.data.confirmPassword);
      toast.success('Регистрация успешна! Добро пожаловать!');
      navigate('/', { replace: true });
    } catch (error) {
      // Error is handled by store and shown via toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Добро пожаловать</h1>
            <p className="text-muted-foreground">
              Войдите или создайте аккаунт для отслеживания заказов
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Войти в аккаунт</CardTitle>
                  <CardDescription>
                    Введите ваш email и пароль для входа
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="text"
                        inputMode="email"
                        placeholder="your@email.com"
                        value={loginEmail}
                        onChange={(e) => {
                          setLoginEmail(e.target.value);
                          if (loginErrors.email) setLoginErrors({ ...loginErrors, email: undefined });
                        }}
                        className="bg-input"
                        aria-invalid={!!loginErrors.email}
                      />
                      {loginErrors.email && (
                        <p className="text-sm text-destructive mt-1">{loginErrors.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label htmlFor="login-password">Пароль</Label>
                        <button
                          type="button"
                          className="text-xs text-primary hover:underline"
                          onClick={() => toast.info('Функция восстановления пароля в разработке')}
                        >
                          Забыли пароль?
                        </button>
                      </div>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => {
                          setLoginPassword(e.target.value);
                          if (loginErrors.password) setLoginErrors({ ...loginErrors, password: undefined });
                        }}
                        className="bg-input"
                        aria-invalid={!!loginErrors.password}
                      />
                      {loginErrors.password && (
                        <p className="text-sm text-destructive mt-1">{loginErrors.password}</p>
                      )}
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isSubmitting || authLoading}>
                      {isSubmitting || authLoading ? 'Вход...' : 'Войти'}
                    </Button>
                  </form>

                  {config.enableMockData && (
                    <div className="mt-6 pt-4 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Демо-доступ (mock)</p>
                      <div className="text-xs text-muted-foreground space-y-1 font-mono">
                        <div>Admin: admin@zvezda.ru / admin123</div>
                        <div>Support: support@zvezda.ru / support123</div>
                        <div>User: user@example.com / user123</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Нет аккаунта?{' '}
                      <button
                        className="text-primary hover:underline"
                        onClick={() => setActiveTab('register')}
                      >
                        Зарегистрируйтесь
                      </button>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Создать аккаунт</CardTitle>
                  <CardDescription>
                    Заполните форму для регистрации
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <Label htmlFor="register-name">Имя</Label>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Иван Иванов"
                        value={registerName}
                        onChange={(e) => {
                          setRegisterName(e.target.value);
                          if (registerErrors.name) setRegisterErrors({ ...registerErrors, name: undefined });
                        }}
                        className="bg-input"
                        aria-invalid={!!registerErrors.name}
                      />
                      {registerErrors.name && (
                        <p className="text-sm text-destructive mt-1">{registerErrors.name}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="text"
                        inputMode="email"
                        placeholder="your@email.com"
                        value={registerEmail}
                        onChange={(e) => {
                          setRegisterEmail(e.target.value);
                          if (registerErrors.email) setRegisterErrors({ ...registerErrors, email: undefined });
                        }}
                        className="bg-input"
                        aria-invalid={!!registerErrors.email}
                      />
                      {registerErrors.email && (
                        <p className="text-sm text-destructive mt-1">{registerErrors.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="register-password">Пароль</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Минимум 6 символов"
                        value={registerPassword}
                        onChange={(e) => {
                          setRegisterPassword(e.target.value);
                          if (registerErrors.password) setRegisterErrors({ ...registerErrors, password: undefined });
                        }}
                        className="bg-input"
                        aria-invalid={!!registerErrors.password}
                      />
                      {registerErrors.password ? (
                        <p className="text-sm text-destructive mt-1">{registerErrors.password}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">
                          Минимум 6 символов
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="register-confirm-password">Подтвердите пароль</Label>
                      <Input
                        id="register-confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={registerConfirmPassword}
                        onChange={(e) => {
                          setRegisterConfirmPassword(e.target.value);
                          if (registerErrors.confirmPassword) setRegisterErrors({ ...registerErrors, confirmPassword: undefined });
                        }}
                        className="bg-input"
                        aria-invalid={!!registerErrors.confirmPassword}
                      />
                      {registerErrors.confirmPassword && (
                        <p className="text-sm text-destructive mt-1">{registerErrors.confirmPassword}</p>
                      )}
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Checkbox 
                        id="terms"
                        checked={acceptTerms}
                        onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                      />
                      <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                        Я принимаю{' '}
                        <Link to="/legal/terms" className="text-primary hover:underline">
                          условия использования
                        </Link>
                        {' '}и{' '}
                        <Link to="/legal/privacy" className="text-primary hover:underline">
                          политику конфиденциальности
                        </Link>
                      </Label>
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isSubmitting || authLoading}>
                      {isSubmitting || authLoading ? 'Регистрация...' : 'Создать аккаунт'}
                    </Button>
                  </form>
                  
                  <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Уже есть аккаунт?{' '}
                      <button
                        className="text-primary hover:underline"
                        onClick={() => setActiveTab('login')}
                      >
                        Войдите
                      </button>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Или{' '}
              <Link to="/" className="text-primary hover:underline">
                продолжите без регистрации
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
