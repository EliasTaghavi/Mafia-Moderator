import React from 'react';
import { Card, Typography, Table, Tag, Space, Button, Alert } from 'antd';
import { MoonOutlined, TrophyOutlined } from '@ant-design/icons';
import { checkWinner } from '../../gameLogic';
import { PHASES, DAY_KINDS, useGame } from '../../store';

const { Title, Text } = Typography;

export default function DayResults() {
  const { game, update, resetGame } = useGame();
  const { players, day } = game;
  const { votes, eliminatedName, tie, kind } = day;

  const alivePlayers = players.filter((p) => p.alive || p.id === day.eliminatedId);
  const rows = alivePlayers
    .map((p) => ({ key: p.id, name: p.name, votes: votes[p.id] || 0 }))
    .sort((a, b) => b.votes - a.votes);

  const winner = checkWinner(players);

  const nextStepConfig = {
    [DAY_KINDS.BLIND]: {
      label: 'شروع شب معارفه',
      go: (g) => ({ ...g, phase: PHASES.NIGHT, nightNumber: 0, nightStepIndex: 0, nightActions: {} }),
    },
    [DAY_KINDS.POST_INTRO]: {
      label: 'شروع شب اول',
      go: (g) => ({ ...g, phase: PHASES.NIGHT, nightNumber: 1, nightStepIndex: 0, nightActions: {} }),
    },
    [DAY_KINDS.REGULAR]: {
      label: 'شروع شب بعد',
      go: (g) => ({
        ...g,
        phase: PHASES.NIGHT,
        nightNumber: g.nightNumber + 1,
        nightStepIndex: 0,
        nightActions: {},
      }),
    },
  };
  const { label: nextLabel, go: nextGo } = nextStepConfig[kind || DAY_KINDS.REGULAR];

  const startNextStep = () => update(nextGo);

  const columns = [
    { title: 'بازیکن', dataIndex: 'name', key: 'name' },
    { title: 'تعداد رای', dataIndex: 'votes', key: 'votes' },
  ];

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <Title level={3} style={{ textAlign: 'center' }}>
        📢 نتیجه‌ی روز
      </Title>

      <Card title="جدول رای‌گیری" style={{ marginBottom: 16 }}>
        <Table columns={columns} dataSource={rows} pagination={false} size="small" />
      </Card>

      {eliminatedName ? (
        <Alert
          style={{ marginBottom: 16 }}
          type="error"
          showIcon
          title={`${eliminatedName} با رای اکثریت از بازی حذف شد.`}
        />
      ) : (
        <Alert
          style={{ marginBottom: 16 }}
          type="info"
          showIcon
          title={tie ? 'به‌دلیل تساوی، امروز کسی حذف نشد.' : 'امروز کسی با رای حذف نشد.'}
        />
      )}

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
        <Button type="primary" size="large" block icon={<MoonOutlined />} onClick={startNextStep}>
          {nextLabel}
        </Button>
      )}
    </div>
  );
}
