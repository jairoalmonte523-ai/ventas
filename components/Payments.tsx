import React, { useState, useMemo } from 'react';
import { Client, Payment } from '../types';
import { Wallet, AlertCircle, CheckCircle2, Search, DollarSign } from 'lucide-react';

interface PaymentsProps {
  clients: Client[];
  payments: Payment[];
  onPayment: (clientId: string, amount: number) => void;
}

export const Payments: React.FC<PaymentsProps> = ({ clients, payments, onPayment }) => {
  // Form State
  const [selectedClientId, setSelectedClientId] = useState('');
  const [amount, setAmount] = useState('');
  const [notification, setNotification] = useState<{type: 'success'|'error', msg: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Derived Data
  const selectedClient = clients.find(c => c.id === selectedClientId);
  const currentDebt = selectedClient ? selectedClient.debt : 0;
  
  // Validation: Amount cannot be greater than debt
  const isValidAmount = useMemo(() => {
    const val = parseFloat(amount);
    return !isNaN(val) && val > 0 && val <= currentDebt;
  }, [amount, currentDebt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    try {
      if (!selectedClient) throw new Error("Seleccione un cliente");
      const val = parseFloat(amount);
      
      onPayment(selectedClientId, val);
      
      setAmount('');
      setNotification({ type: 'success', msg: 'Pago registrado correctamente' });
      
      // Clear notification
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification({ type: 'error', msg: err.message });
    }
  };

  const filteredPayments = useMemo(() => {
    return payments.filter(p => 
      p.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [payments, searchTerm]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* LEFT COLUMN: Payment Form */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 sticky top-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            Registrar Abono
          </h2>

          {notification && (
            <div className={`p-3 mb-4 rounded-lg text-sm flex items-center gap-2 ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4"/> : <AlertCircle className="w-4 h-4"/>}
              {notification.msg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Select */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cliente Deudor</label>
              <select 
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                value={selectedClientId}
                onChange={e => {
                  setSelectedClientId(e.target.value);
                  setAmount('');
                }}
              >
                <option value="">Seleccionar Cliente</option>
                {clients.filter(c => c.debt > 0).map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} - Deuda: ${c.debt.toLocaleString('es-MX')}
                  </option>
                ))}
                {clients.filter(c => c.debt <= 0).length > 0 && (
                   <option disabled>--- Sin Deuda ---</option>
                )}
                {clients.filter(c => c.debt <= 0).map(c => (
                   <option key={c.id} value={c.id} disabled>
                     {c.name} (Al día)
                   </option>
                ))}
              </select>
            </div>

            {selectedClient && (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Deuda Actual:</span>
                    <span className="font-bold text-rose-600">${currentDebt.toLocaleString('es-MX')}</span>
                 </div>
                 {amount && !isNaN(parseFloat(amount)) && (
                    <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                        <span className="text-slate-500">Restante tras pago:</span>
                        <span className="font-bold text-slate-800">
                          ${Math.max(0, currentDebt - parseFloat(amount)).toLocaleString('es-MX')}
                        </span>
                    </div>
                 )}
              </div>
            )}

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Monto a Abonar</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={currentDebt}
                  required
                  disabled={!selectedClientId}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 disabled:bg-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={!isValidAmount}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow-md transition flex justify-center items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" /> Confirmar Pago
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: History */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-800">Historial de Pagos</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text"
              placeholder="Buscar cliente..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4 text-right">Monto Abonado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(payment.date).toLocaleDateString('es-MX')}
                      <span className="text-xs text-slate-400 block">
                        {new Date(payment.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{payment.clientName}</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">
                      +${payment.amount.toLocaleString('es-MX')}
                    </td>
                  </tr>
                ))}
                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
                      No hay pagos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};