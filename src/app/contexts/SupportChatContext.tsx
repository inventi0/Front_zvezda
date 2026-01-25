"use client";

import * as React from "react";

type SupportChatContextValue = {
  openChat: () => void;
};

const SupportChatContext = React.createContext<SupportChatContextValue | null>(null);

export function SupportChatProvider({
  children,
  openChatRef,
}: {
  children: React.ReactNode;
  /** Ref to set the open function from the widget */
  openChatRef: React.MutableRefObject<(() => void) | null>;
}) {
  const openChat = React.useCallback(() => {
    openChatRef.current?.();
  }, [openChatRef]);

  const value = React.useMemo(() => ({ openChat }), [openChat]);

  return (
    <SupportChatContext.Provider value={value}>
      {children}
    </SupportChatContext.Provider>
  );
}

export function useSupportChat(): SupportChatContextValue {
  const ctx = React.useContext(SupportChatContext);
  if (!ctx) {
    return {
      openChat: () => {},
    };
  }
  return ctx;
}
