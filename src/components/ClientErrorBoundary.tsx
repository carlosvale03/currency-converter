'use client';

import React from 'react';
import { logger } from '@/lib/logger';

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type State = { hasError: boolean };

export class ClientErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    logger.error(`component error: ${error.message}`);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-3 py-2 text-sm"
          >
            Ocorreu um erro ao renderizar este bloco.
          </div>
        )
      );
    }
    return this.props.children;
  }
}
