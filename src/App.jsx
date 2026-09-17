import React from 'react';
import { ConfigProvider, Layout, Typography, Button, theme } from 'antd';
import fa_IR from 'antd/locale/fa_IR';
import { ReloadOutlined } from '@ant-design/icons';
import { PHASES, useGame } from './store';
import Setup from './pages/Setup';
import RoleReveal from './pages/RoleReveal';
import NightConsole from './pages/NightConsole';
import DayFlow from './pages/DayFlow';

const { Header, Content } = Layout;
const { Title } = Typography;

function PhaseRouter() {
  const { game } = useGame();
  switch (game.phase) {
    case PHASES.REVEAL:
      return <RoleReveal />;
    case PHASES.NIGHT:
      return <NightConsole />;
    case PHASES.DAY:
      return <DayFlow />;
    case PHASES.SETUP:
    default:
      return <Setup />;
  }
}

export default function App() {
  const { game, resetGame } = useGame();

  return (
    <ConfigProvider
      direction="rtl"
      locale={fa_IR}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: { colorPrimary: '#8b0000', fontFamily: 'Vazirmatn, Tahoma, sans-serif' },
      }}
    >
      <Layout style={{ minHeight: '100vh' }} dir="rtl">
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
          }}
        >
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            🎭 گرداننده بازی مافیا
          </Title>
          {game.phase !== PHASES.SETUP && (
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => {
                if (window.confirm('بازی فعلی پاک شود و از اول شروع شود؟')) {
                  resetGame();
                }
              }}
            >
              بازی جدید
            </Button>
          )}
        </Header>
        <Content style={{ padding: '16px 8px' }}>
          <PhaseRouter />
        </Content>
      </Layout>
    </ConfigProvider>
  );
}
