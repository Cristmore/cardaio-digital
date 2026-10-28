import React, { useState, useEffect } from 'react';
import { 
  X, Phone, User, MapPin, CheckCircle2, 
  CreditCard, Banknote, QrCode, Copy, Check, Send, AlertCircle, RefreshCw 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { dbService } from '../services/db';

export default function CheckoutModal({
  isOpen,
  onClose,
  cart,
  deliveryType,
  settings,
  onOrderSuccess
}) {
  const [phone, setPhone] = useState('');
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [customerFound, setCustomerFound] = useState(null);
  const [wantsToEditAddress, setWantsToEditAddress] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [complement, setComplement] = useState('');
  const [reference, setReference] = useState('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('PIX'); // 'PIX', 'CARTAO', 'DINHEIRO'
  const [cardType, setCardType] = useState('Crédito'); // 'Crédito', 'Débito', 'VR'
  const [needChange, setNeedChange] = useState('NÃO');
  const [changeAmount, setChangeAmount] = useState('');
  const [pixCopied, setPixCopied] = useState(false);

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Format Phone Mask: (11) 98765-4321
  const handlePhoneChange = async (e) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.length > 11) raw = raw.slice(0, 11);

    let formatted = raw;
    if (raw.length > 2) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    }
    if (raw.length > 7) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
    }

    setPhone(formatted);
    setErrorMessage('');

    // When 10 or 11 digits are typed, automatically search customer in DB
    if (raw.length >= 10) {
      setSearchingCustomer(true);
      try {
        const found = await dbService.getCustomerByPhone(raw);
        if (found) {
          setCustomerFound(found);
          setName(found.name || '');
          setStreet(found.street || '');
          setNumber(found.number || '');
          setNeighborhood(found.neighborhood || '');
          setComplement(found.complement || '');
          setReference(found.reference || '');
          setWantsToEditAddress(false);
        } else {
          setCustomerFound(null);
          // Keep previous inputs if any, or clear
          setWantsToEditAddress(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingCustomer(false);
      }
    } else {
      setCustomerFound(null);
    }
  };

  const handleCopyPix = () => {
    if (settings.pix_key) {
      navigator.clipboard.writeText(settings.pix_key);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 3000);
    }
  };

  const deliveryFee = deliveryType === 'ENTREGA' ? Number(settings.delivery_fee || 0) : 0;
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal + deliveryFee;

  const formattedSubtotal = subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formattedDeliveryFee = deliveryFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formattedTotal = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleSubmitOrder = async () => {
    setErrorMessage('');
    const rawPhone = phone.replace(/\D/g, '');

    if (rawPhone.length < 10) {
      setErrorMessage('Por favor, informe seu celular com DDD completo.');
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.');
      return;
    }

    if (deliveryType === 'ENTREGA') {
      if (!street.trim() || !number.trim() || !neighborhood.trim()) {
        setErrorMessage('Por favor, preencha o endereço de entrega (Rua, Número e Bairro).');
        return;
      }
    }

    setLoadingSubmit(true);

    try {
      // 1. Save / Update customer in Database
      const customerData = {
        phone: rawPhone,
        name: name.trim(),
        street: street.trim(),
        number: number.trim(),
        neighborhood: neighborhood.trim(),
        complement: complement.trim(),
        reference: reference.trim()
      };
      await dbService.saveCustomer(customerData);

      // Formatted address string
      const fullAddress = deliveryType === 'ENTREGA' 
        ? `${street.trim()}, Nº ${number.trim()} - ${neighborhood.trim()}${complement ? ` (${complement.trim()})` : ''}${reference ? ` | Ref: ${reference.trim()}` : ''}`
        : 'Retirada no Balcão';

      // Payment details
      let paymentText = paymentMethod;
      if (paymentMethod === 'CARTAO') {
        paymentText = `Cartão (${cardType})`;
      } else if (paymentMethod === 'DINHEIRO') {
        paymentText = needChange === 'SIM' && changeAmount 
          ? `Dinheiro (Troco para R$ ${changeAmount})` 
          : 'Dinheiro (Não precisa de troco)';
      }

      // 2. Create Order in Database
      const orderPayload = {
        customer_phone: rawPhone,
        customer_name: name.trim(),
        delivery_type: deliveryType,
        delivery_address: fullAddress,
        payment_method: paymentText,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        items: cart,
        created_at: new Date().toISOString()
      };

      const savedOrder = await dbService.createOrder(orderPayload);

      // 3. Trigger Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore
      }

      // 4. Construct WhatsApp Message as requested
      let msg = `*NOVO PEDIDO - ${settings.name.toUpperCase()}*\n`;
      msg += `*Pedido Nº:* #${savedOrder.order_number || '101'}\n`;
      msg += `--------------------------------\n`;
      msg += `*Cliente:* ${name.trim()}\n`;
      msg += `*WhatsApp:* (${rawPhone.slice(0, 2)}) ${rawPhone.slice(2)}\n`;
      msg += `*Tipo:* ${deliveryType === 'ENTREGA' ? '🛵 Entrega' : '🏪 Retirada no Balcão'}\n`;
      if (deliveryType === 'ENTREGA') {
        msg += `*Endereço:* ${fullAddress}\n`;
      }
      msg += `--------------------------------\n`;
      msg += `*ITENS DO PEDIDO:*\n`;

      cart.forEach((item, idx) => {
        const itemVal = (item.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        msg += `${idx + 1}. *${item.quantity}x ${item.name}* - ${itemVal}\n`;
        if (item.selectedCarnes && item.selectedCarnes.length > 0) {
          msg += `   • *Carnes:* ${item.selectedCarnes.join(', ')}\n`;
        }
        if (item.selectedGerais && item.selectedGerais.length > 0) {
          msg += `   • *Gerais:* ${item.selectedGerais.join(', ')}\n`;
        }
        if (item.notes) {
          msg += `   • *Obs:* ${item.notes}\n`;
        }
      });

      msg += `--------------------------------\n`;
      msg += `*Subtotal:* ${formattedSubtotal}\n`;
      msg += `*Taxa de Entrega:* ${deliveryType === 'ENTREGA' ? formattedDeliveryFee : 'Grátis'}\n`;
      msg += `*VALOR TOTAL:* *${formattedTotal}*\n`;
      msg += `*Forma de Pagamento:* ${paymentText}\n`;
      if (paymentMethod === 'PIX') {
        msg += `*Chave PIX:* ${settings.pix_key}\n`;
      }
      msg += `*Tempo Estimado:* ${settings.delivery_time || '35 - 50 min'}\n`;
      msg += `--------------------------------\n`;
      msg += `_Pedido gerado automaticamente pelo Cardápio Digital._`;

      // 5. Open WhatsApp via wa.me link
      const restaurantWhatsAppClean = (settings.whatsapp || '').replace(/\D/g, '');
      const waNumber = restaurantWhatsAppClean.startsWith('55') 
        ? restaurantWhatsAppClean 
        : `55${restaurantWhatsAppClean}`;
      
      const whatsappUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;

      // Pass saved order to parent for automatic thermal receipt printing
      onOrderSuccess(savedOrder);

      // Open WhatsApp in new tab / app
      window.open(whatsappUrl, '_blank');

      onClose();
    } catch (err) {
      console.error(err);
      setErrorMessage('Ocorreu um erro ao processar seu pedido. Tente novamente.');
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: '600px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Phone size={20} color="var(--primary)" />
            <h2 className="font-heading" style={{ fontSize: '1.25rem' }}>Finalizar Pedido</h2>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
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

          {/* STEP 1: Phone input */}
          <div className="form-group">
            <label className="form-label">
              Seu Celular / WhatsApp com DDD *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="tel"
                className="form-input"
                placeholder="(11) 98765-4321"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={15}
                id="input-customer-phone"
              />
              {searchingCustomer && (
                <div style={{ position: 'absolute', right: '12px', top: '10px' }}>
                  <RefreshCw size={18} className="animate-spin" color="var(--primary)" />
                </div>
              )}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              Identificamos seu cadastro automaticamente pelo número.
            </span>
          </div>

          {/* Existing Customer Found Card */}
          {customerFound && !wantsToEditAddress && (
            <div className="customer-found-card">
              <div className="customer-found-title">
                <CheckCircle2 size={18} />
                <span>Cliente cadastrado: {customerFound.name}!</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#166534', margin: '4px 0 10px' }}>
                <strong>Endereço atual:</strong> {customerFound.street}, {customerFound.number} - {customerFound.neighborhood} {customerFound.complement ? `(${customerFound.complement})` : ''}
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  style={{
                    background: '#166534',
                    color: '#FFFFFF',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.78rem',
                    fontWeight: 700
                  }}
                  onClick={() => setWantsToEditAddress(false)}
                >
                  ✓ Manter este endereço
                </button>
                <button
                  type="button"
                  style={{
                    background: '#FFFFFF',
                    color: '#166534',
                    border: '1px solid #166534',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.78rem',
                    fontWeight: 700
                  }}
                  onClick={() => setWantsToEditAddress(true)}
                >
                  ✎ Alterar endereço
                </button>
              </div>
            </div>
          )}

          {/* Registration / Address Fields */}
          {(!customerFound || wantsToEditAddress) && (
            <div style={{
              background: 'var(--bg-muted)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '18px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <User size={16} color="var(--primary)" />
                <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                  {customerFound ? 'Atualizar Dados do Cliente' : 'Dados para Entrega / Contato'}
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Seu Nome Completo *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Carlos Oliveira"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  id="input-customer-name"
                />
              </div>

              {deliveryType === 'ENTREGA' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label className="form-label">Rua / Logradouro *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Rua das Flores"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        id="input-customer-street"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Número *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: 123"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        id="input-customer-number"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label className="form-label">Bairro *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Centro"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        id="input-customer-neighborhood"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Complemento</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Apto 42"
                        value={complement}
                        onChange={(e) => setComplement(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ponto de Referência</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Próximo à padaria central"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Forma de Pagamento */}
          <div style={{ marginTop: '14px' }}>
            <label className="form-label" style={{ marginBottom: '10px' }}>
              Forma de Pagamento
            </label>

            <div className="payment-options-grid">
              <div 
                className={`payment-option-card ${paymentMethod === 'PIX' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('PIX')}
                id="btn-pay-pix"
              >
                <QrCode size={22} />
                <span>PIX</span>
              </div>

              <div 
                className={`payment-option-card ${paymentMethod === 'CARTAO' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('CARTAO')}
                id="btn-pay-card"
              >
                <CreditCard size={22} />
                <span>Cartão</span>
              </div>

              <div 
                className={`payment-option-card ${paymentMethod === 'DINHEIRO' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('DINHEIRO')}
                id="btn-pay-cash"
              >
                <Banknote size={22} />
                <span>Dinheiro</span>
              </div>
            </div>

            {/* PIX Details */}
            {paymentMethod === 'PIX' && (
              <div className="pix-box">
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#92400E' }}>
                  Chave PIX do Restaurante:
                </span>
                <div className="pix-key-display">
                  {settings.pix_key || 'Chave não cadastrada'}
                </div>
                <button
                  type="button"
                  onClick={handleCopyPix}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#FFFFFF',
                    border: '1px solid var(--border-color)',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--text-main)'
                  }}
                >
                  {pixCopied ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
                  <span>{pixCopied ? 'Chave Copiada!' : 'Copiar Chave PIX'}</span>
                </button>
              </div>
            )}

            {/* Cartão Details */}
            {paymentMethod === 'CARTAO' && (
              <div style={{ background: 'var(--bg-muted)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '14px' }}>
                <label className="form-label">Levar maquininha para:</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['Crédito', 'Débito', 'VR / Refeição'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCardType(type)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        background: cardType === type ? 'var(--primary)' : '#FFFFFF',
                        color: cardType === type ? '#FFFFFF' : 'var(--text-main)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dinheiro Details */}
            {paymentMethod === 'DINHEIRO' && (
              <div style={{ background: 'var(--bg-muted)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '14px' }}>
                <label className="form-label">Precisa de troco?</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  {['NÃO', 'SIM'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setNeedChange(opt)}
                      style={{
                        padding: '6px 16px',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        background: needChange === opt ? 'var(--primary)' : '#FFFFFF',
                        color: needChange === opt ? '#FFFFFF' : 'var(--text-main)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      {opt === 'NÃO' ? 'Não precisa' : 'Sim, preciso de troco'}
                    </button>
                  ))}
                </div>

                {needChange === 'SIM' && (
                  <div className="form-group" style={{ marginTop: '8px' }}>
                    <label className="form-label">Troco para quanto?</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Ex: 50 ou 100"
                      value={changeAmount}
                      onChange={(e) => setChangeAmount(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Order Summary Recap */}
          <div style={{
            background: 'var(--bg-muted)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginTop: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Subtotal:</span>
              <span>{formattedSubtotal}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>{deliveryType === 'ENTREGA' ? 'Taxa de Entrega:' : 'Retirada:'}</span>
              <span>{deliveryType === 'ENTREGA' ? formattedDeliveryFee : 'Grátis'}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 800,
              fontSize: '1.15rem',
              color: 'var(--primary)',
              borderTop: '1px dashed var(--border-color)',
              paddingTop: '6px'
            }}>
              <span>Total a pagar:</span>
              <span>{formattedTotal}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn-primary-block"
            onClick={handleSubmitOrder}
            disabled={loadingSubmit}
            id="btn-submit-order-whatsapp"
          >
            <Send size={18} />
            <span>{loadingSubmit ? 'Processando...' : 'Confirmar e Enviar para WhatsApp'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
