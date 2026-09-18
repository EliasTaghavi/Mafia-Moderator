import React from 'react';
import { Card, Typography, Space, Alert, Steps } from 'antd';
import { SoundOutlined } from '@ant-design/icons';
import { DAY_STAGES, useGame } from '../../store';
import CountdownTimer from './CountdownTimer';

const { Title, Text } = Typography;

export default function DayDefense() {
  const { game, update } = useGame();
  const { day, settings } = game;
  const { defendants, defenseIndex } = day;
  const speakSeconds = settings?.speakSeconds || 60;

  const current = defendants[defenseIndex];

  const finishDefense = () => {
    const nextIndex = defenseIndex + 1;
    if (nextIndex >= defendants.length) {
      update((g) => ({ ...g, day: { ...g.day, stage: DAY_STAGES.FINAL_VOTE } }));
    } else {
      update((g) => ({ ...g, day: { ...g.day, defenseIndex: nextIndex } }));
    }
  };

  if (!current) return null;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <Title level={3} style={{ textAlign: 'center' }}>
        🛡️ دفاعیه — نفر {defenseIndex + 1} از {defendants.length}
      </Title>

      {defendants.length > 1 && (
        <Steps
          current={defenseIndex}
          size="small"
          items={defendants.map((d) => ({ title: d.name }))}
          style={{ marginBottom: 24, overflowX: 'auto' }}
        />
      )}

      <Alert
        style={{ marginBottom: 16 }}
        type="warning"
        showIcon
        title={`${current.name} با ${current.votes} رای وارد دفاعیه شده و باید از خودش دفاع کند.`}
        description="ترتیب دفاعیه از بیشترین به کمترین رایِ دور اول است."
      />

      <Card style={{ textAlign: 'center', marginBottom: 16 }}>
        <Text type="secondary">نوبت دفاعیه</Text>
        <Title level={2} style={{ margin: '4px 0' }}>
          {current.name}
        </Title>
      </Card>

      <Card>
        <Space orientation="vertical" style={{ width: '100%' }} size="middle">
          <Alert type="success" showIcon icon={<SoundOutlined />} title={`زمان دفاعیه‌ی ${current.name}:`} />
          <CountdownTimer
            key={`defense-${current.id}`}
            totalSeconds={speakSeconds}
            onFinish={finishDefense}
            color="#389e0d"
            finishLabel="پایان دفاعیه"
          />
        </Space>
      </Card>
    </div>
  );
}
