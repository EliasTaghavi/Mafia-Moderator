import React, { useState } from 'react';
import { Button, Typography, Card, Tag } from 'antd';
import { EyeInvisibleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { ROLES } from '../roles';
import { PHASES, DAY_KINDS, buildDiscussionDay, useGame } from '../store';

const { Title, Paragraph, Text } = Typography;

export default function RoleReveal() {
  const { game, update } = useGame();
  const [revealed, setRevealed] = useState(false);

  const { players, revealIndex, settings } = game;
  const current = players[revealIndex];

  if (!current) {
    // همه دیده‌اند -> برو به کنسول شب
    update((g) => ({ ...g, phase: PHASES.NIGHT, nightNumber: 0 }));
    return null;
  }

  const role = ROLES[current.roleId];
  const isLast = revealIndex === players.length - 1;

  const goNext = () => {
    setRevealed(false);
    if (isLast) {
      if (settings?.blindDayEnabled) {
        // روز کوری قبل از شب معارفه، چون مافیا هنوز یکدیگر را نمی‌شناسند
        update((g) => ({
          ...g,
          phase: PHASES.DAY,
          nightNumber: 0,
          day: buildDiscussionDay(g.players, DAY_KINDS.BLIND, g.currentRoundStarterId),
        }));
      } else {
        update((g) => ({ ...g, phase: PHASES.NIGHT, nightNumber: 0 }));
      }
    } else {
      update((g) => ({ ...g, revealIndex: g.revealIndex + 1 }));
    }
  };

  if (!revealed) {
    return (
      <div style={centerStyle}>
        <Card style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <Title level={4}>گوشی را به دست بدهید 📱</Title>
          <Paragraph style={{ fontSize: 18 }}>
            آیا شما <Text strong>{current.name}</Text> هستید؟
          </Paragraph>
          <Paragraph type="secondary">
            بازیکن {revealIndex + 1} از {players.length}
          </Paragraph>
          <Button type="primary" size="large" block onClick={() => setRevealed(true)}>
            بله، نقشم را نشان بده
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={centerStyle}>
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          textAlign: 'center',
          borderColor: role.color,
          borderWidth: 2,
        }}
      >
        <Tag color={role.team === 'mafia' ? 'red' : 'blue'} style={{ marginBottom: 12 }}>
          {role.team === 'mafia' ? 'تیم مافیا' : 'تیم شهروندان'}
        </Tag>
        <div style={{ fontSize: 90, lineHeight: 1.1 }}>{role.icon}</div>
        <Title level={2} style={{ color: role.color, marginTop: 8 }}>
          {role.name}
        </Title>
        <Paragraph style={{ fontSize: 16, marginTop: 12 }}>{role.desc}</Paragraph>
        <Button
          size="large"
          block
          icon={isLast ? <ArrowLeftOutlined /> : <EyeInvisibleOutlined />}
          onClick={goNext}
          style={{ marginTop: 8 }}
        >
          {isLast ? (settings?.blindDayEnabled ? 'همه دیدند؛ برو به روز کوری' : 'همه دیدند؛ برو به شب معارفه') : 'مخفی کن و به نفر بعد بده'}
        </Button>
      </Card>
    </div>
  );
}

const centerStyle = {
  minHeight: '80vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
};
