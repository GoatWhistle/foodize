# Frontend Audit — остаток

Осталось только требующее твоего решения или осознанно отложенное.

## Требует решения (не выполнял — нужен твой выбор)

- [ ] H3. `AdminResolutionTab.tsx:246` — `forceCancelOrder` вызывается через каст, но HTTP-роута НЕТ. В бэкенде есть несмонтированная сервисная функция `force_cancel_order` (order_status.py:136). Нужен новый роут `POST /admin/orders/{id}/cancel` под админ-пермишном → тогда добавить метод в adminService и убрать каст. **Правка бэкенда — вне scope фронт-аудита, жду решения.**
- [ ] NEW-1. Дрейф статусов заказа: код ссылается на `COOKING`/`PREPARING` (ActiveOrderBanner ACTIVE_STATUSES, orderStatus.ts STATUS_STYLE, ORDER_STATUS_CUSTOMER_RU), но схема `OrderStatus` = PENDING|ACCEPTED|READY|COMPLETED|CANCELLED (без них). Мёртвые ветки ИЛИ бэкенд шлёт их вне типа (WS?). Решить: убрать лишние ИЛИ добавить в схему бэкенда. **Не трогал — возможно рантайм-string-сравнение.**

## Осознанно отложено (низкая отдача / опционально)

- [ ] L2. 106 default-экспортов → именованные. Системное соглашение проекта; кодмод даст огромный diff при низкой отдаче. Делать только пакетно по твоему запросу.
- [ ] L3-remainder. Осталось ~20 JSX-литералов `₽` в компонентах (частью уже заменены на formatPrice в OrderCard/price.ts; в admin/vendor под-компонентах — после M-C4). Мелочь, можно добить точечно.
- [ ] M-C6-tail. KanbanCard/ActiveOrderBanner inline-стили — много условно-динамических (по статусу/срочности), вынос даст мало. Низкий приоритет.
- [ ] L8-remainder. StaffOrder каст (useStaffDashboard.ts:40) — оправдан (Order[]→StaffOrder[] с опц. name).
