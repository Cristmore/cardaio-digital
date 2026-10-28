import { createClient } from '@supabase/supabase-js';

// Supabase credentials (from environment or defaults)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('seu-projeto')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Initial pre-seeded products as requested by user
const INITIAL_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Marmita grande',
    category: 'Prato principal',
    description: 'Escolha 2 tipos de carne e mais 4 opções gerais',
    price: 20.00,
    image: '/images/marmita.jpg',
    badge: 'MAIS PEDIDO',
    active: true,
    carnes_limit: 2,
    gerais_limit: 4,
    carnes_options: [
      'Carne cozida',
      'Frango ao molho',
      'Frango assado',
      'Peixe frito',
      'Churrasco',
      'Ovo frito'
    ],
    gerais_options: [
      'Arroz',
      'Feijão',
      'Salada',
      'Farofa',
      'Verdura'
    ]
  },
  {
    id: 'prod-2',
    name: 'Marmita média',
    category: 'Prato principal',
    description: 'Escolha 2 tipos de carne e mais 4 opções gerais',
    price: 17.00,
    image: '/images/marmita.jpg',
    badge: 'NOVO',
    active: true,
    carnes_limit: 2,
    gerais_limit: 4,
    carnes_options: [
      'Carne cozida',
      'Frango ao molho',
      'Frango assado',
      'Peixe frito',
      'Churrasco',
      'Ovo frito'
    ],
    gerais_options: [
      'Arroz',
      'Feijão',
      'Salada',
      'Farofa',
      'Verdura'
    ]
  },
  {
    id: 'prod-3',
    name: 'Coca-Cola Lata 350ml',
    category: 'Bebidas',
    description: 'Lata de 350ml trincando de gelada com gotas de condensação.',
    price: 6.00,
    image: '/images/coca_cola.jpg',
    badge: 'NOVO',
    active: true,
    carnes_limit: 0,
    gerais_limit: 0,
    carnes_options: [],
    gerais_options: []
  }
];

const INITIAL_CATEGORIES = [
  { id: 'cat-1', name: 'Prato principal', icon: 'Utensils' },
  { id: 'cat-2', name: 'Bebidas', icon: 'Coffee' },
  { id: 'cat-3', name: 'Sobremesas', icon: 'Cake' }
];

const INITIAL_SETTINGS = {
  id: 'settings-1',
  name: 'Restaurante Teste',
  business_type: 'Restaurante',
  whatsapp: '11999999999',
  pix_key: '11999999999',
  delivery_fee: 5.00,
  delivery_time: '35 - 50 min',
  primary_color: '#FF5E00',
  secondary_color: '#FFAA00',
  is_open: true,
  address: 'Rua Principal, 500 - Centro'
};

const INITIAL_CUSTOMERS = [
  {
    id: 'cust-1',
    phone: '11987654321',
    name: 'Carlos Oliveira',
    street: 'Rua das Flores',
    number: '123',
    neighborhood: 'Centro',
    city: 'São Paulo',
    complement: 'Apto 42',
    reference: 'Próximo à padaria central'
  }
];

