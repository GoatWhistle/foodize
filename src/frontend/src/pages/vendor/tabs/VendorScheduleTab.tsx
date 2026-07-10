import type { Dispatch, SetStateAction } from 'react';
import { WEEKDAYS_SHORT_RU } from '@shared/utils/datetime';
import type { WorkingHoursRow } from '../hooks/useVendorRestaurants';

interface ListSkeletonProps {
  rows?: number;
}

interface VendorScheduleTabProps {
  workingHours: WorkingHoursRow[];
  setWorkingHours: Dispatch<SetStateAction<WorkingHoursRow[]>>;
  workingHoursLoading: boolean;
  workingHoursSaved: boolean;
  workingHoursError: string;
  handleSaveWorkingHours: () => void;
}

const ListSkeleton = ({ rows = 3 }: ListSkeletonProps) => (
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

export default function VendorScheduleTab({
  workingHours,
  setWorkingHours,
  workingHoursLoading,
  workingHoursSaved,
  workingHoursError,
  handleSaveWorkingHours,
}: VendorScheduleTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Расписание работы</span>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleSaveWorkingHours}
          disabled={workingHoursLoading}
        >
          {workingHoursSaved
            ? 'Сохранено'
            : workingHoursLoading
              ? 'Сохранение...'
              : 'Сохранить'}
        </button>
      </div>

      {workingHoursError && <div className="form-error">{workingHoursError}</div>}

      {workingHoursLoading && workingHours.length === 0 ? (
        <ListSkeleton rows={7} />
      ) : (
        <div
          className={workingHoursLoading ? 'loading-dim' : undefined}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
          }}
        >
          {workingHours.map((row, idx) => (
            <div
              key={row.day_of_week}
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr 1fr auto',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                borderBottom: idx < workingHours.length - 1 ? '1px solid var(--border)' : 'none',
                opacity: row.is_closed ? 0.45 : 1,
              }}
            >
              <span
                style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-2)' }}
              >
                {WEEKDAYS_SHORT_RU[row.day_of_week]}
              </span>
              <input
                className="form-input"
                type="time"
                value={row.open_time}
                disabled={row.is_closed}
                onChange={(e) =>
                  setWorkingHours((prev) =>
                    prev.map((r, i) => (i === idx ? { ...r, open_time: e.target.value } : r))
                  )
                }
                style={{ padding: '6px 8px', fontSize: '0.85rem' }}
              />
              <input
                className="form-input"
                type="time"
                value={row.close_time}
                disabled={row.is_closed}
                onChange={(e) =>
                  setWorkingHours((prev) =>
                    prev.map((r, i) => (i === idx ? { ...r, close_time: e.target.value } : r))
                  )
                }
                style={{ padding: '6px 8px', fontSize: '0.85rem' }}
              />
              <label className="form-check" style={{ margin: 0, whiteSpace: 'nowrap' }} title="Выходной">
                <input
                  type="checkbox"
                  checked={row.is_closed}
                  onChange={(e) =>
                    setWorkingHours((prev) =>
                      prev.map((r, i) =>
                        i === idx ? { ...r, is_closed: e.target.checked } : r
                      )
                    )
                  }
                />
                <span className="form-check-label" style={{ fontSize: '0.75rem' }}>
                  Вых.
                </span>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
