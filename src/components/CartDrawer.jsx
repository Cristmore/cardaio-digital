import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, Bike, Store, ArrowRight } from 'lucide-react';

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  deliveryType,
  onSetDeliveryType,
  settings,
  onProceedToCheckout
}) {
  const deliveryFee = deliveryType === 'ENTREGA' ? Number(settings.delivery_fee || 0) : 0;
  
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal + deliveryFee;

  const formattedSubtotal = subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formattedDeliveryFee = deliveryFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formattedTotal = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={20} color="var(--primary)" />
            <h2 className="font-heading" style={{ fontSize: '1.25rem' }}>Seu Pedido</h2>
          </div>
          <button 
            className="btn-close-modal" 
            onClick={onClose}
            aria-label="Fechar carrinho"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🛒</div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '6px', color: 'var(--text-main)' }}>
                Seu carrinho está vazio
              </h3>
              <p style={{ fontSize: '0.85rem' }}>
                Escolha itens deliciosos do cardápio para começar!
              </p>
            </div>
          ) : (
            <>
              {/* Delivery or Pickup Selector */}
              <div className="delivery-toggle-group">
                <button
                  className={`delivery-toggle-btn ${deliveryType === 'ENTREGA' ? 'active' : ''}`}
                  onClick={() => onSetDeliveryType('ENTREGA')}
                >
                  <Bike size={18} />
                  <span>Entrega ({formattedDeliveryFee})</span>
                </button>
                <button
                  className={`delivery-toggle-btn ${deliveryType === 'RETIRADA' ? 'active' : ''}`}
                  onClick={() => onSetDeliveryType('RETIRADA')}
                >
                  <Store size={18} />
                  <span>Retirada (Grátis)</span>
                </button>
              </div>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {cart.map((item, index) => {
                  const itemTotal = (item.price * item.quantity).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  });

                  return (
                    <div key={index} className="cart-item-row">
                      <div style={{ flex: 1, paddingRight: '12px' }}>
                        <h4 className="cart-item-title">
                          {item.quantity}x {item.name}
                        </h4>

                        {item.selectedCarnes && item.selectedCarnes.length > 0 && (
                          <div className="cart-item-option-pill">
                            <strong>Carnes:</strong> {item.selectedCarnes.join(', ')}
                          </div>
                        )}

                        {item.selectedGerais && item.selectedGerais.length > 0 && (
                          <div className="cart-item-option-pill" style={{ display: 'block', marginTop: '3px' }}>
                            <strong>Gerais:</strong> {item.selectedGerais.join(', ')}
                          </div>
                        )}

                        {item.notes && (
                          <div className="cart-item-obs">
                            Obs: {item.notes}
                          </div>
                        )}

                        <div style={{ marginTop: '8px', fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)' }}>
                          {itemTotal}
                        </div>
                      </div>

                      {/* Quantity Controls & Remove */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                        <button
                          onClick={() => onRemoveItem(index)}
                          style={{ color: 'var(--text-light)', padding: '4px' }}
                          title="Remover item"
                        >
                          <Trash2 size={16} />
                        </button>

                        <div className="quantity-control" style={{ transform: 'scale(0.85)', transformOrigin: 'right center' }}>
                          <button 
                            className="btn-qty" 
                            onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="qty-display">{item.quantity}</span>
                          <button 
                            className="btn-qty" 
                            onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price summary */}
              <div style={{
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '2px dashed var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.9rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Subtotal</span>
                  <span>{formattedSubtotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Taxa de Entrega</span>
                  <span>{deliveryType === 'ENTREGA' ? formattedDeliveryFee : 'Grátis'}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: 'var(--text-main)',
                  marginTop: '8px'
                }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--primary)' }}>{formattedTotal}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {cart.length > 0 && (
          <div className="modal-footer">
            <button 
              className="btn-primary-block"
              onClick={onProceedToCheckout}
              id="btn-go-to-checkout"
            >
              <span>Continuar Pedido</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
