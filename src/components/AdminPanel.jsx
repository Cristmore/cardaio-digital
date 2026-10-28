import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Lock, Plus, Trash2, Edit3, Printer, 
  CheckCircle, Clock, Settings, ShoppingBag, FolderPlus, 
  DollarSign, Bike, Phone, QrCode, Database, Check, AlertCircle, Eye
} from 'lucide-react';
import { dbService, isSupabaseConfigured } from '../services/db';

export default function AdminPanel({
  onClose,
  settings,
  onUpdateSettings,
  products,
  onReloadProducts,
  categories,
  onReloadCategories,
  orders,
  onReloadOrders,
  onPrintOrder
}) {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'products', 'categories', 'settings'
  const [orderStatusFilter, setOrderStatusFilter] = useState('TODOS');
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(true);

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState({ ...settings });
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);

  // Product Form State (for Create / Edit)
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    image: '',
    badge: 'NENHUM',
    carnes_limit: 2,
    gerais_limit: 4,
    carnes_options_str: 'Carne cozida, Frango ao molho, Frango assado, Peixe frito, Churrasco, Ovo frito',
    gerais_options_str: 'Arroz, Feijão, Salada, Farofa, Verdura'
  });

  // Category Form State
  const [newCategoryName, setNewCategoryName] = useState('');

  // Auto-listen to new orders event to trigger automatic printing
  useEffect(() => {
    const handleNewOrder = (event) => {
      const newOrder = event.detail;
      onReloadOrders();
      if (autoPrintEnabled) {
        onPrintOrder(newOrder);
      }
    };

    window.addEventListener('cardapio_new_order', handleNewOrder);
    return () => window.removeEventListener('cardapio_new_order', handleNewOrder);
  }, [autoPrintEnabled, onReloadOrders, onPrintOrder]);

  const handleLogin = (e) => {
    e.preventDefault();
    // Default PIN: admin123 or 123456
    if (password === 'admin123' || password === '123456' || password === 'admin') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Senha incorreta! Dica: use "admin123" ou "123456"');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const updated = await dbService.updateSettings({
      ...settingsForm,
      delivery_fee: Number(settingsForm.delivery_fee || 0)
    });
    onUpdateSettings(updated);
    setSettingsSavedMsg(true);
    setTimeout(() => setSettingsSavedMsg(false), 3000);
  };

  const handleOpenProductModal = (prod = null) => {
    if (prod) {
      setEditingProduct(prod);
      setProductForm({
        name: prod.name || '',
        category: prod.category || (categories[0]?.name || ''),
        description: prod.description || '',
        price: String(prod.price || ''),
        image: prod.image || '',
        badge: prod.badge || 'NENHUM',
        carnes_limit: prod.carnes_limit ?? 2,
        gerais_limit: prod.gerais_limit ?? 4,
        carnes_options_str: (prod.carnes_options || []).join(', '),
        gerais_options_str: (prod.gerais_options || []).join(', ')
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        category: categories[0]?.name || 'Prato principal',
        description: '',
        price: '',
        image: '/images/marmita.jpg',
        badge: 'NENHUM',
        carnes_limit: 2,
        gerais_limit: 4,
        carnes_options_str: 'Carne cozida, Frango ao molho, Frango assado, Peixe frito, Churrasco, Ovo frito',
        gerais_options_str: 'Arroz, Feijão, Salada, Farofa, Verdura'
      });
    }
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) return;

    const carnes_options = productForm.carnes_options_str
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const gerais_options = productForm.gerais_options_str
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const payload = {
      ...(editingProduct ? editingProduct : {}),
      name: productForm.name.trim(),
      category: productForm.category,
      description: productForm.description.trim(),
      price: parseFloat(String(productForm.price).replace(',', '.')) || 0,
      image: productForm.image.trim(),
      badge: productForm.badge,
      carnes_limit: Number(productForm.carnes_limit || 0),
      gerais_limit: Number(productForm.gerais_limit || 0),
      carnes_options,
      gerais_options
    };

    await dbService.saveProduct(payload);
    await onReloadProducts();
    setShowProductModal(false);
  };

  const handleDeleteProduct = async (id) => {
    if (confirm('Tem certeza que deseja remover este produto?')) {
      await dbService.deleteProduct(id);
      await onReloadProducts();
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    await dbService.addCategory(newCategoryName.trim());
    setNewCategoryName('');
    await onReloadCategories();
  };

  const handleDeleteCategory = async (id) => {
    if (confirm('Excluir esta categoria?')) {
      await dbService.deleteCategory(id);
      await onReloadCategories();
    }
  };

  const handleChangeOrderStatus = async (orderId, newStatus) => {
    await dbService.updateOrderStatus(orderId, newStatus);
    await onReloadOrders();
  };

  // Filtered orders
  const filteredOrders = orderStatusFilter === 'TODOS'
    ? orders
    : orders.filter(o => o.status === orderStatusFilter);

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="admin-mode-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          padding: '36px',
          maxWidth: '420px',
          width: '90%',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Lock size={30} />
          </div>

          <h2 className="font-heading" style={{ fontSize: '1.4rem', marginBottom: '6px' }}>
            Acesso Administrativo
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Gerencie pedidos em tempo real, cardápio, produtos, taxas e chaves PIX.
          </p>

          {authError && (
            <div style={{
              background: '#FEE2E2',
              color: '#B91C1C',
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              marginBottom: '16px'
            }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label">Senha de Acesso</label>
              <input
                type="password"
                className="form-input"
                placeholder="Digite a senha (padrão: admin123)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                id="input-admin-password"
              />
            </div>

            <button
              type="submit"
              className="btn-primary-block"
              style={{ marginTop: '16px' }}
              id="btn-admin-login-submit"
            >
              <span>Entrar no Painel</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                marginTop: '16px',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                fontWeight: 600
              }}
            >
              ← Voltar ao Cardápio
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-mode-container">
      {/* Top Navigation */}
      <nav className="admin-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button 
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-muted)',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}
          >
            <ArrowLeft size={16} />
            <span>Ver Cardápio</span>
          </button>
          <h2 className="font-heading" style={{ fontSize: '1.2rem' }}>
            Painel Admin • {settings.name}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            background: isSupabaseConfigured ? '#DCFCE7' : '#FEF3C7',
            color: isSupabaseConfigured ? '#15803D' : '#92400E',
            fontWeight: 700
          }}>
            <Database size={14} />
            <span>{isSupabaseConfigured ? 'Supabase Conectado' : 'Modo Offline / Local'}</span>
          </div>

          <button
            onClick={() => setIsAuthenticated(false)}
            style={{ fontSize: '0.82rem', color: 'var(--danger)', fontWeight: 700 }}
          >
            Sair
          </button>
        </div>
      </nav>

      {/* Admin Tabs */}
      <div className="admin-tabs-nav">
        <button
          className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
          id="tab-admin-orders"
        >
          <ShoppingBag size={18} />
          <span>Pedidos ({orders.length})</span>
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
          id="tab-admin-products"
        >
          <Edit3 size={18} />
          <span>Cardápio & Produtos ({products.length})</span>
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
          id="tab-admin-categories"
        >
          <FolderPlus size={18} />
          <span>Categorias ({categories.length})</span>
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
          id="tab-admin-settings"
        >
          <Settings size={18} />
          <span>Configurações da Loja</span>
        </button>
      </div>

      {/* ================= TAB 1: ORDERS DASHBOARD ================= */}
      {activeTab === 'orders' && (
        <div style={{ padding: '24px' }}>
          {/* Header & Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['TODOS', 'Recebido', 'Preparando', 'Saiu para entrega', 'Entregue', 'Cancelado'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    background: orderStatusFilter === st ? 'var(--primary)' : '#FFFFFF',
                    color: orderStatusFilter === st ? '#FFFFFF' : 'var(--text-main)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={autoPrintEnabled}
                onChange={(e) => setAutoPrintEnabled(e.target.checked)}
              />
              <span>🖨️ Imprimir automaticamente ao receber pedido</span>
            </label>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              padding: '48px 24px',
              textAlign: 'center',
              color: 'var(--text-muted)'
            }}>
              <ShoppingBag size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <h3>Nenhum pedido encontrado nesta seção</h3>
              <p style={{ fontSize: '0.85rem' }}>Os novos pedidos feitos pelos clientes aparecerão aqui em tempo real.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredOrders.map((order) => {
                const totalFormatted = Number(order.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                const dateFormatted = new Date(order.created_at || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={order.id} className="order-card">
                    <div className="order-card-header">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                            Pedido #{order.order_number || '101'}
                          </span>
                          <span className={`status-badge status-${(order.status || 'Recebido').replace(/\s+/g, '-')}`}>
                            {order.status || 'Recebido'}
                          </span>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            às {dateFormatted}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          <strong>{order.customer_name}</strong> • Cel: {order.customer_phone} • {order.delivery_type === 'ENTREGA' ? '🛵 Entrega' : '🏪 Retirada'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                          {totalFormatted}
                        </span>

                        <button
                          onClick={() => onPrintOrder(order)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#FFFFFF',
                            border: '1.5px solid var(--border-color)',
                            padding: '8px 14px',
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: 700,
                            fontSize: '0.82rem'
                          }}
                          title="Imprimir Cupom Térmico (80mm/58mm)"
                        >
                          <Printer size={16} />
                          <span>Imprimir</span>
                        </button>
                      </div>
                    </div>

                    {order.delivery_type === 'ENTREGA' && (
                      <div style={{ fontSize: '0.85rem', marginBottom: '10px', color: '#374151' }}>
                        📍 <strong>Endereço:</strong> {order.delivery_address}
                      </div>
                    )}

                    <div style={{
                      background: 'var(--bg-muted)',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      marginBottom: '12px'
                    }}>
                      <div style={{ fontWeight: 700, marginBottom: '6px' }}>Itens:</div>
                      {order.items && order.items.map((it, idx) => (
                        <div key={idx} style={{ marginBottom: '4px' }}>
                          <strong>{it.quantity}x {it.name}</strong>
                          {it.selectedCarnes?.length > 0 && <span> (Carnes: {it.selectedCarnes.join(', ')})</span>}
                          {it.selectedGerais?.length > 0 && <span> (Gerais: {it.selectedGerais.join(', ')})</span>}
                          {it.notes && <span style={{ color: 'var(--primary)' }}> [Obs: {it.notes}]</span>}
                        </div>
                      ))}
                      <div style={{ marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <strong>Pagamento:</strong> {order.payment_method}
                      </div>
                    </div>

                    {/* Status change buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                        Mudar status:
                      </span>
                      {['Recebido', 'Preparando', 'Saiu para entrega', 'Entregue', 'Cancelado'].map((statusOption) => (
                        <button
                          key={statusOption}
                          onClick={() => handleChangeOrderStatus(order.id, statusOption)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-xs)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: order.status === statusOption ? 'var(--text-main)' : '#F3F4F6',
                            color: order.status === statusOption ? '#FFFFFF' : 'var(--text-main)',
                            border: '1px solid var(--border-color)'
                          }}
                        >
                          {statusOption}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: PRODUCTS ================= */}
      {activeTab === 'products' && (
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 className="font-heading" style={{ fontSize: '1.25rem' }}>Itens do Cardápio</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Cadastre e edite marmitas, pratos, bebidas, opcionais e limites.
              </p>
            </div>
            <button
              onClick={() => handleOpenProductModal()}
              className="btn-add-product"
              style={{ padding: '10px 18px', fontSize: '0.9rem' }}
              id="btn-add-new-product"
            >
              <Plus size={18} />
              <span>Novo Produto</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {products.map((prod) => (
              <div 
                key={prod.id} 
                style={{
                  background: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  padding: '16px',
                  display: 'flex',
                  gap: '14px',
                  position: 'relative'
                }}
              >
                <img 
                  src={prod.image || '/images/marmita.jpg'} 
                  alt={prod.name}
                  style={{ width: '85px', height: '85px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                />

                <div style={{ flex: 1 }}>
                  {prod.badge && prod.badge !== 'NENHUM' && (
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      display: 'inline-block',
                      marginBottom: '4px'
                    }}>
                      {prod.badge}
                    </span>
                  )}
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{prod.name}</h4>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    {prod.category} • R$ {Number(prod.price).toFixed(2)}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {prod.description}
                  </p>
                  
                  {prod.carnes_limit > 0 && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600, marginTop: '4px' }}>
                      ✓ Carnes (até {prod.carnes_limit}) • Gerais (até {prod.gerais_limit})
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button
                      onClick={() => handleOpenProductModal(prod)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-xs)',
                        background: 'var(--bg-muted)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Edit3 size={13} />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(prod.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-xs)',
                        background: '#FEE2E2',
                        color: '#B91C1C',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={13} />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: CATEGORIES ================= */}
      {activeTab === 'categories' && (
        <div style={{ padding: '24px', maxWidth: '600px' }}>
          <h3 className="font-heading" style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
            Categorias do Cardápio
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Organize os produtos em categorias fáceis de navegar no topo do cardápio.
          </p>

          <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Nome da nova categoria (ex: Prato principal, Bebidas...)"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <button type="submit" className="btn-add-product" style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}>
              <Plus size={18} />
              <span>Adicionar</span>
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {categories.map((cat) => (
              <div 
                key={cat.id} 
                style={{
                  background: '#FFFFFF',
                  padding: '12px 18px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{cat.name}</span>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  style={{ color: 'var(--danger)', padding: '6px' }}
                  title="Excluir categoria"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: SETTINGS ================= */}
      {activeTab === 'settings' && (
        <div style={{ padding: '24px', maxWidth: '650px' }}>
          <h3 className="font-heading" style={{ fontSize: '1.25rem', marginBottom: '6px' }}>
            Configurações do Restaurante
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Configure o WhatsApp de recebimento, chave PIX, taxa de entrega e tempo estimado.
          </p>

          {settingsSavedMsg && (
            <div style={{
              background: '#DCFCE7',
              color: '#15803D',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <Check size={18} />
              <span>Configurações salvas e sincronizadas com sucesso!</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} style={{ background: '#FFFFFF', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div className="form-group">
              <label className="form-label">Nome da Loja / Restaurante</label>
              <input
                type="text"
                className="form-input"
                value={settingsForm.name}
                onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                id="setting-store-name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tipo de Estabelecimento</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Restaurante, Hamburgueria, Pizzaria..."
                value={settingsForm.business_type}
                onChange={(e) => setSettingsForm({ ...settingsForm, business_type: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                WhatsApp do Restaurante com DDD (Onde os pedidos chegam) *
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: 11999999999"
                value={settingsForm.whatsapp}
                onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                id="setting-whatsapp"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Insira o DDD e o número completo (somente números). Este número será usado no link wa.me.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">
                Chave PIX do Restaurante *
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: seu-email@pix.com, CPF, Celular ou Chave Aleatória"
                value={settingsForm.pix_key}
                onChange={(e) => setSettingsForm({ ...settingsForm, pix_key: e.target.value })}
                id="setting-pix-key"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Mostrada ao cliente no pagamento e enviada no resumo do pedido para o WhatsApp.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Taxa de Entrega Padrão (R$) *</label>
                <input
                  type="number"
                  step="0.50"
                  className="form-input"
                  value={settingsForm.delivery_fee}
                  onChange={(e) => setSettingsForm({ ...settingsForm, delivery_fee: e.target.value })}
                  id="setting-delivery-fee"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tempo Médio de Entrega *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: 35 - 50 min"
                  value={settingsForm.delivery_time}
                  onChange={(e) => setSettingsForm({ ...settingsForm, delivery_time: e.target.value })}
                  id="setting-delivery-time"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Endereço do Restaurante (para impressão no cupom)</label>
              <input
                type="text"
                className="form-input"
                value={settingsForm.address || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="btn-primary-block"
              style={{ marginTop: '16px' }}
              id="btn-save-settings"
            >
              <span>Salvar Configurações</span>
            </button>
          </form>
        </div>
      )}

      {/* ================= MODAL: ADD/EDIT PRODUCT ================= */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '650px' }}
          >
            <div className="modal-header">
              <h3 className="font-heading" style={{ fontSize: '1.2rem' }}>
                {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <button className="btn-close-modal" onClick={() => setShowProductModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="modal-body">
              <div className="form-group">
                <label className="form-label">Nome do Produto *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="Ex: Marmita grande"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  id="input-prod-name"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Categoria *</label>
                  <select
                    className="form-input"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Preço (R$) *</label>
                  <input
                    type="number"
                    step="0.50"
                    required
                    className="form-input"
                    placeholder="Ex: 20.00"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    id="input-prod-price"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descrição</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Ex: Escolha 2 tipos de carne e mais 4 opções gerais..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">URL ou Caminho da Imagem</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="/images/marmita.jpg ou link da imagem"
                    value={productForm.image}
                    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Destaque</label>
                  <select
                    className="form-input"
                    value={productForm.badge}
                    onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })}
                  >
                    <option value="NENHUM">Nenhum</option>
                    <option value="MAIS PEDIDO">Mais Pedido</option>
                    <option value="NOVO">Novo</option>
                    <option value="PROMOÇÃO">Promoção</option>
                  </select>
                </div>
              </div>

              {/* OPÇÃO DE CARNES E LIMITE */}
              <div style={{
                background: 'var(--bg-muted)',
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    🥩 Opcionais Tipo: Carnes
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Limite:</span>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      style={{ width: '60px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontWeight: 700 }}
                      value={productForm.carnes_limit}
                      onChange={(e) => setProductForm({ ...productForm, carnes_limit: e.target.value })}
                    />
                  </div>
                </div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Separados por vírgula: Carne cozida, Frango assado, Churrasco..."
                  value={productForm.carnes_options_str}
                  onChange={(e) => setProductForm({ ...productForm, carnes_options_str: e.target.value })}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Deixe limite 0 caso o produto não possua carnes para escolher.
                </span>
              </div>

              {/* OPÇÃO DE GERAIS E LIMITE */}
              <div style={{
                background: 'var(--bg-muted)',
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    🥗 Opcionais Tipo: Gerais
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Limite:</span>
                    <input
                      type="number"
                      min={0}
                      max={15}
                      style={{ width: '60px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontWeight: 700 }}
                      value={productForm.gerais_limit}
                      onChange={(e) => setProductForm({ ...productForm, gerais_limit: e.target.value })}
                    />
                  </div>
                </div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Separados por vírgula: Arroz, Feijão, Salada, Farofa, Verdura..."
                  value={productForm.gerais_options_str}
                  onChange={(e) => setProductForm({ ...productForm, gerais_options_str: e.target.value })}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Deixe limite 0 caso o produto não possua opções gerais.
                </span>
              </div>

              <div className="modal-footer" style={{ padding: '12px 0 0' }}>
                <button type="submit" className="btn-primary-block" id="btn-save-product-submit">
                  <span>{editingProduct ? 'Atualizar Produto' : 'Cadastrar Produto'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
