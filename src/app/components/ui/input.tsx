import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  // Отключаем HTML5 валидацию для email полей, заменяя type="email" на type="text" с inputMode="email"
  // Это предотвращает появление стандартных сообщений браузера типа "The string did not match the expected pattern"
  const finalType = type === 'email' ? 'text' : type;
  const inputMode = type === 'email' ? 'email' : undefined;

  return (
    <input
      type={finalType}
      inputMode={inputMode}
      data-slot="input"
      className={cn(
        // Увеличенный и более заметный инпут
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-11 w-full min-w-0 rounded-lg border-2 px-3.5 py-2 text-base bg-input-background transition-[color,box-shadow,border-color] outline-none file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-base",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
