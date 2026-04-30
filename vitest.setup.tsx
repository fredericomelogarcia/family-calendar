import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';

(globalThis as unknown as Record<string, unknown>).render = render;
(globalThis as unknown as Record<string, unknown>).fireEvent = fireEvent;
(globalThis as unknown as Record<string, unknown>).screen = screen;
(globalThis as unknown as Record<string, unknown>).waitFor = waitFor;

vi.mock('@/components/ui/modal', () => ({
  Modal: ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;
    return (
      <div role="dialog" aria-modal="true">
        <div>
          {title && <h2>{title}</h2>}
          <button onClick={onClose}>Close</button>
        </div>
        <div>{children}</div>
      </div>
    );
  },
}));
