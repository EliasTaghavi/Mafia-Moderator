import React, { useMemo, useState } from 'react';
import { Card, Typography, InputNumber, Space, Button, Alert, Row, Col } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { DAY_STAGES, DAY_KINDS, applyElimination, useGame } from '../../store';

const { Title, Text, Paragraph } = Typography;

export default function DayVoting() {
  const { game, update } = useGame();
  const { players, day } = game;
  const alivePlayers = players.filter((p) => p.alive);
  const kind = day.kind || DAY_KINDS.REGULAR;
  const votingTitle =
    kind === DAY_KINDS.BLIND
      ? '🗳️ رای‌گیری روز کوری'
      : kind === DAY_KINDS.POST_INTRO
        ? '🗳️ رای‌گیری بعد از شب معارفه'
        : '🗳️ رای‌گیری روز';

  // نصاب ورود به دفاعیه: سقفِ نصفِ تعداد افراد زنده (قدر مطلق نصف)
  const threshold = Math.ceil(alivePlayers.length / 2);

  const [votes, setVotes] = useState(() =>
    Object.fromEntries(alivePlayers.map((p) => [p.id, 0]))
  );

  const defendants = useMemo(
    () =>
      alivePlayers
        .filter((p) => (votes[p.id] || 0) >= threshold)
        .sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0))
        .map((p) => ({ id: p.id, name: p.name, votes: votes[p.id] || 0 })),
    [votes, alivePlayers, threshold]
  );

  const handleVoteChange = (id, value) => {
    setVotes({ ...votes, [id]: value ?? 0 });
  };

  const finalize = () => {
    const votesTally = alivePlayers.map((p) => ({ name: p.name, votes: votes[p.id] || 0 }));

    if (defendants.length === 0) {
      // هیچ‌کس به نصاب دفاعیه نرسید -> امروز کسی حذف نمی‌شود
      update((g) => applyElimination(g, { eliminatedId: null, votesTally, tie: false }));
      return;
    }

    update((g) => ({
      ...g,
      day: {
        ...g.day,
        stage: DAY_STAGES.DEFENSE,
        votes,
        threshold,
        defendants,
        defenseIndex: 0,
        finalVotes: {},
      },
    }));
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <Title level={3} style={{ textAlign: 'center' }}>
        {votingTitle}
      </Title>
      <Paragraph type="secondary" style={{ textAlign: 'center' }}>
        برای هر بازیکن، تعداد رای‌هایی که از بقیه گرفته را وارد کنید.
      </Paragraph>

      <Alert
        style={{ marginBottom: 16 }}
        type="info"
        showIcon
        title={`نصاب ورود به دفاعیه: ${threshold} رای (نصفِ ${alivePlayers.length} نفرِ زنده، به بالا گرد شده)`}
      />

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]}>
          {alivePlayers.map((p) => (
            <Col xs={12} sm={8} key={p.id}>
              <Space orientation="vertical" size={2} style={{ width: '100%' }}>
                <Text>{p.name}</Text>
                <InputNumber
                  min={0}
                  max={alivePlayers.length}
                  value={votes[p.id]}
                  onChange={(v) => handleVoteChange(p.id, v)}
                  style={{ width: '100%' }}
                />
              </Space>
            </Col>
          ))}
        </Row>
      </Card>

      {defendants.length > 0 && (
        <Alert
          style={{ marginBottom: 16 }}
          type="warning"
          showIcon
          title={`وارد دفاعیه شدند: ${defendants.map((d) => `${d.name} (${d.votes} رای)`).join('، ')}`}
        />
      )}

      <Button type="primary" size="large" block icon={<CheckCircleOutlined />} onClick={finalize}>
        {defendants.length > 0 ? 'ثبت رای‌ها و شروع دفاعیه' : 'ثبت نهایی رای‌گیری و مشاهده‌ی نتیجه'}
      </Button>
    </div>
  );
}
