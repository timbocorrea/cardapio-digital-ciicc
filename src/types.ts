export interface StoreSetting {
  storeName: string;
  pixKey: string;
  whatsappNumber: string;
  whatsappMessage: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  category: string;
  emoji: string;
  imageUrl?: string;
  createdAt?: string;
}

export interface CustomerRegistration {
  uid: string;
  name: string;
  email: string;
  workplace: string;
  shiftHours: string;
  photoUrl: string;
  createdAt: string;
}
