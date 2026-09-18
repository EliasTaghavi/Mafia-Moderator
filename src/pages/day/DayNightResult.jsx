import React from 'react';
import { Card, Typography, Tag, Button, Space, Alert, Divider } from 'antd';
import { SunOutlined, MessageOutlined, TrophyOutlined } from '@ant-design/icons';
import { checkWinner, computeRoundOrder } from '../../gameLogic';
import { DAY_STAGES, useGame } from '../../store';

const { Title, Text } = Typography;

export default function DayNightResult() {
  const { game, update, resetGame } = useGame();
  const { players, history, nightNumber } = game;
  const lastNight = history[history.length - 1];
  const winner = checkWinner(players);

  const startDiscussion = () => {
    update((g) => ({
      ...g,
      day: {
        ...g.day,
        stage: DAY_STAGES.DISCUSSION,
        order: computeRoundOrder(g.players, g.currentRoundStarterId),
        turnIndex: 0,
        turnSubStage: 'challenge',
        challengedIds: [],
        challengeLog: [],
      },
    }));
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <Title level={3} style={{ textAlign: 'center' }}>
        <SunOutlined /> خلاصه‌ی صبح — بعد از شب {nightNumber}
      </Title>

      <Card title="اتفاقات دیشب (برای اعلام به بازیکنان)" style={{ marginBottom: 16 }}>
        {lastNight && lastNight.deaths.length > 0 ? (
          <Space orientation="vertical" size={4} style={{ width: '100%' }} separator={<Divider style={{ margin: '4px 0' }} />}>
            {lastNight.deaths.map((d, idx) => (
              <div key={idx}>
                <Text strong>{d.name}</Text>
                <Text type="secondary" style={{ marginInlineStart: 8 }}>
                  ({d.cause})
                </Text>
              </div>
            ))}
          </Space>
        ) : (
          <Alert type="success" showIcon title="دیشب هیچ‌کس کشته نشد." />
        )}
        {lastNight?.toughSaved && (
          <Alert
            style={{ marginTop: 8 }}
            type="warning"
            showIcon
            title={`${lastNight.toughSaved.name} هدف مافیا بود اما به‌خاطر جان‌سختی زنده ماند (این محافظت دیگر برای او تکرار نمی‌شود).`}
          />
        )}
        {lastNight?.toughInquiryResult && (
          <Alert
            style={{ marginTop: 8 }}
            type="info"
            showIcon
            title="نتیجه‌ی استعلام جان‌سخت (این فقط برای اعلام عمومی به همه است، نه نام و نقش کسی)"
            description={`تعداد افراد خارج‌شده تا این لحظه — تیم مافیا: ${lastNight.toughInquiryResult.mafia} نفر | تیم شهروند: ${lastNight.toughInquiryResult.citizen} نفر`}
          />
        )}
      </Card>

      {winner && (
        <Alert
          style={{ marginBottom: 16 }}
          type={winner === 'mafia' ? 'error' : 'success'}
          showIcon
          icon={<TrophyOutlined />}
          title={
            winner === 'mafia' ? 'بازی تمام شد: مافیا برنده شد! 🔴' : 'بازی تمام شد: شهروندان برنده شدند! 🔵'
          }
        />
      )}

      <Card title="وضعیت فعلی بازیکنان" style={{ marginBottom: 16 }}>
        <Space wrap>
          {players.map((p) => (
            <Tag key={p.id} color={p.alive ? 'green' : 'default'}>
              {p.name} {p.alive ? '' : '(حذف شده)'}
            </Tag>
          ))}
        </Space>
      </Card>

      {winner ? (
        <Button danger size="large" block onClick={resetGame}>
          بازی جدید
        </Button>
      ) : (
        <Button type="primary" size="large" block icon={<MessageOutlined />} onClick={startDiscussion}>
          شروع بحث و صحبت‌های روز
        </Button>
      )}
    </div>
  );
}
