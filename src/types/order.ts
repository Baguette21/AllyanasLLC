export type OrderStatus = 'in-progress';

export interface OrderItem {
  name: string;
  quantity: number;
}

export interface Order {
  id: string;
  orderType: string;
  customerName: string;
  table: string | null;
  contactNumber: string | null;
  timeOfOrder: string;
  price: number;
  items: OrderItem[];
  additionalInfo?: string;
  paymentMethod?: string;
  gcashReferenceNumber?: string;
}

export interface CompletedOrder extends Order {
  timeCompleted: string;
  completedAt?: string;
  isPaid?: boolean;
  status?: string;
  paidAt?: string;
}
