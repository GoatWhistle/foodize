export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 17) return 'Добрый день';
  return 'Добрый вечер';
}

export function isRestaurantOpen(restaurant: { is_open?: boolean | null } | null | undefined): boolean {
  return restaurant?.is_open !== false;
}
