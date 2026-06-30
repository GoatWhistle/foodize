import { Plus, Tag, Trash, X } from '@phosphor-icons/react';
import EmptyState from '../../../components/ui/EmptyState';
import { CATEGORY_RU } from '../../../utils/locales';

const ListSkeleton = ({ rows = 3 }) => (
  <div style={{ display: 'grid', gap: 10 }}>
    {Array.from({ length: rows }).map((_, index) => (
      <div
        key={index}
        className="skeleton"
        style={{ height: 64, borderRadius: 'var(--radius-md)' }}
      />
    ))}
  </div>
);

const getPromoConditionLabels = (promo) => {
  const labels = [];
  if (promo.first_order_only) labels.push('только первый заказ');
  if (promo.min_order_amount) labels.push(`от ${promo.min_order_amount} ₽`);
  if (promo.menu_category) {
    labels.push(CATEGORY_RU[promo.menu_category] || promo.menu_category);
  }
  return labels;
};

export default function VendorPromosTab({
  selectedRestaurant,
  promosList,
  promosLoading,
  promosError,
  promosSuccess,
  showPromoForm,
  setShowPromoForm,
  promoForm,
  setPromoForm,
  promoFormLoading,
  deactivatingPromo,
  handleCreatePromo,
  handleDeactivatePromo,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Промокоды</span>
        {selectedRestaurant && (
          <button
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32 }}
            onClick={() => setShowPromoForm((v) => !v)}
          >
            <Plus size={14} />
            Создать
          </button>
        )}
      </div>

      {promosError && <div className="form-error">{promosError}</div>}
      {promosSuccess && (
        <div style={{ color: 'var(--color-success)', marginBottom: 8 }}>{promosSuccess}</div>
      )}

      {showPromoForm && selectedRestaurant && (
        <form
          onSubmit={handleCreatePromo}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 4 }}>
            Новый промокод
          </div>
          <input
            className="form-input"
            placeholder="Код (напр. SAVE20)"
            value={promoForm.code}
            onChange={(e) => setPromoForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            required
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <select
              className="form-input"
              value={promoForm.discount_type}
              onChange={(e) => setPromoForm((f) => ({ ...f, discount_type: e.target.value }))}
            >
              <option value="PERCENT">% Процент</option>
              <option value="FIXED">₽ Фиксированный</option>
            </select>
            <input
              className="form-input"
              type="number"
              placeholder={promoForm.discount_type === 'PERCENT' ? 'Скидка %' : 'Сумма ₽'}
              min={1}
              value={promoForm.discount_value}
              onChange={(e) => setPromoForm((f) => ({ ...f, discount_value: e.target.value }))}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input
              className="form-input"
              type="number"
              placeholder="Макс. использований (не обяз.)"
              min={1}
              value={promoForm.max_uses}
              onChange={(e) => setPromoForm((f) => ({ ...f, max_uses: e.target.value }))}
            />
            <input
              className="form-input"
              type="datetime-local"
              placeholder="Истекает (не обяз.)"
              value={promoForm.expires_at}
              onChange={(e) => setPromoForm((f) => ({ ...f, expires_at: e.target.value }))}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input
              className="form-input"
              type="number"
              placeholder="Мин. сумма (не обяз.)"
              min={1}
              value={promoForm.min_order_amount}
              onChange={(e) => setPromoForm((f) => ({ ...f, min_order_amount: e.target.value }))}
            />
            <select
              className="form-input"
              value={promoForm.menu_category}
              onChange={(e) => setPromoForm((f) => ({ ...f, menu_category: e.target.value }))}
            >
              <option value="">Все категории</option>
              {Object.entries(CATEGORY_RU).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', marginBottom: 4 }}>
            <input
              type="checkbox"
              checked={promoForm.first_order_only}
              onChange={(e) => setPromoForm((f) => ({ ...f, first_order_only: e.target.checked }))}
            />
            Только для первого заказа
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary btn-sm"
              type="submit"
              disabled={promoFormLoading}
              style={{ flex: 1 }}
            >
              {promoFormLoading ? 'Создаю...' : 'Создать'}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              type="button"
              onClick={() => setShowPromoForm(false)}
            >
              <X size={14} />
            </button>
          </div>
        </form>
      )}

      {promosLoading && promosList.length === 0 ? (
        <ListSkeleton rows={3} />
      ) : promosList.length === 0 ? (
        <EmptyState
          icon={<Tag size={36} />}
          title="Нет промокодов"
          subtitle="Создайте первый промокод для скидки клиентам"
        />
      ) : (
        <div className={promosLoading ? 'loading-dim' : undefined}>
          {promosList.map((promo) => {
            const conditionLabels = getPromoConditionLabels(promo);
            return (
              <div
                key={promo.id}
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${promo.is_active ? 'var(--border)' : 'var(--border-faint, var(--border))'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  opacity: promo.is_active ? 1 : 0.5,
                }}
              >
                <Tag
                  size={18}
                  weight="bold"
                  color={promo.is_active ? 'var(--fire)' : 'var(--text-3)'}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontWeight: 800, fontSize: '0.95rem', fontFamily: 'monospace' }}
                  >
                    {promo.code}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 2 }}>
                    {promo.discount_type === 'PERCENT'
                      ? `${promo.discount_value}%`
                      : `${promo.discount_value} ₽`}
                    {' • '}
                    {promo.used_count}/{promo.max_uses ?? '∞'} исп.
                    {promo.expires_at
                      ? ` • до ${new Date(promo.expires_at).toLocaleDateString()}`
                      : ''}
                  </div>
                  {conditionLabels.length > 0 && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 4 }}>
                      Условия: {conditionLabels.join(' • ')}
                    </div>
                  )}
                </div>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '100px',
                    background: promo.is_active ? 'rgba(34,197,94,0.12)' : 'rgba(107,114,128,0.12)',
                    color: promo.is_active ? '#22c55e' : '#6b7280',
                    border: `1px solid ${promo.is_active ? 'rgba(34,197,94,0.3)' : 'rgba(107,114,128,0.2)'}`,
                  }}
                >
                  {promo.is_active ? 'Активен' : 'Завершён'}
                </span>
                {promo.is_active && (
                  <button
                    className="btn-icon-sm danger"
                    disabled={deactivatingPromo === promo.code}
                    onClick={() => handleDeactivatePromo(promo.code)}
                    title="Деактивировать"
                  >
                    <Trash size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
