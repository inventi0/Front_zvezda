import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { Card, CardContent } from '@/app/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion';
import { Input } from '@/app/components/ui/input';
import { Search, Mail, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { useSupportChat } from '@/app/contexts/SupportChatContext';

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { openChat } = useSupportChat();

  const faqs = [
    {
      category: 'Общие вопросы',
      items: [
        {
          question: 'Как быстро поступит пополнение?',
          answer: 'Большинство пополнений происходит автоматически и занимает 1-3 минуты. Некоторые товары требуют ручной проверки и могут занять до 24 часов. Время доставки указано на карточке каждого товара.',
        },
        {
          question: 'Нужна ли регистрация для покупки?',
          answer: 'Нет, регистрация не требуется. Вы можете совершить покупку, указав только email и данные для пополнения. Однако создание аккаунта позволит вам отслеживать историю заказов.',
        },
        {
          question: 'Какая комиссия за пополнение?',
          answer: 'Комиссия составляет 10% от суммы пополнения. Итоговая сумма к оплате всегда отображается перед подтверждением заказа.',
        },
      ],
    },
    {
      category: 'Оплата',
      items: [
        {
          question: 'Какие способы оплаты доступны?',
          answer: 'Мы принимаем оплату банковскими картами (Visa, Mastercard, МИР) и через Систему Быстрых Платежей (СБП). Все платежи проходят через защищенные платежные шлюзы.',
        },
        {
          question: 'Безопасна ли оплата?',
          answer: 'Да, все платежи проходят через сертифицированные платежные системы с SSL-шифрованием. Мы не храним данные ваших карт.',
        },
        {
          question: 'Что делать, если оплата не прошла?',
          answer: 'Если оплата не прошла, проверьте правильность введенных данных и наличие средств на карте. Если проблема сохраняется, обратитесь в службу поддержки.',
        },
      ],
    },
    {
      category: 'Пополнение аккаунта',
      items: [
        {
          question: 'Где найти ID аккаунта?',
          answer: 'Местоположение ID зависит от сервиса. Для Steam - это Steam ID в профиле. Для Telegram - username. Подробные инструкции указаны на странице каждого товара.',
        },
        {
          question: 'Что делать, если я указал неверный ID?',
          answer: 'Если заказ еще не начал обрабатываться, свяжитесь с поддержкой для отмены. Если пополнение уже выполнено, вернуть средства не получится.',
        },
        {
          question: 'Могу ли я пополнить чужой аккаунт?',
          answer: 'Да, вы можете указать любой ID аккаунта для пополнения. Главное - убедитесь в правильности введенных данных.',
        },
      ],
    },
    {
      category: 'Проблемы и возвраты',
      items: [
        {
          question: 'Пополнение не поступило, что делать?',
          answer: 'Проверьте статус заказа по номеру в личном кабинете или по ссылке из email. Если статус показывает "Выполнен", но средства не поступили, обратитесь в поддержку с номером заказа.',
        },
        {
          question: 'Можно ли вернуть заказ?',
          answer: 'Возврат возможен только до момента начала исполнения заказа. После того как пополнение выполнено или код активации выдан, возврат невозможен согласно законодательству о цифровых товарах.',
        },
        {
          question: 'Заказ завис в статусе "В обработке"',
          answer: 'Обработка обычно занимает до 3 минут. Если заказ висит в обработке более 10 минут, обратитесь в поддержку с номером заказа.',
        },
        {
          question: 'Что значит "Ручная проверка"?',
          answer: 'Некоторые заказы требуют ручной проверки нашей службой безопасности. Это стандартная процедура для защиты от мошенничества. Обработка может занять до 24 часов.',
        },
      ],
    },
    {
      category: 'Безопасность',
      items: [
        {
          question: 'Безопасно ли пользоваться сервисом?',
          answer: 'Да, мы используем современные технологии шифрования и соблюдаем все стандарты безопасности. Мы не храним данные карт и не запрашиваем пароли от аккаунтов.',
        },
        {
          question: 'Могут ли заблокировать мой аккаунт за пополнение?',
          answer: 'Мы работаем только с официальными методами пополнения. Риск блокировки минимален, но мы не можем гарантировать отсутствие проблем со стороны владельцев сервисов.',
        },
      ],
    },
  ];

  const filteredFaqs = faqs.map(category => ({
    ...category,
    items: category.items.filter(item => 
      searchQuery === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.items.length > 0);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-2">Часто задаваемые вопросы</h1>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 px-4">
              Не нашли ответ? Напишите нам в поддержку
            </p>

            {/* Search */}
            <div className="max-w-xl mx-auto relative px-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Поиск по вопросам..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-input"
              />
            </div>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-6 sm:space-y-8">
            {filteredFaqs.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 px-2">{category.category}</h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {category.items.map((item, itemIndex) => (
                    <AccordionItem 
                      key={itemIndex} 
                      value={`item-${categoryIndex}-${itemIndex}`}
                      className="border rounded-lg px-4 sm:px-6 bg-card"
                    >
                      <AccordionTrigger className="text-left hover:no-underline text-sm sm:text-base">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm sm:text-base text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          {/* Contact Support */}
          <Card className="mt-8 sm:mt-10 md:mt-12 bg-primary/5 border-primary/20">
            <CardContent className="p-6 sm:p-8 text-center">
              <h3 className="text-lg sm:text-xl font-bold mb-2">Не нашли ответ?</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                Свяжитесь с нашей службой поддержки, и мы поможем вам
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center flex-wrap">
                <Button onClick={openChat}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Открыть чат
                </Button>
                <a href="mailto:support@zvezda.ru">
                  <Button variant="outline">
                    <Mail className="mr-2 h-4 w-4" />
                    support@zvezda.ru
                  </Button>
                </a>
                <a href="https://t.me/zvezda_support" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Telegram
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
