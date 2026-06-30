const toDateTimeLocalValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

export default function VendorSettingsTab({
  selectedRestaurant,
  editRestaurant,
  setEditRestaurant,
  formError,
  formLoading,
  handleUpdateRestaurant,
}) {
  return (
    <div
      style={{
        padding: 16,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Настройки ресторана</h3>
      <form
        onSubmit={handleUpdateRestaurant}
        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        {formError && <div className="form-error">{formError}</div>}
        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Название</label>
          <input
            className="form-input"
            value={editRestaurant?.name ?? selectedRestaurant.name}
            onChange={(e) =>
              setEditRestaurant({ ...(editRestaurant || selectedRestaurant), name: e.target.value })
            }
          />
        </div>
        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Описание ресторана</label>
          <textarea
            className="form-input"
            placeholder="Краткое описание заведения для посетителей..."
            value={editRestaurant?.description ?? selectedRestaurant.description ?? ''}
            onChange={(e) =>
              setEditRestaurant({
                ...(editRestaurant || selectedRestaurant),
                description: e.target.value,
              })
            }
            rows={3}
            style={{ resize: 'vertical' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Адрес</label>
          <input
            className="form-input"
            value={editRestaurant?.address ?? selectedRestaurant.address}
            onChange={(e) =>
              setEditRestaurant({
                ...(editRestaurant || selectedRestaurant),
                address: e.target.value,
              })
            }
          />
        </div>
        <label className="form-check" style={{ marginTop: 4 }}>
          <input
            type="checkbox"
            checked={editRestaurant?.is_open ?? selectedRestaurant.is_open ?? true}
            onChange={(e) =>
              setEditRestaurant({
                ...(editRestaurant || selectedRestaurant),
                is_open: e.target.checked,
              })
            }
          />
          <span className="form-check-label">Заведение открыто</span>
        </label>
        <label className="form-check">
          <input
            type="checkbox"
            checked={
              editRestaurant?.is_ordering_paused ??
              selectedRestaurant.is_ordering_paused ??
              false
            }
            onChange={(e) =>
              setEditRestaurant({
                ...(editRestaurant || selectedRestaurant),
                is_ordering_paused: e.target.checked,
              })
            }
          />
          <span className="form-check-label">Пауза приёма заказов</span>
        </label>
        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Пауза до</label>
          <input
            className="form-input"
            type="datetime-local"
            value={toDateTimeLocalValue(
              editRestaurant?.ordering_paused_until ?? selectedRestaurant.ordering_paused_until
            )}
            onChange={(e) =>
              setEditRestaurant({
                ...(editRestaurant || selectedRestaurant),
                ordering_paused_until: e.target.value,
              })
            }
          />
        </div>
        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
            Среднее время приготовления, минут
          </label>
          <input
            className="form-input"
            type="number"
            min="1"
            max="240"
            value={
              editRestaurant?.avg_prep_time_minutes ??
              selectedRestaurant.avg_prep_time_minutes ??
              15
            }
            onChange={(e) =>
              setEditRestaurant({
                ...(editRestaurant || selectedRestaurant),
                avg_prep_time_minutes: e.target.value,
              })
            }
          />
        </div>
        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
            Мягкий лимит активных заказов
          </label>
          <input
            className="form-input"
            type="number"
            min="1"
            max="1000"
            placeholder="Без лимита"
            value={
              editRestaurant?.max_active_orders ?? selectedRestaurant.max_active_orders ?? ''
            }
            onChange={(e) =>
              setEditRestaurant({
                ...(editRestaurant || selectedRestaurant),
                max_active_orders: e.target.value,
              })
            }
          />
        </div>
        <label className="form-check">
          <input
            type="checkbox"
            checked={editRestaurant?.is_hiring ?? selectedRestaurant.is_hiring ?? false}
            onChange={(e) =>
              setEditRestaurant({
                ...(editRestaurant || selectedRestaurant),
                is_hiring: e.target.checked,
              })
            }
          />
          <span className="form-check-label">Набор сотрудников</span>
        </label>
        <button type="submit" className="btn btn-primary" disabled={formLoading}>
          Сохранить
        </button>
      </form>
    </div>
  );
}
