import { User, Client, Product, Order, AppSettings, UserRole, OrderStatus } from '../types';
import { supabase } from './supabaseClient';

// Helper to map DB snake_case to CamelCase if needed, 
// but we will adjust logic to match DB mostly or map manually.

export const storageService = {
  // --- USERS (app_users table) ---
  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase.from('app_users').select('*');
    if (error) { console.error(error); return []; }
    return data || [];
  },

  createUser: async (user: User): Promise<boolean> => {
    // Remove ID if it's random generated client side to let DB gen uuid, or keep it if UUID.
    // If ID is simple number string, let DB handle UUID.
    const { id, ...userData } = user;
    const { error } = await supabase.from('app_users').insert([userData]);
    if (error) { console.error(error); return false; }
    return true;
  },

  updateUser: async (user: User): Promise<boolean> => {
    const { id, ...userData } = user;
    const { error } = await supabase.from('app_users').update(userData).eq('id', id);
    if (error) { console.error(error); return false; }
    return true;
  },

  deleteUser: async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('app_users').delete().eq('id', id);
    if (error) { console.error(error); return false; }
    return true;
  },

  // --- CLIENTS ---
  getClients: async (): Promise<Client[]> => {
    const { data, error } = await supabase.from('clients').select('*');
    if (error) { console.error(error); return []; }
    
    // Map snake_case DB to camelCase Interface
    return (data || []).map((row: any) => ({
      id: row.id,
      personType: row.person_type,
      document: row.document,
      businessName: row.business_name,
      name: row.name,
      phone: row.phone,
      email: row.email,
      stateRegistration: row.state_registration,
      taxException: row.tax_exception,
      segment: row.segment,
      additionalInfo: row.additional_info,
      zipCode: row.zip_code,
      address: row.address,
      addressNumber: row.address_number,
      complement: row.complement,
      neighborhood: row.neighborhood,
      city: row.city,
      state: row.state,
      contacts: row.contacts || []
    }));
  },

  saveClient: async (client: Client): Promise<Client | null> => {
    const dbClient = {
      person_type: client.personType,
      document: client.document,
      business_name: client.businessName,
      name: client.name,
      phone: client.phone,
      email: client.email,
      state_registration: client.stateRegistration,
      tax_exception: client.taxException,
      segment: client.segment,
      additional_info: client.additionalInfo,
      zip_code: client.zipCode,
      address: client.address,
      address_number: client.addressNumber,
      complement: client.complement,
      neighborhood: client.neighborhood,
      city: client.city,
      state: client.state,
      contacts: client.contacts
    };

    if (client.id && client.id.length > 10) { // Assuming UUID length > 10
      const { data, error } = await supabase
        .from('clients')
        .update(dbClient)
        .eq('id', client.id)
        .select()
        .single();
      if (error) { console.error(error); return null; }
      return { ...client, ...data };
    } else {
      const { data, error } = await supabase
        .from('clients')
        .insert([dbClient])
        .select()
        .single();
      if (error) { console.error(error); return null; }
      // Return with new ID
      return { ...client, id: data.id };
    }
  },

  deleteClient: async (id: string) => {
    await supabase.from('clients').delete().eq('id', id);
  },

  // --- PRODUCTS ---
  getProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) { console.error(error); return []; }
    
    return (data || []).map((p: any) => ({
      ...p,
      priceRegional: p.price_regional,
      salesMultiple: p.sales_multiple
    }));
  },

  saveProduct: async (product: Product): Promise<boolean> => {
    const dbProduct = {
      code: product.code,
      name: product.name,
      price: product.price,
      price_regional: product.priceRegional,
      stock: product.stock,
      category: product.category,
      image: product.image,
      unit: product.unit,
      sales_multiple: product.salesMultiple
    };

    if (product.id && product.id.length > 10) {
      const { error } = await supabase.from('products').update(dbProduct).eq('id', product.id);
      return !error;
    } else {
      const { error } = await supabase.from('products').insert([dbProduct]);
      return !error;
    }
  },

  deleteProduct: async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
  },

  // --- CATEGORIES ---
  getCategories: async (): Promise<string[]> => {
    const { data, error } = await supabase.from('categories').select('name');
    if (error) return [];
    return data.map((c: any) => c.name);
  },

  saveCategory: async (name: string) => {
    await supabase.from('categories').insert([{ name }]);
  },

  // --- ORDERS ---
  getOrders: async (): Promise<Order[]> => {
    const { data, error } = await supabase.from('orders').select('*');
    if (error) { console.error(error); return []; }

    return (data || []).map((o: any) => ({
      id: o.id,
      clientId: o.client_id,
      clientName: o.client_name,
      sellerId: o.seller_id,
      date: o.date,
      total: o.total,
      status: o.status,
      freightType: o.freight_type,
      notes: o.notes,
      items: o.items || []
    }));
  },

  saveOrder: async (order: Order): Promise<boolean> => {
    const dbOrder = {
      id: order.id, // We use generated ID from frontend or backend. If text, we can insert.
      client_id: order.clientId,
      client_name: order.clientName,
      seller_id: order.sellerId,
      date: order.date,
      total: order.total,
      status: order.status,
      freight_type: order.freightType,
      notes: order.notes,
      items: order.items
    };

    // Upsert works for both insert and update if ID exists
    const { error } = await supabase.from('orders').upsert(dbOrder);
    if (error) {
      console.error(error);
      return false;
    }
    return true;
  },

  deleteOrder: async (id: string) => {
    await supabase.from('orders').delete().eq('id', id);
  },

  // --- SETTINGS ---
  getSettings: async (): Promise<AppSettings> => {
    const { data, error } = await supabase.from('settings').select('*').single();
    if (error || !data) {
      return { commercialPolicy: '', freightOptions: [], minOrderValue: 0 };
    }
    return {
      id: data.id,
      commercialPolicy: data.commercial_policy,
      freightOptions: data.freight_options,
      minOrderValue: data.min_order_value
    };
  },

  setSettings: async (settings: AppSettings) => {
    const dbSettings = {
      commercial_policy: settings.commercialPolicy,
      freight_options: settings.freightOptions,
      min_order_value: settings.minOrderValue
    };
    
    if (settings.id) {
       await supabase.from('settings').update(dbSettings).eq('id', settings.id);
    } else {
       // Only one row allowed usually, or logic to check empty
       await supabase.from('settings').insert([dbSettings]);
    }
  }
};