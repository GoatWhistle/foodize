import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useRestaurantStore } from "../../store/useRestaurantStore";
import { useOrderStore } from "../../store/useOrderStore";
import MenuItemCard from "../../components/ui/MenuItemCard";
import CartDrawer from "../../components/ui/CartDrawer";
import EmptyState from "../../components/ui/EmptyState";
import { ROUTES } from "../../constants/routes";

const CATEGORY_EMOJI = {
  SHAURMA: "🌯",
  BURGER: "🍔",
  PIZZA: "🍕",
  SUSHI: "🍣",
};

const RestaurantPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const restaurant = location.state?.restaurant || {
    id,
    name: "Ресторан",
    address: "",
  };

  const { fetchMenu, menus, loading } = useRestaurantStore();
  const { addToCart, cartCount, cartTotal } = useOrderStore();
  const count = useOrderStore((s) => s.cartCount());
  const total = useOrderStore((s) => s.cartTotal());

  const [cartOpen, setCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("ALL");

  const menuItems = menus[id] || [];

  useEffect(() => {
    fetchMenu(id);
  }, [id, fetchMenu]);

  const categories = [
    "ALL",
    ...new Set(menuItems.map((i) => i.category).filter(Boolean)),
  ];

  const filtered =
    activeCategory === "ALL"
      ? menuItems
      : menuItems.filter((i) => i.category === activeCategory);

  const handleAdd = (item) => {
    addToCart(item, id);
  };

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const { placeOrder } = useOrderStore();

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    setCheckoutError("");
    try {
      const order = await placeOrder();
      setCartOpen(false);
      navigate(ROUTES.ORDER_STATUS.replace(":id", order.id));
    } catch (err) {
      setCheckoutError(
        err.response?.data?.detail || "Не удалось разместить заказ",
      );
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="page-enter">
      {/* Hero */}
      <div className="restaurant-hero">
        {restaurant.photo_url ? (
          <img
            className="restaurant-hero-img"
            src={restaurant.photo_url}
            alt={restaurant.name}
            style={{ viewTransitionName: `restaurant-image-${id}` }}
          />
        ) : (
          <div className="restaurant-hero-placeholder">
            {CATEGORY_EMOJI[restaurant.category] || "🍽️"}
          </div>
        )}
        <div className="restaurant-hero-overlay" />
        <div className="restaurant-hero-info">
          <h1 className="restaurant-hero-name">{restaurant.name}</h1>
          <div className="card-tags">
            <span className="tag-pill">{restaurant.address}</span>
            <span className="tag-pill orange">~25 мин</span>
          </div>
        </div>
      </div>

      <div className="restaurant-content">
        {/* Category filter */}
        {categories.length > 1 && (
          <div className="menu-categories-scroll">
            {categories.map((cat) => (
              <button
                key={cat}
                id={`menu-cat-${cat.toLowerCase()}`}
                className={`category-chip${activeCategory === cat ? " active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat === "ALL"
                  ? "🍽️ Все"
                  : `${CATEGORY_EMOJI[cat] || ""} ${cat}`}
              </button>
            ))}
          </div>
        )}

        {/* Menu */}
        {loading ? (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="Меню пустое" subtitle="Позиции ещё не добавлены" />
        ) : (
          <div className="menu-list">
            {filtered.map((item) => (
              <MenuItemCard key={item.id} item={item} onAdd={handleAdd} />
            ))}
          </div>
        )}
      </div>

      {/* Cart FAB */}
      {count > 0 && (
        <button
          id="cart-fab-btn"
          className="cart-fab"
          onClick={() => setCartOpen(true)}
          aria-label="Открыть корзину"
        >
          <span className="cart-badge">{count}</span>
          Корзина
          <span style={{ marginLeft: "auto", fontWeight: 800 }}>{total} ₽</span>
        </button>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <CartDrawer
          onClose={() => setCartOpen(false)}
          onCheckout={handleCheckout}
          isLoading={checkoutLoading}
          error={checkoutError}
        />
      )}
    </div>
  );
};

export default RestaurantPage;
