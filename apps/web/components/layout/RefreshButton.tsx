'use client';

import { refreshSheet } from '@/app/actions';
import { RefreshCw } from 'lucide-react';
import { useTransition } from 'react';
import styles from './layout.module.css';

export const RefreshButton: React.FC = () => {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className={styles.button}
      disabled={isPending}
      onClick={() => startTransition(() => refreshSheet())}
      title="Relire le Google Sheet"
    >
      <RefreshCw size={16} className={isPending ? styles.spin : undefined} aria-hidden />
      {isPending ? 'Lecture…' : 'Rafraîchir'}
    </button>
  );
};
