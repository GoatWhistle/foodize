import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { OrderStatusPage } from "@shared/pages/OrderStatusPage/OrderStatusPage";
import { createOrderWebSocket } from "./orderStatusPageTestMocks";

export const renderPage = (props = {}) =>
  render(
    <MemoryRouter initialEntries={["/orders/77"]}>
      <Routes>
        <Route
          path="/orders/:id"
          element={<OrderStatusPage createOrderWebSocket={createOrderWebSocket} {...props} />}
        />
      </Routes>
    </MemoryRouter>,
  );
