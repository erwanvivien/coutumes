'use client';

import { FileDown } from 'lucide-react';

/** Opens the browser's print dialog, where "Enregistrer au format PDF" produces the file. */
export const PrintButton: React.FC<{ className?: string; label?: string }> = ({
  className,
  label = 'Exporter en PDF',
}) => (
  <button type="button" className={className} onClick={() => window.print()}>
    <FileDown size={16} aria-hidden />
    {label}
  </button>
);
