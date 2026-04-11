import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

const BrokenChild = () => { throw new Error('Test error'); };
const OkChild = () => <p>Todo bien</p>;

describe('ErrorBoundary', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renderiza los hijos cuando no hay error', () => {
    render(<ErrorBoundary><OkChild /></ErrorBoundary>);
    expect(screen.getByText('Todo bien')).toBeInTheDocument();
  });

  it('muestra la UI de error cuando un hijo lanza excepción', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorBoundary><BrokenChild /></ErrorBoundary>);
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
  });

  it('muestra el botón de recargar', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorBoundary><BrokenChild /></ErrorBoundary>);
    expect(screen.getByRole('button', { name: /recargar/i })).toBeInTheDocument();
  });

  it('muestra el mensaje descriptivo del error', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorBoundary><BrokenChild /></ErrorBoundary>);
    expect(screen.getByText(/ocurrió un error inesperado/i)).toBeInTheDocument();
  });

  it('no muestra la UI de error cuando los hijos renderizan sin problemas', () => {
    render(<ErrorBoundary><OkChild /></ErrorBoundary>);
    expect(screen.queryByText('Algo salió mal')).not.toBeInTheDocument();
  });
});
