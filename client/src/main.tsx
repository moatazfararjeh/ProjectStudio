import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ConfigProvider } from 'antd';
import arEG from 'antd/locale/ar_EG';
import enUS from 'antd/locale/en_US';
import './lib/i18n';
import './index.css';
import './styles/modern.css';
import App from './App.tsx';
import { useAppStore } from './stores/appStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Root() {
  const language = useAppStore((state) => state.language);
  const theme = useAppStore((state) => state.theme);

  // Set initial direction
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = language;

  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ConfigProvider
            locale={language === 'ar' ? arEG : enUS}
            direction={language === 'ar' ? 'rtl' : 'ltr'}
            theme={{
              token: {
                colorPrimary: '#667eea',
                colorSuccess: '#52c41a',
                colorWarning: '#faad14',
                colorError: '#ff4d4f',
                colorInfo: '#1890ff',
                borderRadius: 12,
                borderRadiusLG: 16,
                borderRadiusSM: 8,
                fontSize: 14,
                fontSizeHeading1: 32,
                fontSizeHeading2: 28,
                fontSizeHeading3: 24,
                lineHeight: 1.5715,
                controlHeight: 40,
                controlHeightLG: 48,
                controlHeightSM: 32,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                boxShadowSecondary: '0 4px 12px rgba(0, 0, 0, 0.08)',
              },
              components: {
                Layout: {
                  headerBg: 'rgba(255, 255, 255, 0.98)',
                  siderBg: 'linear-gradient(180deg, #1e1e2e 0%, #2d2d44 100%)',
                  bodyBg: '#f0f2f5',
                },
                Card: {
                  borderRadiusLG: 16,
                  boxShadowTertiary: '0 2px 8px rgba(0, 0, 0, 0.04)',
                },
                Button: {
                  borderRadiusLG: 12,
                  controlHeight: 40,
                  fontWeight: 600,
                },
                Input: {
                  borderRadius: 12,
                  controlHeight: 40,
                },
                Select: {
                  borderRadius: 12,
                  controlHeight: 40,
                },
                Table: {
                  borderRadiusLG: 16,
                  headerBg: 'rgba(102, 126, 234, 0.1)',
                },
                Modal: {
                  borderRadiusLG: 20,
                },
                Tag: {
                  borderRadiusSM: 8,
                },
              },
            }}
          >
            <App />
          </ConfigProvider>
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </StrictMode>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);
