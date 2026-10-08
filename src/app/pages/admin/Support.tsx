import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Mail, MessageCircle, Search, Send, StickyNote } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/app/components/AdminLayout';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Textarea } from '@/app/components/ui/textarea';
import { cn } from '@/app/components/ui/utils';
import { adminOrdersService } from '@/app/services';
import type { Ticket, TicketMessage, TicketStatus, TicketType } from '@/app/types';
import { logger } from '@/app/utils/logger';

const typeLabels: Record<TicketType, string> = {
  payment: 'Платёж',
  fulfillment: 'Выполнение',
  account: 'Аккаунт',
  other: 'Другое',
};

const statusLabels: Record<TicketStatus, string> = {
  open: 'Новый',
  in_progress: 'В работе',
  resolved: 'Решён',
  closed: 'Закрыт',
};

const createSeedTickets = (
  orders: Awaited<ReturnType<typeof adminOrdersService.getOrders>>['orders'],
): Ticket[] => orders.map((order, index) => {
  const status: TicketStatus = order.status === 'failed'
    ? 'in_progress'
    : order.status === 'manual_review'
      ? 'open'
      : 'resolved';
  const type: TicketType = order.status === 'failed'
    ? 'fulfillment'
    : order.status === 'manual_review'
      ? 'payment'
      : 'other';
  const message: TicketMessage = {
    id: `MSG-${index + 1}-1`,
    author: 'user',
    text: 'Краткое описание проблемы клиента. В реальной системе это поле будет заполнено сообщением из формы поддержки или личного кабинета.',
    createdAt: order.createdAt,
    internal: false,
  };

  return {
    id: `T-${index + 1}`,
    orderId: order.id,
    userEmail: order.email,
    type,
    subject: order.status === 'failed'
      ? 'Ошибка выполнения заказа'
      : order.status === 'manual_review'
        ? 'Вопрос по ручной проверке'
        : 'Вопрос по заказу',
    description: message.text,
    status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    messages: [message],
  };
});

function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge
      variant={status === 'resolved' ? 'default' : status === 'in_progress' ? 'outline' : 'secondary'}
      className={cn(
        'font-medium',
        status === 'open' && 'bg-amber-100 text-amber-800 hover:bg-amber-100',
        status === 'in_progress' && 'border-blue-200 bg-blue-50 text-blue-700',
      )}
    >
      {statusLabels[status]}
    </Badge>
  );
}