// Helper to get from LocalStorage with fallback
const getLocal = (key, fallback) => {
  try {
    const data = localStorage.getItem(`cardapio_${key}`);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
};

const setLocal = (key, value) => {
  try {
    localStorage.setItem(`cardapio_${key}`, JSON.stringify(value));
  } catch (err) {
    console.error('Erro ao salvar localmente:', err);
  }
};

// ================= DATABASE SERVICE =================
export const dbService = {
  // SETTINGS
  async getSettings() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('restaurant_settings')
          .select('*')
          .limit(1)
          .single();
        if (!error && data) {
          setLocal('settings', data);
          return data;
        }
      } catch (e) {
        console.warn('Falha no Supabase, usando dados locais:', e);
      }
    }
    return getLocal('settings', INITIAL_SETTINGS);
  },

  async updateSettings(settings) {
    setLocal('settings', settings);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('restaurant_settings')
          .upsert({ ...settings, updated_at: new Date().toISOString() });
      } catch (e) {
        console.error('Erro ao sincronizar com Supabase:', e);
      }
    }
    return settings;
  },

  // CATEGORIES
  async getCategories() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true });
        if (!error && data && data.length > 0) {
          setLocal('categories', data);
          return data;
        }
      } catch (e) {
        console.warn('Falha ao buscar categorias no Supabase:', e);
      }
    }
    return getLocal('categories', INITIAL_CATEGORIES);
  },

  async addCategory(name, icon = 'Utensils') {
    const categories = await this.getCategories();
    const newCat = {
      id: `cat-${Date.now()}`,
      name,
      icon,
      sort_order: categories.length + 1,
      active: true
    };
    const updated = [...categories, newCat];
    setLocal('categories', updated);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('categories').insert([newCat]);
      } catch (e) {
        console.error('Erro ao adicionar categoria no Supabase:', e);
      }
    }
    return newCat;
  },

  async deleteCategory(id) {
    const categories = await this.getCategories();
    const updated = categories.filter(c => c.id !== id);
    setLocal('categories', updated);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('categories').delete().eq('id', id);
      } catch (e) {
        console.error('Erro ao deletar categoria no Supabase:', e);
      }
    }
    return updated;
  },

  // PRODUCTS
  async getProducts() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          setLocal('products', data);
          return data;
        }
      } catch (e) {
        console.warn('Falha ao buscar produtos no Supabase:', e);
      }
    }
    return getLocal('products', INITIAL_PRODUCTS);
  },

  async saveProduct(product) {
    const products = await this.getProducts();
    let updated;
    const prodToSave = {
      ...product,
      id: product.id || `prod-${Date.now()}`,
      created_at: product.created_at || new Date().toISOString()
    };

    const index = products.findIndex(p => p.id === prodToSave.id);
    if (index >= 0) {
      updated = [...products];
      updated[index] = prodToSave;
    } else {
      updated = [prodToSave, ...products];
    }

    setLocal('products', updated);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('products').upsert(prodToSave);
      } catch (e) {
        console.error('Erro ao salvar produto no Supabase:', e);
      }
    }
    return prodToSave;
  },

  async deleteProduct(id) {
    const products = await this.getProducts();
    const updated = products.filter(p => p.id !== id);
    setLocal('products', updated);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('products').delete().eq('id', id);
      } catch (e) {
        console.error('Erro ao deletar produto no Supabase:', e);
      }
    }
    return updated;
  },

  // CUSTOMERS
  async getCustomerByPhone(rawPhone) {
    const cleanPhone = rawPhone.replace(/\D/g, '');
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('phone', cleanPhone)
          .single();
        if (!error && data) {
          return data;
        }
      } catch (e) {
        console.warn('Falha ao buscar cliente no Supabase:', e);
      }
    }

    const customers = getLocal('customers', INITIAL_CUSTOMERS);
    return customers.find(c => c.phone.replace(/\D/g, '') === cleanPhone) || null;
  },

  async saveCustomer(customerData) {
    const cleanPhone = customerData.phone.replace(/\D/g, '');
    const customers = getLocal('customers', INITIAL_CUSTOMERS);
    const existingIndex = customers.findIndex(c => c.phone.replace(/\D/g, '') === cleanPhone);

    const customerObj = {
      ...customerData,
      phone: cleanPhone,
      id: customerData.id || `cust-${Date.now()}`,
      updated_at: new Date().toISOString()
    };

    let updated;
    if (existingIndex >= 0) {
      updated = [...customers];
      updated[existingIndex] = { ...updated[existingIndex], ...customerObj };
    } else {
      customerObj.created_at = new Date().toISOString();
      updated = [...customers, customerObj];
    }

    setLocal('customers', updated);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('customers').upsert(customerObj, { onConflict: 'phone' });
      } catch (e) {
        console.error('Erro ao salvar cliente no Supabase:', e);
      }
    }
    return customerObj;
  },

  // ORDERS
  async getOrders() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          setLocal('orders', data);
          return data;
        }
      } catch (e) {
        console.warn('Falha ao buscar pedidos no Supabase:', e);
      }
    }
    return getLocal('orders', []);
  },

  async createOrder(orderData) {
    const orders = await this.getOrders();
    const orderNumber = orders.length > 0 
      ? Math.max(...orders.map(o => o.order_number || 0)) + 1 
      : 101;

    const newOrder = {
      id: `ord-${Date.now()}`,
      order_number: orderNumber,
      status: 'Recebido',
      created_at: new Date().toISOString(),
      ...orderData
    };

    const updated = [newOrder, ...orders];
    setLocal('orders', updated);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('orders').insert([newOrder]);
      } catch (e) {
        console.error('Erro ao salvar pedido no Supabase:', e);
      }
    }

    // Trigger custom event so any active admin tab gets instant notification
    window.dispatchEvent(new CustomEvent('cardapio_new_order', { detail: newOrder }));

    return newOrder;
  },

  async updateOrderStatus(orderId, newStatus) {
    const orders = await this.getOrders();
    const updated = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    setLocal('orders', updated);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('orders')
          .update({ status: newStatus })
          .eq('id', orderId);
      } catch (e) {
        console.error('Erro ao atualizar status do pedido no Supabase:', e);
      }
    }
    return updated;
  }
};
