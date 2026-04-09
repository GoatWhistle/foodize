import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/auth/LoginPage';
import { ROUTES } from './constants/routes';

const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <div>Home Page - Welcome to Foodize</div>,
      },
      {
        path: ROUTES.LOGIN,
        element: <LoginPage />,
      },
      {
        path: ROUTES.REGISTER,
        element: <div>Register Page Placeholder</div>,
      },
      {
        path: ROUTES.RESTAURANTS,
        element: <div>Restaurants List Placeholder</div>,
      },
      {
        path: ROUTES.ORDERS,
        element: <div>Orders Placeholder</div>,
      },
    ],
  },
  {
    path: '*',
    element: <div>404 Not Found</div>,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

