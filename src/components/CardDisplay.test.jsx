import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CardDisplay from './CardDisplay';

const BASE_CARD = {
  id: 'test-id',
  name: 'Lightning Bolt',
  image: 'http://img.com/bolt.jpg',
  price: 1.5,
  rarity: 'common',
  isSelected: false,
  status: null,
};

describe('CardDisplay', () => {
  it('renderiza el nombre de la carta en el aria-label', () => {
    render(<CardDisplay card={BASE_CARD} onToggleSelect={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Lightning Bolt/i })).toBeInTheDocument();
  });

  it('muestra el precio de la carta', () => {
    render(<CardDisplay card={BASE_CARD} onToggleSelect={vi.fn()} />);
    expect(screen.getByText('Valor: $1.50')).toBeInTheDocument();
  });

  it('llama a onToggleSelect al hacer clic en una carta disponible', () => {
    const onToggleSelect = vi.fn();
    render(<CardDisplay card={BASE_CARD} onToggleSelect={onToggleSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /Lightning Bolt/i }));
    expect(onToggleSelect).toHaveBeenCalledWith('test-id');
  });

  it('no llama a onToggleSelect si la carta está procesada (SOLD)', () => {
    const onToggleSelect = vi.fn();
    const soldCard = { ...BASE_CARD, status: 'SOLD' };
    render(<CardDisplay card={soldCard} onToggleSelect={onToggleSelect} />);
    // La carta SOLD no tiene role=button, no es interactiva
    const element = document.querySelector('.mtg-card');
    fireEvent.click(element);
    expect(onToggleSelect).not.toHaveBeenCalled();
  });

  it('muestra el badge "Vendida" cuando status es SOLD', () => {
    const soldCard = { ...BASE_CARD, status: 'SOLD' };
    render(<CardDisplay card={soldCard} onToggleSelect={vi.fn()} />);
    expect(screen.getByText('Vendida')).toBeInTheDocument();
  });

  it('muestra el badge "Canjeada" cuando status es REDEEMED', () => {
    const redeemedCard = { ...BASE_CARD, status: 'REDEEMED' };
    render(<CardDisplay card={redeemedCard} onToggleSelect={vi.fn()} />);
    expect(screen.getByText('Canjeada')).toBeInTheDocument();
  });

  it('muestra el fallback cuando la imagen falla', () => {
    render(<CardDisplay card={BASE_CARD} onToggleSelect={vi.fn()} />);
    const img = document.querySelector('.card-image');
    fireEvent.error(img);
    expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
    expect(document.querySelector('.card-image-fallback')).toBeInTheDocument();
  });

  it('aplica clase selected cuando isSelected es true', () => {
    const selectedCard = { ...BASE_CARD, isSelected: true };
    render(<CardDisplay card={selectedCard} onToggleSelect={vi.fn()} />);
    expect(document.querySelector('.mtg-card.selected')).toBeInTheDocument();
  });

  it('se puede activar con la tecla Enter', () => {
    const onToggleSelect = vi.fn();
    render(<CardDisplay card={BASE_CARD} onToggleSelect={onToggleSelect} />);
    const btn = screen.getByRole('button', { name: /Lightning Bolt/i });
    fireEvent.keyDown(btn, { key: 'Enter' });
    expect(onToggleSelect).toHaveBeenCalledWith('test-id');
  });

  it('muestra el botón de zoom cuando se pasa onZoom', () => {
    const onZoom = vi.fn();
    render(<CardDisplay card={BASE_CARD} onToggleSelect={vi.fn()} onZoom={onZoom} />);
    expect(screen.getByRole('button', { name: /ver lightning bolt a tamaño completo/i })).toBeInTheDocument();
  });

  it('llama a onZoom al hacer clic en el botón de zoom', () => {
    const onZoom = vi.fn();
    render(<CardDisplay card={BASE_CARD} onToggleSelect={vi.fn()} onZoom={onZoom} />);
    fireEvent.click(screen.getByRole('button', { name: /ver lightning bolt a tamaño completo/i }));
    expect(onZoom).toHaveBeenCalledTimes(1);
  });

  it('no muestra botón de zoom si onZoom no es pasado', () => {
    render(<CardDisplay card={BASE_CARD} onToggleSelect={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /tamaño completo/i })).not.toBeInTheDocument();
  });
});
