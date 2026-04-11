import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Inventory from './Inventory';

const MOCK_CARDS = [
  { id: '1', name: 'Lightning Bolt', rarity: 'rare',     image: '', price: 5.00, isSelected: false, status: null },
  { id: '2', name: 'Forest',         rarity: 'common',   image: '', price: 0.25, isSelected: false, status: null },
  { id: '3', name: 'Counterspell',   rarity: 'uncommon', image: '', price: 1.50, isSelected: false, status: null },
  { id: '4', name: 'Treasure Token', rarity: 'token',    image: '', price: 0.10, isSelected: false, status: null },
];

const DEFAULT_PROPS = {
  cards: MOCK_CARDS,
  onGoBack: vi.fn(),
  onAddCredit: vi.fn(),
};

describe('Inventory', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('muestra la sección de Raras / Míticas', () => {
    render(<Inventory {...DEFAULT_PROPS} />);
    expect(screen.getByText('Raras / Míticas')).toBeInTheDocument();
  });

  it('muestra la sección de Infrecuentes', () => {
    render(<Inventory {...DEFAULT_PROPS} />);
    expect(screen.getByText('Infrecuentes')).toBeInTheDocument();
  });

  it('muestra la sección de Comunes & Tokens', () => {
    render(<Inventory {...DEFAULT_PROPS} />);
    expect(screen.getByText('Comunes & Tokens')).toBeInTheDocument();
  });

  it('calcula y muestra el valor total del sobre correctamente', () => {
    render(<Inventory {...DEFAULT_PROPS} />);
    // 5.00 + 0.25 + 1.50 + 0.10 = 6.85
    expect(screen.getByText('$6.85')).toBeInTheDocument();
  });

  it('no muestra secciones de rareza vacías', () => {
    const onlyCommons = [MOCK_CARDS[1]]; // solo Forest
    render(<Inventory {...DEFAULT_PROPS} cards={onlyCommons} />);
    expect(screen.queryByText('Raras / Míticas')).not.toBeInTheDocument();
    expect(screen.queryByText('Infrecuentes')).not.toBeInTheDocument();
    expect(screen.getByText('Comunes & Tokens')).toBeInTheDocument();
  });

  it('el input de búsqueda filtra cartas por nombre', () => {
    render(<Inventory {...DEFAULT_PROPS} />);
    const searchInput = screen.getByPlaceholderText(/buscar carta/i);
    fireEvent.change(searchInput, { target: { value: 'lightning' } });
    expect(screen.getByText('Raras / Míticas')).toBeInTheDocument();
    expect(screen.queryByText('Infrecuentes')).not.toBeInTheDocument();
  });

  it('el filtro no hace distinción de mayúsculas', () => {
    render(<Inventory {...DEFAULT_PROPS} />);
    const searchInput = screen.getByPlaceholderText(/buscar carta/i);
    fireEvent.change(searchInput, { target: { value: 'FOREST' } });
    expect(screen.getByText('Comunes & Tokens')).toBeInTheDocument();
    expect(screen.queryByText('Raras / Míticas')).not.toBeInTheDocument();
  });

  it('al limpiar el buscador vuelven a mostrarse todas las secciones', () => {
    render(<Inventory {...DEFAULT_PROPS} />);
    const searchInput = screen.getByPlaceholderText(/buscar carta/i);
    fireEvent.change(searchInput, { target: { value: 'xyz' } });
    expect(screen.queryByText('Raras / Míticas')).not.toBeInTheDocument();
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('Raras / Míticas')).toBeInTheDocument();
  });

  it('Seleccionar Todo selecciona todas las cartas disponibles', () => {
    render(<Inventory {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByText('Seleccionar Todo'));
    // El resumen de selección debe mostrar 4 seleccionadas
    expect(screen.getByText(/4 seleccionadas/i)).toBeInTheDocument();
  });

  it('Deseleccionar Todo quita la selección de todas las cartas', () => {
    render(<Inventory {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByText('Seleccionar Todo'));
    fireEvent.click(screen.getByText('Deseleccionar Todo'));
    // Usar regex con número para no coincidir con el texto del tutorial
    expect(screen.queryByText(/\d+ seleccionadas/i)).not.toBeInTheDocument();
  });

  it('muestra el tutorial en el primer uso', () => {
    localStorage.removeItem('hasSeenInventoryTutorial');
    render(<Inventory {...DEFAULT_PROPS} />);
    expect(screen.getByText(/Guía Rápida/i)).toBeInTheDocument();
  });

  it('no muestra el tutorial si ya fue visto', () => {
    localStorage.setItem('hasSeenInventoryTutorial', 'true');
    render(<Inventory {...DEFAULT_PROPS} />);
    expect(screen.queryByText(/Guía Rápida/i)).not.toBeInTheDocument();
  });
});
