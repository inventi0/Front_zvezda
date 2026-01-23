import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { ArrowLeft, Search, MessageCircle, Mail } from 'lucide-react';
import { adminOrdersService } from '@/app/services';
import { logger } from '@/app/utils/logger';
import { toast } from 'sonner';
import type { Ticket, TicketMessage, TicketStatus, TicketType } from '@/app/types';
import { cn } from '@/app/components/ui/utils';

// Простые mock‑тикеты на основе заказов
// В реальной системе тикеты будут приходить из API
const createSeedTickets = (orders: Awaited<ReturnType<typeof adminOrdersService.getOrders>>['orders']): Ticket[] => {
  return orders.map((order, index) => {
  const baseStatus: TicketStatus =
    order.status === 'failed'
      ? 'in_progress'
      : order.status === 'manual_review'
      ? 'open'
      : 'resolved';

  const baseType: TicketType =
    order.status === 'failed'
      ? 'fulfillment'
      : order.status === 'manual_review'
      ? 'payment'
      : 'other';

  const baseMessage: TicketMessage = {
    id: `MSG-${index + 1}-1`,
    author: 'user',
    text:
      'Краткое описание проблемы клиента. В реальной системе это поле будет заполнено сообщением из формы поддержки или личного кабинета.',
    createdAt: order.createdAt,
    internal: false,
  };

  return {
    id: `T-${index + 1}`,
    orderId: order.id,
    userEmail: order.email,
    type: baseType,
    subject:
      order.status === 'failed'
        ? 'Ошибка выполнения заказа'
        : order.status === 'manual_review'
        ? 'Вопрос по ручной проверке'
        : 'Вопрос по заказу',
    description: baseMessage.text,
    status: baseStatus,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    messages: [baseMessage],
  };
  });
};

