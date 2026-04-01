export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  phone?: string;
  ambiente_number?: string;
  schedule?: 'diurna' | 'mixta' | 'nocturna';
  profile_picture?: string;
  role: 'user' | 'admin';
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category_id?: string;
  category_name?: string;
  images: string[];
  is_featured: boolean;
  is_active: boolean;
  rating_avg: number;
  rating_count: number;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
}

export interface CartItem {
  id: string;
  product_id: string;
  user_id?: string;
  name: string;
  price: number;
  images: string[];
  stock: number;
  quantity: number;
}

export interface Order {
  id: string;
  user_id?: string;
  username?: string;
  email?: string;
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  payment_method?: string;
  notes?: string;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  username: string;
  profile_picture?: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  admin_name?: string;
  is_read: boolean;
  created_at: string;
}

export interface ChatMessage {
  id?: string;
  sender_id: string;
  receiver_id?: string;
  sender_name?: string;
  sender_pic?: string;
  message: string;
  is_read?: boolean;
  timestamp?: Date;
  created_at?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
