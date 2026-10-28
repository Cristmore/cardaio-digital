import React from 'react';
import { Plus } from 'lucide-react';

export default function ProductCard({ product, onSelect }) {
  const formattedPrice = Number(product.price || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  const getBadgeClass = (badge) => {
    switch (badge) {
      case 'MAIS PEDIDO': return 'badge-mais-pedido';
      case 'NOVO': return 'badge-novo';
      case 'PROMOÇÃO': return 'badge-promocao';
      default: return '';
    }
  };

  const hasBadge = product.badge && product.badge !== 'NENHUM';

  return (
    <article 
      className="product-card" 
      onClick={() => onSelect(product)}
      id={`product-card-${product.id}`}
    >
      <div className="product-info">
        {hasBadge && (
          <span className={`product-badge ${getBadgeClass(product.badge)}`}>
            {product.badge}
          </span>
        )}
        <h3 className="product-title">{product.name}</h3>
        <p className="product-desc">{product.description}</p>
        
        <div className="product-footer">
          <span className="product-price">{formattedPrice}</span>
          <button 
            className="btn-add-product"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            aria-label={`Adicionar ${product.name}`}
          >
            <Plus size={16} />
            <span>Adicionar</span>
          </button>
        </div>
      </div>

      <div className="product-image-container">
        <img 
          src={product.image || '/images/marmita.jpg'} 
          alt={product.name}
          className="product-image"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop';
          }}
        />
      </div>
    </article>
  );
}
