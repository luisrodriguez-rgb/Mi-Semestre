'use client';

import { useMySkinSync } from '@/hooks/useMySkinSync';

export function MySkinSyncBridge() {
  useMySkinSync();
  return null;
}