export default function AdminSupport() {
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof adminOrdersService.getOrders>>['orders']>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [internalOnly, setInternalOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const result = await adminOrdersService.getOrders();
        setOrders(result.orders);
      } catch (error) {
        logger.error('Failed to fetch orders for tickets', error);
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    const nextTickets = createSeedTickets(orders);
    setTickets(nextTickets);
    setSelectedTicketId((current) => (
      current && nextTickets.some((ticket) => ticket.id === current)
        ? current
        : nextTickets[0]?.id ?? null
    ));
  }, [orders]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const activeTickets = tickets.filter((ticket) => ticket.status === 'open' || ticket.status === 'in_progress');
  const resolvedTickets = tickets.filter((ticket) => ticket.status === 'resolved' || ticket.status === 'closed');

  const filteredTickets = useMemo(() => {
    const source = activeTab === 'active' ? activeTickets : resolvedTickets;
    const query = debouncedSearchQuery.trim().toLowerCase();
    if (!query) return source;
    return source.filter((ticket) => (
      ticket.id.toLowerCase().includes(query)
      || ticket.orderId.toLowerCase().includes(query)
      || ticket.userEmail.toLowerCase().includes(query)
      || ticket.subject.toLowerCase().includes(query)
      || ticket.description.toLowerCase().includes(query)
      || ticket.messages.some((message) => message.text.toLowerCase().includes(query))
    ));
  }, [activeTab, activeTickets, debouncedSearchQuery, resolvedTickets]);

  const selectedTicket = useMemo(() => {
    const current = tickets.find((ticket) => ticket.id === selectedTicketId);
    return filteredTickets.find((ticket) => ticket.id === current?.id) ?? filteredTickets[0] ?? null;
  }, [filteredTickets, selectedTicketId, tickets]);

  useEffect(() => {
    if (filteredTickets.length > 0 && !filteredTickets.some((ticket) => ticket.id === selectedTicketId)) {
      setSelectedTicketId(filteredTickets[0].id);
    }
  }, [filteredTickets, selectedTicketId]);

  const updateTicketStatus = (id: string, status: TicketStatus) => {
    const timestamp = new Date().toISOString();
    setTickets((current) => current.map((ticket) => ticket.id === id ? {
      ...ticket,
      status,
      updatedAt: timestamp,
      messages: [
        ...ticket.messages,
        {
          id: `SYS-${id}-${ticket.messages.length + 1}`,
          author: 'system',
          internal: true,
          createdAt: timestamp,
          text: status === 'open'
            ? 'Тикет открыт оператором'
            : status === 'in_progress'
              ? 'Тикет взят в работу'
              : status === 'resolved'
                ? 'Тикет отмечен как решённый'
                : 'Тикет закрыт',
        },
      ],
    } : ticket));
    setActiveTab(status === 'resolved' || status === 'closed' ? 'resolved' : 'active');
    toast.success('Статус тикета обновлён');
  };

  const handleSendMessage = () => {
    if (!selectedTicket || !newMessage.trim()) return;
    const message: TicketMessage = {
      id: `OP-${selectedTicket.id}-${selectedTicket.messages.length + 1}`,
      author: 'operator',
      text: newMessage.trim(),
      createdAt: new Date().toISOString(),
      internal: internalOnly,
    };

    setTickets((current) => current.map((ticket) => ticket.id === selectedTicket.id ? {
      ...ticket,
      updatedAt: message.createdAt,
      messages: [...ticket.messages, message],
    } : ticket));
    setNewMessage('');
    toast.success(internalOnly ? 'Служебная заметка сохранена' : 'Ответ по тикету сохранён');
  };

  return (
    <AdminLayout
      title="Тикеты"
      description="Единая очередь обращений клиентов и рабочая область оператора."
    >
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'active' | 'resolved')}>
          <TabsList>
            <TabsTrigger value="active">Активные {activeTickets.length}</TabsTrigger>
            <TabsTrigger value="resolved">Решённые {resolvedTickets.length}</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Тикет, заказ, email или текст"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-9 pr-14"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {filteredTickets.length}
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="grid xl:grid-cols-[minmax(0,1.08fr)_minmax(400px,.92fr)]">
          <section className="min-w-0 border-b xl:border-b-0 xl:border-r" aria-label="Список тикетов">
            <div className="hidden grid-cols-[72px_minmax(0,1fr)_minmax(130px,.7fr)_auto] gap-3 border-b bg-muted/30 px-4 py-3 text-xs font-medium text-muted-foreground md:grid">
              <span>Ключ</span>
              <span>Обращение</span>
              <span>Клиент</span>
              <span>Статус</span>
            </div>

            {filteredTickets.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                <MessageCircle className="mb-3 h-7 w-7 text-muted-foreground" />
                <p className="font-medium">Тикеты не найдены</p>
                <p className="mt-1 text-sm text-muted-foreground">Измените запрос или выберите другую очередь.</p>
              </div>
            ) : filteredTickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                aria-pressed={selectedTicket?.id === ticket.id}
                onClick={() => setSelectedTicketId(ticket.id)}
                className={cn(
                  'grid w-full grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3 border-b px-4 py-3 text-left transition-colors last:border-b-0 md:grid-cols-[72px_minmax(0,1fr)_minmax(130px,.7fr)_auto]',
                  selectedTicket?.id === ticket.id ? 'bg-primary/8 shadow-[inset_3px_0_0_var(--primary)]' : 'hover:bg-muted/40',
                )}
              >
                <span className="font-mono text-xs text-muted-foreground">{ticket.id}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{ticket.subject}</span>
                  <span className="mt-1 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                    <span>{typeLabels[ticket.type]}</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{ticket.orderId}</span>
                    <span aria-hidden="true">·</span>
                    <span>{new Date(ticket.updatedAt).toLocaleDateString('ru-RU')}</span>
                  </span>
                </span>
                <span className="hidden min-w-0 truncate text-xs text-muted-foreground md:block">{ticket.userEmail}</span>
                <StatusBadge status={ticket.status} />
              </button>
            ))}
          </section>

          <aside className="min-w-0 bg-background/35" aria-label="Карточка выбранного тикета">
            {selectedTicket ? (
              <div className="flex h-full min-h-[620px] flex-col">
                <div className="border-b px-5 py-4 sm:px-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Тикеты / {selectedTicket.id}
                    </p>
                    <Select
                      value={selectedTicket.status}
                      onValueChange={(value) => updateTicketStatus(selectedTicket.id, value as TicketStatus)}
                    >
                      <SelectTrigger className="h-8 w-[150px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Новый</SelectItem>
                        <SelectItem value="in_progress">В работе</SelectItem>
                        <SelectItem value="resolved">Решён</SelectItem>
                        <SelectItem value="closed">Закрыт</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <h2 className="mt-4 text-2xl font-bold tracking-tight">{selectedTicket.subject}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{selectedTicket.description}</p>
                </div>

                <div className="grid gap-x-5 gap-y-3 border-b px-5 py-4 text-sm sm:grid-cols-[110px_minmax(0,1fr)] sm:px-6">
                  <span className="text-muted-foreground">Статус</span>
                  <span><StatusBadge status={selectedTicket.status} /></span>
                  <span className="text-muted-foreground">Тип</span>
                  <span>{typeLabels[selectedTicket.type]}</span>
                  <span className="text-muted-foreground">Заказ</span>
                  <Link to={`/admin/orders/${selectedTicket.orderId}`} className="inline-flex items-center gap-1 font-mono text-primary hover:underline">
                    {selectedTicket.orderId}<ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                  <span className="text-muted-foreground">Клиент</span>
                  <a href={`mailto:${selectedTicket.userEmail}`} className="truncate hover:underline">{selectedTicket.userEmail}</a>
                  <span className="text-muted-foreground">Создан</span>
                  <span>{new Date(selectedTicket.createdAt).toLocaleString('ru-RU')}</span>
                  <span className="text-muted-foreground">Обновлён</span>
                  <span>{new Date(selectedTicket.updatedAt).toLocaleString('ru-RU')}</span>
                </div>

                <div className="flex-1 px-5 py-5 sm:px-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold">Комментарии</h3>
                    <span className="text-xs text-muted-foreground">{selectedTicket.messages.length}</span>
                  </div>
                  <div className="space-y-3">
                    {selectedTicket.messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          'rounded-xl border p-3',
                          message.internal ? 'border-amber-200 bg-amber-50/70' : 'bg-card',
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-medium">
                            {message.author === 'user' ? 'Клиент' : message.author === 'operator' ? 'Оператор' : 'Система'}
                            {message.internal && <span className="ml-2 text-amber-700">Служебная</span>}
                          </span>
                          <span className="text-muted-foreground">{new Date(message.createdAt).toLocaleString('ru-RU')}</span>
                        </div>
                        <p className="mt-2 whitespace-pre-line text-sm leading-5 text-muted-foreground">{message.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t bg-card px-5 py-4 sm:px-6">
                  <Textarea
                    placeholder="Напишите ответ клиенту или служебную заметку…"
                    className="min-h-24 resize-y"
                    value={newMessage}
                    onChange={(event) => setNewMessage(event.target.value)}
                  />
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={internalOnly}
                        onChange={(event) => setInternalOnly(event.target.checked)}
                        className="h-4 w-4 rounded border-border"
                      />
                      <StickyNote className="h-3.5 w-3.5" />
                      Только служебная заметка
                    </label>
                    <Button size="sm" onClick={handleSendMessage} disabled={!newMessage.trim()}>
                      <Send className="mr-2 h-4 w-4" />
                      {internalOnly ? 'Сохранить заметку' : 'Добавить ответ'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[420px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
                Выберите тикет из списка, чтобы открыть рабочую область.
              </div>
            )}
          </aside>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span>Каналы поддержки:</span>
        <a href="mailto:support@zvezda.ru" className="inline-flex items-center gap-1.5 hover:text-foreground">
          <Mail className="h-3.5 w-3.5" />support@zvezda.ru
        </a>
        <a href="https://t.me/zvezda_support" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-foreground">
          <MessageCircle className="h-3.5 w-3.5" />Telegram @zvezda_support
        </a>
      </div>
    </AdminLayout>
  );
}
