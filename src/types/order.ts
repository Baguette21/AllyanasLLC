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
  items: OrderItem[];
  additionalInfo?: string;
}

export interface CompletedOrder extends Order {
  timeCompleted: string;
}
