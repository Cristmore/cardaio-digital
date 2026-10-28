import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import ProductModal from './components/ProductModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import AdminPanel from './components/AdminPanel';
import ThermalReceipt from './components/ThermalReceipt';
import { dbService } from './services/db';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState({
    name: 'Restaurante Teste',
    business_type: 'Restaurante',
    whatsapp: '11999999999',
    pix_key: '11999999999',
    delivery_fee: 5.00,
    delivery_time: '35 - 50 min',
    primary_color: '#FF5E00',
    secondary_color: '#FFAA00'
  });

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  // UI state
  const [activeCategory, setActiveCategory] = useState('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [deliveryType, setDeliveryType] = useState('ENTREGA');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [thermalOrder, setThermalOrder] = useState(null);

  // Load Initial Data
  const loadInitialData = async () => {
    try {
      const [s, c, p, o] = await Promise.all([
        dbService.getSettings(),
        dbService.getCategories(),
        dbService.getProducts(),
        dbService.getOrders()
      ]);
      setSettings(s);
      setCategories(c);
      setProducts(p);
      setOrders(o);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Filter products by category and search
  const filteredProducts = products.filter((prod) => {
    if (!prod.active && prod.active !== undefined) return false;
    const matchesCategory = activeCategory === 'TODOS' || prod.category === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      prod.name.toLowerCase().includes(q) || 
      (prod.description && prod.description.toLowerCase().includes(q)) ||
      (prod.category && prod.category.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  // Group products by category when 'TODOS' is selected
  const displayedCategories = activeCategory === 'TODOS'
    ? categories.filter(c => products.some(p => p.category === c.name))
    : categories.filter(c => c.name === activeCategory);

  // Add to Cart
  const handleAddToCart = (item) => {
    setCart(prevCart => {
      // Find if exact item already exists
      const existingIdx = prevCart.findIndex(i => 
        i.productId === item.productId &&
        JSON.stringify(i.selectedCarnes) === JSON.stringify(item.selectedCarnes) &&
        JSON.stringify(i.selectedGerais) === JSON.stringify(item.selectedGerais) &&
        i.notes === item.notes
      );

      if (existingIdx >= 0) {
        const copy = [...prevCart];
        copy[existingIdx].quantity += item.quantity;
        return copy;
      }
      return [...prevCart, item];
    });
  };

  // Update Cart Quantity
  const handleUpdateQuantity = (index, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    setCart(prevCart => {
      const copy = [...prevCart];
      copy[index].quantity = newQty;
      return copy;
    });
  };

  // Remove Item
  const handleRemoveItem = (index) => {
    setCart(prevCart => prevCart.filter((_, i) => i !== index));
  };

  // Thermal Print Handler
  const handlePrintOrder = (order) => {
    setThermalOrder(order);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // On successful customer order
  const handleOrderSuccess = (order) => {
    // Automatically print thermal receipt
    handlePrintOrder(order);
    // Clear cart
    setCart([]);
    setIsCartOpen(false);
    // Reload orders for state
    dbService.getOrders().then(setOrders);
  };

  // Total cart calculation
  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const deliveryFee = deliveryType === 'ENTREGA' ? Number(settings.delivery_fee || 0) : 0;
  const subtotalCart = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalCart = subtotalCart + deliveryFee;
  const formattedTotalCart = totalCart.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // If in Admin Mode, render the full admin dashboard
  if (isAdminOpen) {
    return (
      <>
        <AdminPanel
          onClose={() => setIsAdminOpen(false)}
          settings={settings}
          onUpdateSettings={setSettings}
          products={products}
          onReloadProducts={() => dbService.getProducts().then(setProducts)}
          categories={categories}
          onReloadCategories={() => dbService.getCategories().then(setCategories)}
          orders={orders}
          onReloadOrders={() => dbService.getOrders().then(setOrders)}
          onPrintOrder={handlePrintOrder}
        />
        <ThermalReceipt order={thermalOrder} settings={settings} />
      </>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <Header
        settings={settings}
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Menu Content */}
      <main className="menu-section">
        {activeCategory === 'TODOS' ? (
          displayedCategories.map((cat) => {
            const catProds = filteredProducts.filter(p => p.category === cat.name);
            if (catProds.length === 0) return null;

            return (
              <section key={cat.id} style={{ marginBottom: '28px' }}>
                <h2 className="section-title">
                  <span>{cat.name}</span>
                  <span className="count">({catProds.length})</span>
                </h2>
                <div className="products-grid">
                  {catProds.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      onSelect={setSelectedProduct}
                    />
                  ))}
                </div>
              </section>
            );
          })
        ) : (
          <section>
            <h2 className="section-title">
              <span>{activeCategory}</span>
              <span className="count">({filteredProducts.length})</span>
            </h2>
            <div className="products-grid">
              {filteredProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onSelect={setSelectedProduct}
                />
              ))}
            </div>
          </section>
        )}

        {filteredProducts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🔍</div>
            <h3>Nenhum produto encontrado</h3>
            <p style={{ fontSize: '0.85rem' }}>Tente pesquisar com outras palavras ou confira outra categoria.</p>
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar (when cart has items and modals closed) */}
      {cart.length > 0 && !isCartOpen && !isCheckoutOpen && !selectedProduct && (
        <div 
          className="floating-cart-bar" 
          onClick={() => setIsCartOpen(true)}
          id="btn-floating-cart"
        >
          <div className="cart-bar-info">
            <span className="cart-bar-badge">{totalCartItems}</span>
            <div>
              <div className="cart-bar-text">Ver sacola</div>
              <div className="cart-bar-total">{formattedTotalCart}</div>
            </div>
          </div>
          <div className="cart-bar-action">
            <span>Avançar</span>
            <ArrowRight size={16} />
          </div>
        </div>
      )}

      {/* Product Detail & Optionals Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        deliveryType={deliveryType}
        onSetDeliveryType={setDeliveryType}
        settings={settings}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Checkout Modal (Phone with DDD, Customer lookup/edit, Payment, WhatsApp & Thermal Print) */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        deliveryType={deliveryType}
        settings={settings}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Hidden printable thermal receipt */}
      <ThermalReceipt order={thermalOrder} settings={settings} />
    </div>
  );
}
