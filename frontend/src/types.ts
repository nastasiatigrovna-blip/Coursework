export interface User {
  id: number;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  categoryId: number;
  imageUrl: string;
  difficulty: 'BEGINNER' | 'EASY' | 'MEDIUM' | 'ADVANCED' | 'EXPERT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  moderationNote?: string;
  owner?: { id: number; name: string; email?: string };
  options: ProductOption[];
  category?: Category;
}

export interface ProductOption {
  id: number;
  type: 'ITEM' | 'PATTERN' | 'VIDEO';
  price: number | string;
  stock?: number | null;
  fileUrl?: string | null;
}

export interface CartItem {
  productId: number;
  quantity: number;
  product?: Product;
  optionIds: number[];
}

export interface Order {
  id: number;
  userId: number;
  status: string;
  totalPrice: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  createdAt: string;
  orderItems: OrderItem[];
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  productName: string;
  product?: Product;
}

export interface Access {
  id: number;
  userId: number;
  productId: number;
  orderId: number;
  grantedAt: string;
  product: Product;
  productOption: ProductOption;
}
