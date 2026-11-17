import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, Outlet, RouterProvider, ScrollRestoration } from 'react-router';
import { ApiError } from '../lib/api';
import { ToastProvider } from '../ui/Toast';
import { ContactPage } from '../features/contacts/ContactPage';
import { ContactsPage } from '../features/contacts/ContactsPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { DealPage } from '../features/deals/DealPage';
import { DealsPage } from '../features/deals/DealsPage';
import { OrganizationPage } from '../features/organizations/OrganizationPage';
import { OrganizationsPage } from '../features/organizations/OrganizationsPage';
import { PipelinePage } from '../features/pipeline/PipelinePage';
import styles from './App.module.css';
import { TopBar } from './TopBar';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10_000,
        // A missing record won't appear by asking again.
        retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2,
        refetchOnWindowFocus: false,
      },
    },
  });
}

function Layout() {
  return (
    <>
      <TopBar />
      <main className={styles.main}>
        <Outlet />
      </main>
      <ScrollRestoration />
    </>
  );
}

function NotFound() {
  return (
    <p className={styles.notFound}>
      There's nothing here. Use the tabs above to find your way back.
    </p>
  );
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/pipeline', element: <PipelinePage /> },
      { path: '/deals', element: <DealsPage /> },
      { path: '/deals/:id', element: <DealPage /> },
      { path: '/organizations', element: <OrganizationsPage /> },
      { path: '/organizations/:id', element: <OrganizationPage /> },
      { path: '/contacts', element: <ContactsPage /> },
      { path: '/contacts/:id', element: <ContactPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

const queryClient = makeQueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  );
}
