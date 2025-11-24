
import React, { useState, useMemo } from 'react';
import { Product, Client, Sale, SaleType, SaleItem } from '../types';
import { ShoppingCart, AlertCircle, CheckCircle2, Plus, Trash2, Package, Eye, X, DollarSign } from 'lucide-react';

interface SalesProps {
  products: Product[];
  clients: Client[];
  sales: Sale[];
  onSale: (items: { productId: string; quantity: number }[], type: SaleType, clientId?: string, initialPayment?: number) => void;
}

export const Sales: React.FC<SalesProps> = ({ products, clients, sales, onSale }) => {
  // Cart State
  const [cart, setCart] = useState<{ tempId: string; productId: string; quantity: number }[]>([
    { tempId: 'init', productId: '', quantity: 1 }
  ]);
  
  const [saleType, setSaleType] = useState<SaleType>(SaleType.NORMAL);
  const [selectedClient, setSelectedClient] = useState('');
  const [initialPayment, setInitialPayment] = useState(''); // Input for credit down payment
  const [notification, setNotification] = useState<{type: 'success'|'error', msg: string} | null>(null);
  const [filterClient, setFilterClient] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null); // For detail modal

  // Helper to calculate totals
  const getCartTotal = () => {
    return cart.reduce((acc, item) => {
      const p = products.find(p => p.id === item.productId);
      return acc + (p ? p.price * item.quantity : 0);
    }, 0);
  };

  // Cart Actions
  const addToCart = () => {
    setCart([...cart, { tempId: crypto.randomUUID(), productId: '', quantity: 1 }]);
  };

  const removeFromCart = (tempId: string) => {
    if (cart.length === 1) {
      // Reset last item instead of removing
      setCart([{ tempId: 'init', productId: '', quantity: 1 }]);
    } else {
      setCart(cart.filter(item => item.tempId !== tempId));
    }
  };

  const updateCartItem = (tempId: string, field: 'productId' | 'quantity', value: any) => {
    setCart(cart.map(item => item.tempId === tempId ? { ...item, [field]: value } : item));
  };

  const handleSale = (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    // Filter out empty rows
    const validItems = cart.filter(c => c.productId);
    const total = getCartTotal();
    const downPayment = parseFloat(initialPayment) || 0;

    try {
      if (validItems.length === 0) throw new Error("Debe agregar al menos un producto");
      if (saleType === SaleType.CREDIT && downPayment > total) {
          throw new Error("El abono inicial no puede ser mayor al total");
      }

      onSale(
        validItems.map(({ productId, quantity }) => ({ productId, quantity })),
        saleType,
        saleType === SaleType.CREDIT ? selectedClient : (selectedClient || undefined),
        saleType === SaleType.CREDIT ? downPayment : 0
      );
      
      // Reset Form
      setCart([{ tempId: 'init', productId: '', quantity: 1 }]);
      setSaleType(SaleType.NORMAL);
      setSelectedClient('');
      setInitialPayment('');
      setNotification({ type: 'success', msg: 'Venta registrada correctamente' });
      
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification({ type: 'error', msg: err.message });
    }
  };

  const filteredSales = useMemo(() => {
    if (!filterClient) return sales;
    return sales.filter(s => s.clientName?.toLowerCase().includes(filterClient.toLowerCase()));
  }, [sales, filterClient]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Inject Custom Animation Styles */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* LEFT COLUMN: POS Form */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 sticky top-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Nueva Venta
          </h2>

          {notification && (
            <div className={`p-3 mb-4 rounded-lg text-sm flex items-center gap-2 animate-slide-in ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4"/> : <AlertCircle className="w-4 h-4"/>}
              {notification.msg}
            </div>
          )}

          <form onSubmit={handleSale} className="space-y-6">
            {/* Cart Items */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Productos</label>
              
              {cart.map((item, index) => {
                 const product = products.find(p => p.id === item.productId);
                 const maxStock = product ? product.stock : 0;
                 const subtotal = product ? product.price * item.quantity : 0;

                 return (
                  <div key={item.tempId} className="p-3 bg-slate-50 rounded-lg border border-slate-200 relative group animate-slide-in transition-colors hover:border-indigo-200">
                    <div className="grid grid-cols-1 gap-2">
                       <select 
                          required
                          className="w-full px-2 py-1.5 text-sm rounded-md border border-slate-300 focus:ring-1 focus:ring-primary outline-none bg-white"
                          value={item.productId}
                          onChange={e => updateCartItem(item.tempId, 'productId', e.target.value)}
                        >
                          <option value="">Seleccionar...</option>
                          {products.filter(p => p.stock > 0 || p.id === item.productId).map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} - ${p.price} (Stock: {p.stock})
                            </option>
                          ))}
                        </select>
                        
                        <div className="flex items-center gap-2">
                           <div className="flex-1">
                             <input 
                                type="number"
                                min="1"
                                max={maxStock || 1}
                                className="w-full px-2 py-1.5 text-sm rounded-md border border-slate-300 focus:ring-1 focus:ring-primary outline-none"
                                value={item.quantity}
                                onChange={e => updateCartItem(item.tempId, 'quantity', parseInt(e.target.value) || 1)}
                                disabled={!item.productId}
                             />
                           </div>
                           <div className="flex-1 text-right">
                              <span className="text-sm font-bold text-slate-700 transition-all duration-300">${subtotal.toFixed(2)}</span>
                           </div>
                           <button 
                              type="button" 
                              onClick={() => removeFromCart(item.tempId)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all active:scale-90"
                              title="Quitar fila"
                           >
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                    </div>
                  </div>
                 );
              })}
              
              <button 
                type="button"
                onClick={addToCart}
                className="text-sm text-primary font-medium hover:text-indigo-700 flex items-center gap-1 py-1 px-2 rounded hover:bg-indigo-50 transition-colors active:scale-95"
              >
                <Plus className="w-4 h-4" /> Agregar otro producto
              </button>
            </div>

            {/* Sale Type & Client */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-3">
                  <label className={`cursor-pointer border rounded-lg p-3 text-center text-sm font-medium transition active:scale-95 ${saleType === SaleType.NORMAL ? 'bg-indigo-50 border-primary text-primary' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    <input 
                      type="radio" 
                      name="saleType" 
                      className="hidden" 
                      checked={saleType === SaleType.NORMAL}
                      onChange={() => setSaleType(SaleType.NORMAL)}
                    />
                    Contado
                  </label>
                  <label className={`cursor-pointer border rounded-lg p-3 text-center text-sm font-medium transition active:scale-95 ${saleType === SaleType.CREDIT ? 'bg-indigo-50 border-primary text-primary' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    <input 
                      type="radio" 
                      name="saleType" 
                      className="hidden" 
                      checked={saleType === SaleType.CREDIT}
                      onChange={() => setSaleType(SaleType.CREDIT)}
                    />
                    Crédito
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Cliente {saleType === SaleType.CREDIT && <span className="text-red-500">*</span>}
                  </label>
                  <select 
                    required={saleType === SaleType.CREDIT}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-primary outline-none"
                    value={selectedClient}
                    onChange={e => setSelectedClient(e.target.value)}
                  >
                    <option value="">Seleccionar Cliente</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {saleType === SaleType.CREDIT && (
                  <div className="animate-slide-in">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Abono Inicial <span className="text-xs text-slate-500 font-normal">(Opcional)</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input 
                        type="number"
                        min="0"
                        step="0.01"
                        max={getCartTotal()}
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary outline-none"
                        value={initialPayment}
                        onChange={e => setInitialPayment(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs">
                      <span className="text-slate-500">Se pagará ahora:</span>
                      <span className="font-bold text-emerald-600">${(parseFloat(initialPayment) || 0).toLocaleString('es-MX')}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Se cargará a deuda:</span>
                      <span className="font-bold text-rose-600">
                        ${Math.max(0, getCartTotal() - (parseFloat(initialPayment) || 0)).toLocaleString('es-MX')}
                      </span>
                    </div>
                  </div>
                )}
            </div>

            {/* Total Display */}
            <div className="bg-slate-800 p-4 rounded-lg flex justify-between items-center text-white shadow-lg transition-all hover:shadow-xl hover:bg-slate-700">
              <span className="font-medium opacity-90">Total a Pagar:</span>
              <span className="text-2xl font-bold transition-all duration-300 ease-out scale-100 key={getCartTotal()}">
                ${getCartTotal().toLocaleString('es-MX')}
              </span>
            </div>

            <button 
              type="submit" 
              disabled={cart.filter(c => c.productId).length === 0 || (saleType === SaleType.CREDIT && !selectedClient)}
              className="w-full bg-primary hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow-md transition active:scale-[0.98]"
            >
              Confirmar Venta
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: History */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-800">Historial de Ventas</h2>
          <input 
            type="text"
            placeholder="Filtrar por cliente..."
            className="px-4 py-2 rounded-lg border border-slate-300 text-sm w-full sm:w-64 focus:ring-2 focus:ring-primary outline-none transition-shadow focus:shadow-md"
            value={filterClient}
            onChange={e => setFilterClient(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Resumen</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition duration-150">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(sale.date).toLocaleDateString('es-MX')} 
                      <span className="text-xs text-slate-400 block">
                        {new Date(sale.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {sale.items && sale.items.length > 0 ? (
                        <div className="space-y-1">
                            <div className="font-medium text-slate-900 flex items-center gap-1">
                                {sale.items[0].productName} 
                                {sale.items.length > 1 && (
                                    <span className="text-xs bg-slate-200 text-slate-600 px-1.5 rounded-full">
                                        +{sale.items.length - 1} más
                                    </span>
                                )}
                            </div>
                        </div>
                      ) : (
                          <span className="text-red-400 text-xs">Datos corruptos</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{sale.clientName || '-'}</td>
                    <td className="px-4 py-3">
                       <div className="flex flex-col items-start gap-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${sale.type === SaleType.CREDIT ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                            {sale.type === SaleType.CREDIT ? 'Crédito' : 'Contado'}
                          </span>
                          {sale.type === SaleType.CREDIT && sale.cashPaid !== undefined && sale.cashPaid > 0 && (
                             <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md border border-slate-200">
                                Abonó: ${sale.cashPaid.toLocaleString('es-MX')}
                             </span>
                          )}
                       </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">${sale.totalPrice.toLocaleString('es-MX')}</td>
                    <td className="px-4 py-3 text-center">
                        <button 
                          onClick={() => setSelectedSale(sale)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition active:scale-90"
                          title="Ver detalles"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                    </td>
                  </tr>
                ))}
                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">No hay ventas registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sale Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Detalle de Venta</h3>
                        <p className="text-sm text-slate-500">
                            {new Date(selectedSale.date).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            {' • '}
                            {new Date(selectedSale.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        </p>
                    </div>
                    <button onClick={() => setSelectedSale(null)} className="text-slate-400 hover:text-slate-600 transition active:scale-90">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Cliente</p>
                            <p className="font-medium text-slate-900 text-lg">{selectedSale.clientName}</p>
                        </div>
                         <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold text-right">Tipo</p>
                            <div className={`text-right font-medium ${selectedSale.type === SaleType.CREDIT ? 'text-orange-600' : 'text-green-600'}`}>
                                {selectedSale.type === SaleType.CREDIT ? 'Crédito' : 'Contado'}
                            </div>
                        </div>
                    </div>

                    <h4 className="font-semibold text-slate-700 mb-3">Productos Comprados</h4>
                    <div className="border rounded-lg overflow-hidden border-slate-200 mb-6">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">Producto</th>
                                    <th className="px-4 py-3 text-right">Precio Unit.</th>
                                    <th className="px-4 py-3 text-center">Cant.</th>
                                    <th className="px-4 py-3 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {selectedSale.items && selectedSale.items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="px-4 py-3 font-medium text-slate-900">{item.productName}</td>
                                        <td className="px-4 py-3 text-right text-slate-500">${item.unitPrice.toLocaleString('es-MX')}</td>
                                        <td className="px-4 py-3 text-center">{item.quantity}</td>
                                        <td className="px-4 py-3 text-right font-medium">${item.subtotal.toLocaleString('es-MX')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                        <div className="flex justify-between items-center">
                           <span className="text-slate-600">Total de la Venta</span>
                           <span className="font-bold text-slate-900 text-lg">${selectedSale.totalPrice.toLocaleString('es-MX')}</span>
                        </div>
                        {selectedSale.type === SaleType.CREDIT && (
                          <>
                             <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-2">
                                <span className="text-emerald-600 font-medium flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3"/> Pagado al momento
                                </span>
                                <span className="font-bold text-emerald-600">
                                  ${(selectedSale.cashPaid || 0).toLocaleString('es-MX')}
                                </span>
                             </div>
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-rose-600 font-medium flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3"/> Restante (A Deuda)
                                </span>
                                <span className="font-bold text-rose-600">
                                  ${(selectedSale.totalPrice - (selectedSale.cashPaid || 0)).toLocaleString('es-MX')}
                                </span>
                             </div>
                          </>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
                    <button 
                        onClick={() => setSelectedSale(null)}
                        className="px-6 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 shadow-sm transition active:scale-95"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
