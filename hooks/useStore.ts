import { useState, useEffect } from 'react';
import { Product, Client, Sale, SaleType, Payment, SaleItem } from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'gestorpro_products',
  CLIENTS: 'gestorpro_clients',
  SALES: 'gestorpro_sales',
  PAYMENTS: 'gestorpro_payments',
};

export const useStore = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const loadData = () => {
      try {
        const p = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
        const c = localStorage.getItem(STORAGE_KEYS.CLIENTS);
        const s = localStorage.getItem(STORAGE_KEYS.SALES);
        const pay = localStorage.getItem(STORAGE_KEYS.PAYMENTS);

        if (p) setProducts(JSON.parse(p));
        if (c) setClients(JSON.parse(c));
        
        if (s) {
          // Migration for old single-product sales to new multi-item structure
          const parsedSales = JSON.parse(s);
          const migratedSales = parsedSales.map((sale: any) => {
            if (!sale.items && sale.productId) {
              return {
                ...sale,
                items: [{
                  productId: sale.productId,
                  productName: sale.productName,
                  quantity: sale.quantity,
                  unitPrice: sale.totalPrice / sale.quantity, // approximate
                  subtotal: sale.totalPrice
                }]
              };
            }
            return sale;
          });
          setSales(migratedSales);
        }
        
        if (pay) setPayments(JSON.parse(pay));
      } catch (error) {
        console.error("Error loading data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Persistence helpers
  const saveProducts = (data: Product[]) => {
    setProducts(data);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data));
  };

  const saveClients = (data: Client[]) => {
    setClients(data);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(data));
  };

  const saveSales = (data: Sale[]) => {
    setSales(data);
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(data));
  };

  const savePayments = (data: Payment[]) => {
    setPayments(data);
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(data));
  };

  // --- Products Logic ---
  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct: Product = { ...product, id: crypto.randomUUID() };
    saveProducts([...products, newProduct]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const updated = products.map(p => p.id === id ? { ...p, ...updates } : p);
    saveProducts(updated);
  };

  const deleteProduct = (id: string) => {
    saveProducts(products.filter(p => p.id !== id));
  };

  // --- Clients Logic ---
  const addClient = (name: string, initialDebt: number = 0) => {
    const newClient: Client = { 
      id: crypto.randomUUID(), 
      name, 
      initialDebt,
      debt: initialDebt // Starts with initial debt
    };
    saveClients([...clients, newClient]);
  };

  const updateClient = (id: string, name: string, initialDebt: number = 0) => {
    const oldClient = clients.find(c => c.id === id);
    if (!oldClient) return;

    // Calculate difference in initial debt to adjust current debt
    const oldInitial = oldClient.initialDebt || 0;
    const debtDifference = initialDebt - oldInitial;

    const updated = clients.map(c => c.id === id ? { 
      ...c, 
      name, 
      initialDebt,
      debt: c.debt + debtDifference // Adjust current debt by the delta
    } : c);
    saveClients(updated);
  };

  const deleteClient = (id: string) => {
    saveClients(clients.filter(c => c.id !== id));
  };

  // --- Sales Logic (Multi-Product) ---
  const addSale = (
    items: { productId: string; quantity: number }[], 
    type: SaleType, 
    clientId?: string
  ) => {
    if (items.length === 0) throw new Error("El carrito está vacío");

    // 1. Validate all stocks and calculate totals
    const processedItems: SaleItem[] = [];
    let totalSalePrice = 0;
    
    // We need a map of current products to check stock easily
    const productMap = new Map<string, Product>();
    products.forEach(p => productMap.set(p.id, p));
    
    // Check for duplicates in cart which might exceed stock if counted separately
    const combinedQuantities = new Map<string, number>();
    
    for (const item of items) {
      const currentQty = combinedQuantities.get(item.productId) || 0;
      combinedQuantities.set(item.productId, currentQty + item.quantity);
    }

    // Validation Pass
    for (const [pid, qty] of combinedQuantities.entries()) {
      const product = productMap.get(pid);
      if (!product) throw new Error(`Producto (ID: ${pid}) no encontrado`);
      if (product.stock < qty) throw new Error(`Stock insuficiente para: ${product.name}`);
    }

    // Construction Pass
    for (const item of items) {
      const product = productMap.get(item.productId)!;
      const subtotal = product.price * item.quantity;
      totalSalePrice += subtotal;
      
      processedItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal: subtotal
      });
    }

    let clientName = '';

    // 2. Update Product Stock
    const updatedProducts = products.map(p => {
      const qtySold = combinedQuantities.get(p.id);
      return qtySold ? { ...p, stock: p.stock - qtySold } : p;
    });

    // 3. Handle Credit Logic
    let updatedClients = [...clients];
    if (type === SaleType.CREDIT) {
      if (!clientId) throw new Error("Cliente requerido para venta a crédito");
      
      const client = clients.find(c => c.id === clientId);
      if (!client) throw new Error("Cliente no encontrado");
      
      clientName = client.name;
      
      // Increase Debt
      updatedClients = clients.map(c => 
        c.id === clientId ? { ...c, debt: c.debt + totalSalePrice } : c
      );
    } else if (clientId) {
        const client = clients.find(c => c.id === clientId);
        if(client) clientName = client.name;
    }

    // 4. Create Sale Record
    const newSale: Sale = {
      id: crypto.randomUUID(),
      items: processedItems,
      clientId,
      clientName: clientName || 'Cliente General',
      totalPrice: totalSalePrice,
      type,
      date: new Date().toISOString(),
    };

    // 5. Commit Transaction
    saveProducts(updatedProducts);
    saveClients(updatedClients);
    saveSales([newSale, ...sales]);
  };

  // --- Payments Logic ---
  const addPayment = (clientId: string, amount: number) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) throw new Error("Cliente no encontrado");
    if (amount <= 0) throw new Error("El monto debe ser mayor a 0");
    if (amount > client.debt) throw new Error("El monto excede la deuda actual del cliente");

    const updatedClients = clients.map(c => 
      c.id === clientId ? { ...c, debt: c.debt - amount } : c
    );

    const newPayment: Payment = {
      id: crypto.randomUUID(),
      clientId,
      clientName: client.name,
      amount,
      date: new Date().toISOString(),
    };

    saveClients(updatedClients);
    savePayments([newPayment, ...payments]);
  };

  return {
    products,
    clients,
    sales,
    payments,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    addClient,
    updateClient,
    deleteClient,
    addSale,
    addPayment,
  };
};