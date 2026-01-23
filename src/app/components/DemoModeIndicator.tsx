/**
 * Demo Mode Indicator
 * Shows a badge when the app is running in demo/mock mode
 */

import { Badge } from '@/app/components/ui/badge';
import { config } from '@/app/config/env';
import { FlaskConical } from 'lucide-react';

export function DemoModeIndicator() {
  // Only show in development when mock data is enabled
  if (config.environment !== 'development' || !config.enableMockData) {
    return null;
  }

  return (
    <Badge 
      variant="outline" 
      className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-xs font-medium"
      title="Демо-режим: используются mock данные. Для переключения на реальный API создайте .env файл с VITE_USE_MOCK_DATA=false"
    >
      <FlaskConical className="h-3 w-3 mr-1" />
      Демо-режим
    </Badge>
  );
}
