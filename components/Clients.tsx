import React, { useState, useMemo } from 'react';
import { Client } from '../types';
import { Plus, Edit2, Trash2, X, Save, Wallet, Search } from 'lucide-react';

interface ClientsProps {
  clients: Client[];
  onAdd: (name: string, initialDebt: number) => void;
  onUpdate: (id: string, name: string, initialDebt: number) => void;
  onDelete: (id: string) => void;
}

export const Clients: React.FC<ClientsProps> = ({ clients, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    initialDebt: ''
  });

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingId(client.id);
      setFormData({
        name: client.name,
        initialDebt: client.initialDebt ? client.initialDebt.toString() : '0'
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        initialDebt: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const debtVal = parseFloat(formData.initialDebt) || 0;
    
    if (editingId) {
      onUpdate(editingId, formData.name, debtVal);
    } else {
      onAdd(formData.name, debtVal);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Cartera de Clientes</h2>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Nuevo Cliente
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          type="text"
          placeholder="Buscar clientes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        />
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Nombre del Cliente</th>
                <th className="px-6 py-4 text-right">Deuda Inicial</th>
                <th className="px-6 py-4 text-right">Deuda Total Actual</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.length > 0 ? (
                filteredClients.map(client => (
                  <tr key={client.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{client.name}</div>
                      <div className="text-xs text-slate-400">ID: {client.id.slice(0,8)}</div>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500">
                      ${(client.initialDebt || 0).toLocaleString('es-MX')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold px-3 py-1 rounded-full text-xs ${
                        client.debt > 0 
                          ? 'bg-rose-100 text-rose-700' 
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        ${client.debt.toLocaleString('es-MX')}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex justify-center gap-3">
                      <button 
                        onClick={() => handleOpenModal(client)} 
                        className="text-indigo-600 hover:text-indigo-900 transition"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(client.id)} 
                        className="text-red-500 hover:text-red-700 transition"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                    No se encontraron clientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input 
                  required 
                  autoFocus
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary outline-none" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    Deuda Inicial <span className="text-xs text-slate-400 font-normal">(Opcional)</span>
                </label>
                <div className="relative">
                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                        type="number" 
                        min="0"
                        step="0.01"
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary outline-none" 
                        value={formData.initialDebt} 
                        onChange={e => setFormData({...formData, initialDebt: e.target.value})}
                        placeholder="0.00"
                    />
                </div>
                <p className="text-xs text-slate-500 mt-1">Monto de deuda antigua o saldo inicial.</p>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-primary hover:bg-indigo-700 text-white rounded-lg font-medium shadow-md flex justify-center items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};