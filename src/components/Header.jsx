import React from 'react';
import { Search, Clock, Bike, ShieldCheck, Utensils, Coffee, IceCream, Pizza, Sparkles } from 'lucide-react';

export default function Header({ 
  settings, 
  categories, 
  activeCategory, 
  onSelectCategory, 
  searchQuery, 
  onSearchChange,
  onOpenAdmin 
}) {
  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'Utensils': return <Utensils size={15} />;
      case 'Coffee': return <Coffee size={15} />;
      case 'IceCream': return <IceCream size={15} />;
      case 'Pizza': return <Pizza size={15} />;
      default: return <Sparkles size={15} />;
    }
  };

  const formattedDeliveryFee = Number(settings.delivery_fee || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  return (
    <div>
      {/* Top Banner */}
      <header className="store-header">
        <div className="store-header-top">
          <div className="store-badge-open">
            <span className="dot"></span>
            <span>Aberto agora</span>
          </div>

          <button 
            onClick={onOpenAdmin}
            className="admin-link-btn"
            title="Acessar Painel do Administrador"
            id="btn-admin-access"
          >
            <ShieldCheck size={16} />
            <span>Admin</span>
          </button>
        </div>

        <div className="store-info">
          <div className="store-avatar" role="img" aria-label="Logo do restaurante">
            🍱
          </div>
          <div className="store-meta">
            <h1>{settings.name || 'Restaurante Teste'}</h1>
            <p>{settings.business_type || 'Restaurante & Marmitaria'}</p>
          </div>
        </div>

        <div className="store-badges-row">
          <div className="badge-pill">
            <Clock size={14} />
            <span>{settings.delivery_time || '35 - 50 min'}</span>
          </div>
          <div className="badge-pill">
            <Bike size={14} />
            <span>Entrega: {formattedDeliveryFee}</span>
          </div>
        </div>
      </header>

      {/* Search & Categories Bar */}
      <div className="search-categories-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar pratos, bebidas ou sobremesas..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            id="input-search-products"
          />
        </div>

        <div className="categories-scroll">
          <button 
            className={`category-chip ${activeCategory === 'TODOS' ? 'active' : ''}`}
            onClick={() => onSelectCategory('TODOS')}
          >
            <Sparkles size={15} />
            <span>Todos</span>
          </button>
          
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-chip ${activeCategory === cat.name ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat.name)}
            >
              {getCategoryIcon(cat.icon)}
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
