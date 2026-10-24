'use client';

import { refreshSheet } from '@/app/[slug]/actions';
import { RefreshCw } from 'lucide-react';
import { useTransition } from 'react';
import styles from './layout.module.css';

export const RefreshButton: React.FC<{ storeId: string }> = ({ storeId }) => {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className={styles.button}
      disabled={isPending}
      onClick={() => startTransition(() => refreshSheet(storeId))}
      title="Relire le Google Sheet"
    >
      <RefreshCw size={16} className={isPending ? styles.spin : undefined} aria-hidden />
      <span className={styles.buttonLabel}>{isPending ? 'Lecture…' : 'Rafraîchir'}</span>
    </button>
  );
};
