import React, { useState } from 'react';
import { LayoutDashboard, Package, Users, ShoppingCart, Menu, X, Wallet } from 'lucide-react';
import { useStore } from './hooks/useStore';
import { ViewState } from './types';

// Components
import { Dashboard } from './components/Dashboard';
import { Products } from './components/Products';
import { Clients } from './components/Clients';
import { Sales } from './components/Sales';
import { Payments } from './components/Payments';

const App: React.FC = () => {
  const { 
    products, clients, sales, payments, loading, 
    addProduct, updateProduct, deleteProduct,
    addClient, updateClient, deleteClient,
    addSale, addPayment
  } = useStore();

  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const NavItem = ({ view, label, icon: Icon }: { view: ViewState; label: string; icon: any }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setMobileMenuOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
        currentView === view 
          ? 'bg-primary text-white shadow-lg shadow-indigo-500/30' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed h-full p-6 z-10">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold shadow-md">
            G
          </div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">GestorPro</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem view="DASHBOARD" label="Panel Principal" icon={LayoutDashboard} />
          <NavItem view="PRODUCTS" label="Productos" icon={Package} />
          <NavItem view="CLIENTS" label="Clientes" icon={Users} />
          <NavItem view="SALES" label="Ventas" icon={ShoppingCart} />
          <NavItem view="PAYMENTS" label="Pagos y Abonos" icon={Wallet} />
        </nav>

        <div className="pt-6 border-t border-slate-100 px-2">
          <p className="text-xs text-slate-400 text-center">© 2024 GestorPro v1.1</p>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center text-white font-bold">G</div>
          <h1 className="font-bold text-slate-800">GestorPro</h1>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-600 p-2">
          {mobileMenuOpen ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-10 bg-white pt-20 px-6 space-y-4 md:hidden">
           <NavItem view="DASHBOARD" label="Panel Principal" icon={LayoutDashboard} />
           <NavItem view="PRODUCTS" label="Productos" icon={Package} />
           <NavItem view="CLIENTS" label="Clientes" icon={Users} />
           <NavItem view="SALES" label="Ventas" icon={ShoppingCart} />
           <NavItem view="PAYMENTS" label="Pagos y Abonos" icon={Wallet} />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          {currentView === 'DASHBOARD' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">Panel Principal</h2>
              <p className="text-slate-500 mb-8">Resumen general de tu negocio.</p>
              <Dashboard products={products} clients={clients} sales={sales} />
            </div>
          )}
          
          {currentView === 'PRODUCTS' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Products 
                products={products} 
                onAdd={addProduct} 
                onUpdate={updateProduct} 
                onDelete={deleteProduct} 
              />
            </div>
          )}

          {currentView === 'CLIENTS' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Clients 
                clients={clients} 
                onAdd={addClient} 
                onUpdate={updateClient} 
                onDelete={deleteClient} 
              />
             </div>
          )}

          {currentView === 'SALES' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Sales 
                products={products} 
                clients={clients} 
                sales={sales} 
                onSale={addSale} 
              />
             </div>
          )}

          {currentView === 'PAYMENTS' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Payments 
                clients={clients} 
                payments={payments} 
                onPayment={addPayment} 
              />
             </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;