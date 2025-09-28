
export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  category_id: number;
  image_url?: string;
}

export interface Order {
  id?: number;
  whatsapp: string;
  address: string;
  payment_method: string;
  status: string;
  total_price: number;
}

export interface OrderItem {
  id?: number;
  order_id: number;
  product_id: number;
  quantity: number;
}

export interface CartItem extends Product {
  quantity: number;
}
