import React from 'react';

export default function ThermalReceipt({ order, settings }) {
  if (!order) return null;

  const dateStr = new Date(order.created_at || Date.now()).toLocaleString('pt-BR');
  const subtotalFormatted = Number(order.subtotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const deliveryFeeFormatted = Number(order.delivery_fee || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const totalFormatted = Number(order.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div id="thermal-receipt">
      <div className="thermal-header">
        <div className="thermal-title">{settings.name || 'RESTAURANTE TESTE'}</div>
        <div>{settings.business_type || 'Restaurante'}</div>
        <div>WhatsApp: {settings.whatsapp || ''}</div>
        <div>{settings.address || 'Atendimento Delivery'}</div>
      </div>

      <div className="thermal-row thermal-bold">
        <span>PEDIDO #{order.order_number || '101'}</span>
        <span>{order.delivery_type === 'ENTREGA' ? '[ENTREGA]' : '[RETIRADA]'}</span>
      </div>
      <div>Data: {dateStr}</div>

      <div className="thermal-divider"></div>

      <div className="thermal-bold">DADOS DO CLIENTE:</div>
      <div>Cliente: {order.customer_name}</div>
      <div>Telefone: {order.customer_phone}</div>
      {order.delivery_type === 'ENTREGA' && (
        <div>Endereço: {order.delivery_address}</div>
      )}

      <div className="thermal-double-divider"></div>

      <div className="thermal-bold">ITENS DO PEDIDO:</div>
      {order.items && order.items.map((item, index) => {
        const itemVal = (item.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        return (
          <div key={index} style={{ marginBottom: '6px' }}>
            <div className="thermal-row thermal-bold">
              <span>{item.quantity}x {item.name}</span>
              <span>{itemVal}</span>
            </div>
            {item.selectedCarnes && item.selectedCarnes.length > 0 && (
              <div style={{ paddingLeft: '8px', fontSize: '9pt' }}>
                • Carnes: {item.selectedCarnes.join(', ')}
              </div>
            )}
            {item.selectedGerais && item.selectedGerais.length > 0 && (
              <div style={{ paddingLeft: '8px', fontSize: '9pt' }}>
                • Gerais: {item.selectedGerais.join(', ')}
              </div>
            )}
            {item.notes && (
              <div style={{ paddingLeft: '8px', fontSize: '9pt', fontStyle: 'italic' }}>
                • Obs: {item.notes}
              </div>
            )}
          </div>
        );
      })}

      <div className="thermal-divider"></div>

      <div className="thermal-row">
        <span>Subtotal:</span>
        <span>{subtotalFormatted}</span>
      </div>
      <div className="thermal-row">
        <span>Taxa de Entrega:</span>
        <span>{order.delivery_type === 'ENTREGA' ? deliveryFeeFormatted : 'R$ 0,00'}</span>
      </div>
      <div className="thermal-row thermal-bold" style={{ fontSize: '13pt', marginTop: '4px' }}>
        <span>TOTAL:</span>
        <span>{totalFormatted}</span>
      </div>

      <div className="thermal-divider"></div>

      <div><strong>Pagamento:</strong> {order.payment_method}</div>
      {settings.pix_key && (
        <div style={{ fontSize: '9pt', wordBreak: 'break-all' }}>
          <strong>Chave PIX:</strong> {settings.pix_key}
        </div>
      )}

      <div className="thermal-divider"></div>
      <div className="thermal-center" style={{ fontSize: '9pt' }}>
        Obrigado pela preferência!<br />
        Bom apetite!
      </div>

      {/* Spacing for physical printer cutter */}
      <div className="thermal-cutter-space"></div>
    </div>
  );
}
