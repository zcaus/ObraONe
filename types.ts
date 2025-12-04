export enum UserRole {
  ADMIN = 'ADMIN',
  SALES = 'SALES'
}

export interface User {
  id: string;
  name: string;
  username: string; // Changed from email to username for login
  role: UserRole;
  password?: string; // Stored in app_users table
}

export interface ClientContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
}

export interface Client {
  id: string;
  personType: 'PJ' | 'PF';
  // Informações Principais
  document: string; // CNPJ or CPF
  businessName: string; // Razão Social or Nome Completo
  name: string; // Nome Fantasia or Apelido
  phone: string;
  email: string;
  stateRegistration?: string; // Inscrição Estadual or RG
  taxException: boolean; // Exceção Fiscal
  segment?: string;
  additionalInfo?: string;

  // Endereço
  zipCode?: string;
  address?: string; // Logradouro
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state?: string;

  // Contatos
  contacts: ClientContact[];
}

export interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  priceRegional?: number; // PR/SC/RS/EJ/MG
  stock: number;
  category: string;
  image?: string; // Base64 string
  unit?: string; // UN, KG, CX, etc
  salesMultiple?: number; // Venda em multiplos de X
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export enum OrderStatus {
  DRAFT = 'Orçamento',
  CONFIRMED = 'Pedido',
  SHIPPED = 'Enviado',
  CANCELLED = 'Cancelado'
}

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  sellerId: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  freightType?: string;
  notes?: string;
}

export interface AppSettings {
  id?: string; // DB ID
  commercialPolicy: string;
  freightOptions: string[];
  minOrderValue: number;
}

export interface DashboardMetrics {
  totalSales: number;
  orderCount: number;
  activeClients: number;
  averageTicket: number;
  totalClients: number;
}