export default function AdminSupport() {
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof adminOrdersService.getOrders>>['orders']>([]);
  
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const result = await adminOrdersService.getOrders();
        setOrders(result.orders);
      } catch (err) {
        logger.error('Failed to fetch orders for tickets', err);
      }
    };
    fetchOrders();
  }, []);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  useEffect(() => {
    const newTickets = createSeedTickets(orders);
    setTickets(newTickets);
    // Устанавливаем первый тикет как выбранный только если нет выбранного
    if (newTickets.length > 0 && !selectedTicketId) {
      setSelectedTicketId(newTickets[0].id);
    }
  }, [orders, selectedTicketId]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [newMessage, setNewMessage] = useState('');
  const [internalOnly, setInternalOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active');

  // Разделение тикетов на активные и решённые
  const activeTickets = tickets.filter(
    (t) => t.status === 'open' || t.status === 'in_progress',
  );
  const resolvedTickets = tickets.filter(
    (t) => t.status === 'resolved' || t.status === 'closed',
  );

  // Фильтрация по поисковому запросу
  const filterBySearch = (ticketList: Ticket[]) => {
    if (!debouncedSearchQuery.trim()) return ticketList;
    const q = debouncedSearchQuery.toLowerCase();
    return ticketList.filter(
      (ticket) =>
        ticket.id.toLowerCase().includes(q) ||
        ticket.orderId.toLowerCase().includes(q) ||
        ticket.userEmail.toLowerCase().includes(q) ||
        ticket.subject.toLowerCase().includes(q) ||
        ticket.description.toLowerCase().includes(q) ||
        ticket.messages.some((m) => m.text.toLowerCase().includes(q)),
    );
  };

  const filteredActiveTickets = filterBySearch(activeTickets);
  const filteredResolvedTickets = filterBySearch(resolvedTickets);
  const filteredTickets =
    activeTab === 'active' ? filteredActiveTickets : filteredResolvedTickets;

  const updateTicketStatus = (id: string, status: TicketStatus) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status,
              updatedAt: new Date().toISOString(),
              messages: [
                ...t.messages,
                {
                  id: `SYS-${id}-${t.messages.length + 1}`,
                  author: 'system',
                  internal: true,
                  createdAt: new Date().toISOString(),
                  text:
                    status === 'open'
                      ? 'Тикет открыт оператором'
                      : status === 'in_progress'
                      ? 'Тикет взят в работу'
                      : status === 'resolved'
                      ? 'Тикет отмечен как решённый'
                      : 'Тикет закрыт',
                },
              ],
            }
          : t,
      ),
    );
    toast.success('Статус тикета обновлён');
  };

  const selectedTicket = useMemo(() => {
    const ticket = tickets.find((t) => t.id === selectedTicketId);
    // Если выбранный тикет не в текущей вкладке, выбираем первый из текущей
    if (
      ticket &&
      activeTab === 'active' &&
      (ticket.status === 'resolved' || ticket.status === 'closed')
    ) {
      return filteredTickets[0] ?? null;
    }
    if (
      ticket &&
      activeTab === 'resolved' &&
      (ticket.status === 'open' || ticket.status === 'in_progress')
    ) {
      return filteredTickets[0] ?? null;
    }
    return ticket ?? filteredTickets[0] ?? null;
  }, [tickets, selectedTicketId, filteredTickets, activeTab]);

  // Обновляем выбранный тикет при смене вкладки
  useEffect(() => {
    if (filteredTickets.length > 0 && !filteredTickets.find((t) => t.id === selectedTicketId)) {
      setSelectedTicketId(filteredTickets[0].id);
    }
  }, [activeTab, filteredTickets, selectedTicketId]);

  const handleSendMessage = () => {
    if (!selectedTicket || !newMessage.trim()) return;

    const message: TicketMessage = {
      id: `OP-${selectedTicket.id}-${selectedTicket.messages.length + 1}`,
      author: 'operator',
      text: newMessage.trim(),
      createdAt: new Date().toISOString(),
      internal: internalOnly,
    };

    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicket.id
          ? {
              ...t,
              updatedAt: message.createdAt,
              messages: [...t.messages, message],
            }
          : t,
      ),
    );

    setNewMessage('');
    toast.success(
      internalOnly ? 'Служебная заметка сохранена' : 'Ответ по тикету сохранён',
    );
  };

  const statusBadge = (status: TicketStatus) => {
    if (status === 'open') return <Badge variant="secondary">Новый</Badge>;
    if (status === 'in_progress')
      return <Badge variant="outline">В работе</Badge>;
    return <Badge>Решён</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center gap-4">
            <Link to="/admin/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Поддержка / Тикеты
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Обращения клиентов по заказам и статусам пополнений
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl space-y-4 sm:space-y-6">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Поиск тикетов</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Найдите обращение по номеру тикета, заказу, email или тексту
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Поиск по ID тикета или email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Тикеты</CardTitle>
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'active' | 'resolved')}>
                    <TabsList>
                      <TabsTrigger value="active">
                        Активные ({activeTickets.length})
                      </TabsTrigger>
                      <TabsTrigger value="resolved">
                        Решённые ({resolvedTickets.length})
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent className="px-0 pb-4 sm:px-0">
                <div className="overflow-x-auto px-2 sm:px-4 md:px-6">
                  <Table className="w-full min-w-[800px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Тикет</TableHead>
                        <TableHead className="text-xs sm:text-sm">Заказ</TableHead>
                        <TableHead className="text-xs sm:text-sm">Тип</TableHead>
                        <TableHead className="text-xs sm:text-sm">Email</TableHead>
                        <TableHead className="text-xs sm:text-sm">Статус</TableHead>
                        <TableHead className="text-xs sm:text-sm">Обновлён</TableHead>
                        <TableHead className="text-xs sm:text-sm pr-4 sm:pr-6">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTickets.map((ticket) => (
                        <TableRow
                          key={ticket.id}
                          className={cn(
                            "transition-colors",
                            selectedTicket?.id === ticket.id
                              ? "bg-muted/60 hover:bg-muted/80"
                              : "hover:bg-muted/40",
                          )}
                        >
                          <TableCell className="font-mono text-sm">
                            {ticket.id}
                          </TableCell>
                          <TableCell className="text-sm">
                            <Link
                              to={`/admin/orders/${ticket.orderId}`}
                              className="text-primary hover:underline"
                            >
                              {ticket.orderId}
                            </Link>
                          </TableCell>
                          <TableCell className="text-sm">
                            <Badge variant="outline">
                              {ticket.type === 'payment'
                                ? 'Платёж'
                                : ticket.type === 'fulfillment'
                                ? 'Выполнение'
                                : ticket.type === 'account'
                                ? 'Аккаунт'
                                : 'Другое'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {ticket.userEmail}
                          </TableCell>
                          <TableCell>{statusBadge(ticket.status)}</TableCell>
                          <TableCell className="text-sm">
                            <div className="flex flex-col">
                              <span>
                                {new Date(ticket.updatedAt).toLocaleDateString('ru-RU')}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(ticket.updatedAt).toLocaleTimeString('ru-RU')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="pr-2 sm:pr-4 md:pr-6">
                            <div className="flex flex-col gap-1 items-start">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedTicketId(ticket.id)}
                                className="text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
                              >
                                Открыть
                              </Button>
                              {activeTab === 'active' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      updateTicketStatus(ticket.id, 'in_progress')
                                    }
                                    className="text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
                                  >
                                    В работу
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      updateTicketStatus(ticket.id, 'resolved')
                                    }
                                    className="text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
                                  >
                                    Решить
                                  </Button>
                                </>
                              )}
                              {activeTab === 'resolved' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    updateTicketStatus(ticket.id, 'open')
                                  }
                                  className="text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
                                >
                                  Открыть заново
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {selectedTicket && (
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Детали тикета</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Тип, описание и история сообщений по выбранному обращению
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID тикета</span>
                      <span className="font-mono">{selectedTicket.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Заказ</span>
                      <Link
                        to={`/admin/orders/${selectedTicket.orderId}`}
                        className="text-primary hover:underline font-mono"
                      >
                        {selectedTicket.orderId}
                      </Link>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span className="text-sm">
                        {selectedTicket.userEmail}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Тип</span>
                      <span className="text-sm">
                        {selectedTicket.type === 'payment'
                          ? 'Проблема с оплатой'
                          : selectedTicket.type === 'fulfillment'
                          ? 'Проблема с выполнением'
                          : selectedTicket.type === 'account'
                          ? 'Проблема с аккаунтом'
                          : 'Другое'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">
                      Описание проблемы
                    </h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {selectedTicket.description}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">
                      История сообщений
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {selectedTicket.messages.map((m) => (
                        <div
                          key={m.id}
                          className="rounded-md border p-2 text-xs space-y-1 bg-card/40"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {m.author === 'user'
                                ? 'Клиент'
                                : m.author === 'operator'
                                ? 'Оператор'
                                : 'Система'}
                              {m.internal && (
                                <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                                  служебная
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(m.createdAt).toLocaleString('ru-RU')}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground whitespace-pre-line">
                            {m.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">
                      Ответ / служебная заметка
                    </h4>
                    <Textarea
                      placeholder="Опишите действия оператора, ответ клиенту или служебную информацию..."
                      className="min-h-[120px]"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={internalOnly}
                          onChange={(e) => setInternalOnly(e.target.checked)}
                          className="h-3 w-3 rounded border-border bg-background"
                        />
                        <span>Сделать служебной (не видна клиенту)</span>
                      </label>
                      <Button
                        className="w-[140px]"
                        size="sm"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                      >
                        Сохранить
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Каналы связи для клиентов</CardTitle>
                <CardDescription>
                  Точки входа, которые видит пользователь на сайте
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <a
                  href="mailto:support@zvezda.ru"
                  className="w-full inline-flex"
                >
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="mr-2 h-4 w-4" />
                    support@zvezda.ru
                  </Button>
                </a>
                <a
                  href="https://t.me/zvezda_support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex"
                >
                  <Button variant="outline" className="w-full justify-start">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Telegram @zvezda_support
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

