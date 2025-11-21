import React, { useState, useMemo } from 'react';
import { Product, Client, Sale, SaleType } from '../types';
import { DollarSign, Users, Package, CreditCard, Calendar, Filter, RefreshCw } from 'lucide-react';

interface DashboardProps {
  products: Product[];
  clients: Client[];
  sales: Sale[];
}

type ViewMode = 'MONTH' | 'CUSTOM';

export const Dashboard: React.FC<DashboardProps> = ({ products, clients, sales }) => {
  // --- State Management ---
  // Default to current month (YYYY-MM)
  const currentIsoMonth = new Date().toISOString().slice(0, 7);
  const [viewMode, setViewMode] = useState<ViewMode>('MONTH');
  const [selectedMonth, setSelectedMonth] = useState(currentIsoMonth);
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  // --- Logic ---

  // 1. Get available months from sales history + current month
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add(currentIsoMonth); // Ensure current month is always an option
    sales.forEach(s => months.add(s.date.slice(0, 7)));
    return Array.from(months).sort().reverse();
  }, [sales, currentIsoMonth]);

  // 2. Filter Sales based on mode
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = sale.date.slice(0, 10); // YYYY-MM-DD
      
      if (viewMode === 'MONTH') {
        return sale.date.startsWith(selectedMonth);
      } else {
        // Custom Range
        const { start, end } = customRange;
        if (!start && !end) return true; // No filter if empty
        if (start && saleDate < start) return false;
        if (end && saleDate > end) return false;
        return true;
      }
    });
  }, [sales, viewMode, selectedMonth, customRange]);

  // 3. Calculate Totals for the filtered period
  const totalPeriodIncome = filteredSales.reduce((acc, curr) => acc + curr.totalPrice, 0);
  
  // Global Totals (These usually reflect current state of DB, not history filtered)
  const totalDebt = clients.reduce((acc, curr) => acc + curr.debt, 0);
  const totalProducts = products.length;
  const totalClients = clients.length;

  // --- Helpers ---
  const formatMonth = (isoMonth: string) => {
    const [y, m] = isoMonth.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1);
    return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  };

  const StatCard = ({ title, value, icon: Icon, colorClass, subtext }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4 transition hover:shadow-md">
      <div className={`p-3 rounded-full ${colorClass}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6 items-end md:items-center justify-between">
        
        <div className="flex flex-col gap-1 w-full md:w-auto">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vista Mensual</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <select 
              value={selectedMonth}
              onChange={(e) => {
                setViewMode('MONTH');
                setSelectedMonth(e.target.value);
              }}
              className={`pl-10 pr-8 py-2 rounded-lg border outline-none appearance-none w-full md:w-64 transition cursor-pointer ${viewMode === 'MONTH' ? 'border-primary ring-1 ring-primary bg-indigo-50 text-primary font-medium' : 'border-slate-300 text-slate-600'}`}
            >
              {availableMonths.map(m => (
                <option key={m} value={m}>{formatMonth(m).charAt(0).toUpperCase() + formatMonth(m).slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="hidden md:block h-10 w-px bg-slate-200"></div>

        <div className="flex flex-col gap-1 w-full md:w-auto">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
               <Filter className="w-3 h-3" /> Rango Personalizado
            </label>
            <div className="flex gap-2 items-center">
                <input 
                    type="date" 
                    className={`px-3 py-2 rounded-lg border text-sm outline-none ${viewMode === 'CUSTOM' ? 'border-indigo-300 bg-indigo-50 text-slate-900' : 'border-slate-300 text-slate-500'}`}
                    value={customRange.start}
                    onChange={(e) => {
                        setViewMode('CUSTOM');
                        setCustomRange(prev => ({ ...prev, start: e.target.value }));
                    }}
                />
                <span className="text-slate-400">-</span>
                <input 
                    type="date" 
                    className={`px-3 py-2 rounded-lg border text-sm outline-none ${viewMode === 'CUSTOM' ? 'border-indigo-300 bg-indigo-50 text-slate-900' : 'border-slate-300 text-slate-500'}`}
                    value={customRange.end}
                    onChange={(e) => {
                        setViewMode('CUSTOM');
                        setCustomRange(prev => ({ ...prev, end: e.target.value }));
                    }}
                />
                {viewMode === 'CUSTOM' && (
                    <button 
                        onClick={() => {
                            setViewMode('MONTH');
                            setCustomRange({ start: '', end: '' });
                        }}
                        title="Restablecer a mes actual"
                        className="p-2 text-slate-400 hover:text-primary transition"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={viewMode === 'MONTH' ? `Ventas (${formatMonth(selectedMonth)})` : 'Ventas (Rango)'}
          value={`$${totalPeriodIncome.toLocaleString('es-MX')}`} 
          icon={DollarSign} 
          colorClass="bg-emerald-500" 
          subtext={`${filteredSales.length} operaciones en este periodo`}
        />
        <StatCard 
          title="Deuda Total (Cartera)" 
          value={`$${totalDebt.toLocaleString('es-MX')}`} 
          icon={CreditCard} 
          colorClass="bg-rose-500" 
          subtext="Saldo pendiente global"
        />
        <StatCard 
          title="Productos Activos" 
          value={totalProducts} 
          icon={Package} 
          colorClass="bg-blue-500" 
        />
        <StatCard 
          title="Clientes Registrados" 
          value={totalClients} 
          icon={Users} 
          colorClass="bg-purple-500" 
        />
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">
                {viewMode === 'MONTH' ? `Movimientos de ${formatMonth(selectedMonth)}` : 'Movimientos Filtrados'}
            </h3>
            <span className="text-xs font-medium px-3 py-1 bg-slate-100 text-slate-500 rounded-full">
                {filteredSales.length} registros
            </span>
        </div>

        {filteredSales.length === 0 ? (
          <div className="text-center py-12">
             <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                <Package className="w-8 h-8 text-slate-400" />
             </div>
             <p className="text-slate-500 font-medium">No hay ventas registradas en este periodo.</p>
             <p className="text-sm text-slate-400">Intenta cambiar el mes o el rango de fechas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Resumen</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.slice(0, 10).map((sale) => ( // Show top 10 of period
                  <tr key={sale.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(sale.date).toLocaleDateString('es-MX')}
                        <span className="text-xs text-slate-400 ml-2">
                            {new Date(sale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {sale.items && sale.items.length > 0 ? (
                        <>
                           {sale.items[0].productName} 
                           {sale.items.length > 1 && (
                             <span className="text-xs text-slate-400 ml-1">
                               (+{sale.items.length - 1} más)
                             </span>
                           )}
                        </>
                      ) : (
                        <span className="text-slate-400">Venta desconocida</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{sale.clientName}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${sale.type === SaleType.CREDIT ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                        {sale.type === SaleType.CREDIT ? 'Crédito' : 'Normal'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">${sale.totalPrice.toLocaleString('es-MX')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSales.length > 10 && (
                <div className="p-4 text-center border-t border-slate-100">
                    <span className="text-xs text-slate-400 italic">Mostrando las 10 ventas más recientes del periodo</span>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};