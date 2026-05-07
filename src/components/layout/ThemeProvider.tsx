"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Provider untuk mengelola tema dark/light secara global.
 * 'suppressHydrationWarning' pada <html> sangat disarankan saat menggunakan ini.
 */
export function ThemeProvider({ 
  children, 
  ...props 
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  );
}