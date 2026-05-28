import { Order, OrderStatus, PlatformId } from '../types/orders';

const PLATFORMS: PlatformId[] = ['pedidosya', 'rappi', 'glovo', 'ubereats'];
const STATUSES: OrderStatus[] = ['new', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'];

const DISHES = [
  { name: 'Milanesa a la Napolitana', price: 12500 },
  { name: 'Empanada de Carne', price: 1200 },
  { name: 'Alfajor de Maicena', price: 1500 },
  { name: 'Parrillada Completa', price: 35000 },
  { name: 'Ensalada Caesar', price: 8500 },
  { name: 'Pizza Muzarella', price: 10000 },
  { name: 'Hamburguesa Triple con Queso', price: 9500 },
  { name: 'Pasta con Tuco', price: 7800 },
];

const CUSTOMERS = [
  { name: 'Juan Pérez', phone: '11 2345-6789', address: 'Av. Corrientes 1234' },
  { name: 'María García', phone: '11 9876-5432', address: 'Rivadavia 4567' },
  { name: 'Ricardo Darín', phone: '11 5555-1234', address: 'Palermo 789' },
  { name: 'Lionel Messi', phone: '11 1010-1010', address: 'Rosario 10' },
  { name: 'Antonela Roccuzzo', phone: '11 2020-2020', address: 'Barcelona 20' },
];

export function generateRandomOrder(platform?: PlatformId, status?: OrderStatus): Order {
  const selectedPlatform = platform || PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
  const selectedStatus = status || STATUSES[Math.floor(Math.random() * 3)]; // Bias towards new/confirmed/preparing
  const customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
  
  const numItems = Math.floor(Math.random() * 4) + 1;
  const items = Array.from({ length: numItems }).map((_, i) => {
    const dish = DISHES[Math.floor(Math.random() * DISHES.length)];
    return {
      id: `item-${Math.random().toString(36).substring(7)}`,
      name: dish.name,
      quantity: Math.floor(Math.random() * 3) + 1,
      unitPrice: dish.price,
    };
  });

  const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const total = subtotal; // Simpler for mock
  
  // Random date within last hour
  const createdAt = new Date(Date.now() - Math.floor(Math.random() * 60 * 60 * 1000));

  return {
    id: `ord-${Math.random().toString(36).substring(7)}`,
    externalId: Math.floor(Math.random() * 10000).toString(),
    platform: selectedPlatform,
    status: selectedStatus,
    createdAt,
    updatedAt: new Date(),
    customer,
    items,
    subtotal,
    total,
    paymentMethod: Math.random() > 0.5 ? 'online' : 'card',
  };
}

export const initialOrders: Order[] = Array.from({ length: 20 }).map(() => generateRandomOrder());
