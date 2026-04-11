import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Mockear Inventory (lazy) y PackOpener para evitar llamadas reales a la API
vi.mock('./components/Inventory', () => ({
  default: ({ onGoBack }) => (
    <div data-testid="inventory">
      <button onClick={onGoBack}>Volver a la Tienda</button>
    </div>
  ),
}));

vi.mock('./components/PackOpener', () => ({
  default: ({ onComplete, onBack }) => (
    <div data-testid="pack-opener">
      <button onClick={() => onComplete([])}>Complete</button>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

describe('App', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('muestra la vista de tienda por defecto', () => {
    render(<App />);
    expect(screen.getByText('Sobres Digitales')).toBeInTheDocument();
  });

  it('muestra el saldo inicial de $5.00', () => {
    render(<App />);
    expect(screen.getByText('$5.00')).toBeInTheDocument();
  });

  it('restaura el saldo desde sessionStorage', () => {
    sessionStorage.setItem('mtg_version', '1');
    sessionStorage.setItem('mtg_credit', '12.50');
    render(<App />);
    expect(screen.getByText('$12.50')).toBeInTheDocument();
  });

  it('muestra alerta de saldo insuficiente cuando el crédito es bajo', () => {
    sessionStorage.setItem('mtg_version', '1');
    sessionStorage.setItem('mtg_credit', '1.00');
    render(<App />);
    fireEvent.click(screen.getByText('Comprar y Abrir Ahora'));
    expect(screen.getByText('⚠️ Saldo Insuficiente')).toBeInTheDocument();
  });

  it('cierra la alerta de saldo insuficiente al pulsar Entendido', () => {
    sessionStorage.setItem('mtg_version', '1');
    sessionStorage.setItem('mtg_credit', '0.00');
    render(<App />);
    fireEvent.click(screen.getByText('Comprar y Abrir Ahora'));
    fireEvent.click(screen.getByText('Entendido'));
    expect(screen.queryByText('⚠️ Saldo Insuficiente')).not.toBeInTheDocument();
  });

  it('muestra modal de confirmación de compra cuando hay saldo suficiente', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Comprar y Abrir Ahora'));
    expect(screen.getByText('🛒 Confirmar Compra')).toBeInTheDocument();
  });

  it('cancela la compra sin descontar saldo', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Comprar y Abrir Ahora'));
    fireEvent.click(screen.getByText('Cancelar'));
    expect(screen.getByText('$5.00')).toBeInTheDocument();
    expect(screen.queryByText('🛒 Confirmar Compra')).not.toBeInTheDocument();
  });

  it('descuenta el precio del sobre ($3.99) al confirmar la compra', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Comprar y Abrir Ahora'));
    fireEvent.click(screen.getByText('Comprar'));
    // 5.00 - 3.99 = 1.01
    expect(screen.getByText('$1.01')).toBeInTheDocument();
  });

  it('transiciona a la vista de apertura al confirmar la compra', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Comprar y Abrir Ahora'));
    fireEvent.click(screen.getByText('Comprar'));
    expect(screen.getByTestId('pack-opener')).toBeInTheDocument();
  });

  it('muestra el historial de sobres tras abrir un sobre', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('Comprar y Abrir Ahora'));
    fireEvent.click(screen.getByText('Comprar'));
    // PackOpener mock llama onComplete con []
    fireEvent.click(screen.getByText('Complete'));
    // Esperar a que el Inventory lazy se resuelva y muestre el botón
    const backBtn = await screen.findByText('Volver a la Tienda');
    fireEvent.click(backBtn);
    expect(screen.getByText(/historial/i)).toBeInTheDocument();
  });
});
