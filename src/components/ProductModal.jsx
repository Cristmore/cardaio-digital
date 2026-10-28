import React, { useState } from 'react';
import { X, Check, Plus, Minus, AlertCircle, ShoppingBag } from 'lucide-react';

export default function ProductModal({ product, onClose, onAddToCart }) {
  const [selectedCarnes, setSelectedCarnes] = useState([]);
  const [selectedGerais, setSelectedGerais] = useState([]);
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');

  if (!product) return null;

  const carnesLimit = Number(product.carnes_limit || 0);
  const geraisLimit = Number(product.gerais_limit || 0);
  const carnesOptions = product.carnes_options || [];
  const geraisOptions = product.gerais_options || [];

  const handleToggleCarne = (item) => {
    setErrorMessage('');
    if (selectedCarnes.includes(item)) {
      setSelectedCarnes(selectedCarnes.filter(c => c !== item));
    } else {
      if (carnesLimit > 0 && selectedCarnes.length >= carnesLimit) {
        setErrorMessage(`Você já atingiu o limite de ${carnesLimit} carnes para este prato.`);
        return;
      }
      setSelectedCarnes([...selectedCarnes, item]);
    }
  };

  const handleToggleGeral = (item) => {
    setErrorMessage('');
    if (selectedGerais.includes(item)) {
      setSelectedGerais(selectedGerais.filter(g => g !== item));
    } else {
      if (geraisLimit > 0 && selectedGerais.length >= geraisLimit) {
        setErrorMessage(`Você já atingiu o limite de ${geraisLimit} opções gerais.`);
        return;
      }
      setSelectedGerais([...selectedGerais, item]);
    }
  };

  const handleAdd = () => {
    // Check if required optionals are chosen
    if (carnesLimit > 0 && selectedCarnes.length === 0) {
      setErrorMessage(`Por favor, selecione pelo menos 1 opção de carne (até ${carnesLimit}).`);
      return;
    }

    const itemToAdd = {
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity,
      selectedCarnes,
      selectedGerais,
      notes: notes.trim(),
      totalPrice: product.price * quantity
    };

    onAddToCart(itemToAdd);
    onClose();
  };

  const subtotal = (product.price * quantity).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div>
            <h2 className="font-heading" style={{ fontSize: '1.25rem' }}>{product.name}</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {product.category}
            </span>
          </div>
          <button 
            className="btn-close-modal" 
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {product.image && (
            <div className="product-modal-image-wrapper">
              <img 
                src={product.image} 
                alt={product.name}
                className="product-modal-image"
              />
            </div>
          )}

          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
            {product.description}
          </p>

          {errorMessage && (
            <div style={{
              background: '#FEE2E2',
              color: '#B91C1C',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Opcionais: Carnes */}
          {carnesLimit > 0 && carnesOptions.length > 0 && (
            <div className="option-group-card">
              <div className="option-group-header">
                <div>
                  <h4 className="option-group-title">Carnes</h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Escolha até {carnesLimit} opções
                  </span>
                </div>
                <span className="option-group-limit-badge">
                  {selectedCarnes.length}/{carnesLimit}
                </span>
              </div>

              <div className="option-items-list">
                {carnesOptions.map((item) => {
                  const isSelected = selectedCarnes.includes(item);
                  const isMaxReached = selectedCarnes.length >= carnesLimit && !isSelected;

                  return (
                    <div 
                      key={item}
                      className={`option-item-row ${isSelected ? 'selected' : ''} ${isMaxReached ? 'disabled' : ''}`}
                      onClick={() => handleToggleCarne(item)}
                    >
                      <span className="option-item-label">
                        <span className="custom-checkbox">
                          {isSelected && <Check size={14} strokeWidth={3} />}
                        </span>
                        {item}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: isSelected ? 'var(--primary)' : 'var(--text-light)', fontWeight: 700 }}>
                        {isSelected ? 'Selecionado' : 'Incluso'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Opcionais: Gerais */}
          {geraisLimit > 0 && geraisOptions.length > 0 && (
            <div className="option-group-card">
              <div className="option-group-header">
                <div>
                  <h4 className="option-group-title">Opções Gerais</h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Escolha até {geraisLimit} opções
                  </span>
                </div>
                <span className="option-group-limit-badge">
                  {selectedGerais.length}/{geraisLimit}
                </span>
              </div>

              <div className="option-items-list">
                {geraisOptions.map((item) => {
                  const isSelected = selectedGerais.includes(item);
                  const isMaxReached = selectedGerais.length >= geraisLimit && !isSelected;

                  return (
                    <div 
                      key={item}
                      className={`option-item-row ${isSelected ? 'selected' : ''} ${isMaxReached ? 'disabled' : ''}`}
                      onClick={() => handleToggleGeral(item)}
                    >
                      <span className="option-item-label">
                        <span className="custom-checkbox">
                          {isSelected && <Check size={14} strokeWidth={3} />}
                        </span>
                        {item}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: isSelected ? 'var(--primary)' : 'var(--text-light)', fontWeight: 700 }}>
                        {isSelected ? 'Selecionado' : 'Incluso'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Observações */}
          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label">
              Observações do prato (opcional)
            </label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Ex: sem cebola, feijão bem temperado, ponto da carne..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <div className="quantity-control">
            <button 
              className="btn-qty" 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              aria-label="Diminuir quantidade"
            >
              <Minus size={16} />
            </button>
            <span className="qty-display">{quantity}</span>
            <button 
              className="btn-qty" 
              onClick={() => setQuantity(quantity + 1)}
              aria-label="Aumentar quantidade"
            >
              <Plus size={16} />
            </button>
          </div>

          <button 
            className="btn-primary-block"
            onClick={handleAdd}
            id="btn-confirm-add-cart"
          >
            <ShoppingBag size={18} />
            <span>Adicionar • {subtotal}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
