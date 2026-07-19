export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Доброй ночи';
  if (hour < 12) return 'Доброе утро';
  if (hour < 17) return 'Добрый день';
  return 'Добрый вечер';
}

export function isRestaurantOpen(restaurant: { is_open?: boolean | null } | null | undefined): boolean {
  return restaurant?.is_open !== false;
}

export interface WorkingHoursSource {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export interface InfoWorkingHour {
  day_of_week: number;
  is_open: boolean;
  opening_time: string;
  closing_time: string;
}

export function toInfoWorkingHours(workingHours: readonly WorkingHoursSource[]): InfoWorkingHour[] {
  return workingHours.map((hours) => ({
    day_of_week: hours.day_of_week,
    is_open: !hours.is_closed,
    opening_time: hours.open_time,
    closing_time: hours.close_time,
  }));
}
