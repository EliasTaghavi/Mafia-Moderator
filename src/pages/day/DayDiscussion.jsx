import React, { useEffect, useState } from 'react';
import { Card, Typography, Steps, Radio, Button, Space, Alert, Tag, Empty } from 'antd';
import { SoundOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { DAY_STAGES, DAY_KINDS, PHASES, useGame } from '../../store';
import { computeNextRoundStarterId } from '../../gameLogic';
import CountdownTimer from './CountdownTimer';

const { Title, Paragraph, Text } = Typography;

export default function DayDiscussion() {
  const { game, update } = useGame();
  const { players, day, settings } = game;
  const { order, turnIndex, turnSubStage, challengedIds, challengeLog, kind } = day;
  const speakSeconds = settings?.speakSeconds || 60;
  const challengeSeconds = Math.max(5, Math.round(speakSeconds / 2));

  const dayTitle =
    kind === 'blind' ? '🙈 روز کوری' : kind === 'postIntro' ? '🗣️ روز آشنایی (بعد از شب معارفه)' : '🗣️ بحث روز';

  const [selectedTarget, setSelectedTarget] = useState(null);
  const [challengeConfirmed, setChallengeConfirmed] = useState(false);

  // با شروع نوبت هرکس، انتخاب چالش محلی را ریست کن
  useEffect(() => {
    setSelectedTarget(null);
    setChallengeConfirmed(false);
  }, [turnIndex]);

  const byId = Object.fromEntries(players.map((p) => [p.id, p]));
  const speaker = byId[order[turnIndex]];

  const isBlind = kind === DAY_KINDS.BLIND;

  const eligibleTargets = speaker
    ? players.filter((p) => p.alive && p.id !== speaker.id && !challengedIds.includes(p.id))
    : [];

  const noEligible =
    !isBlind && turnSubStage === 'challenge' && eligibleTargets.length === 0 && !challengeConfirmed;

  const goToVotingOrNextTurn = () => {
    const nextIndex = turnIndex + 1;
    if (nextIndex >= order.length) {
      // این دور صحبت تمام شد -> سردسته‌ی دور بعد را از روی نفر اولِ همین دور محاسبه کن
      if (isBlind) {
        // روز کوری رای‌گیری ندارد؛ مستقیم به شب معارفه برو
        update((g) => ({
          ...g,
          phase: PHASES.NIGHT,
          nightNumber: 0,
          nightStepIndex: 0,
          nightActions: {},
          currentRoundStarterId: computeNextRoundStarterId(g.players, g.day.order[0]),
        }));
      } else {
        update((g) => ({
          ...g,
          day: { ...g.day, stage: DAY_STAGES.VOTING },
          currentRoundStarterId: computeNextRoundStarterId(g.players, g.day.order[0]),
        }));
      }
    } else {
      update((g) => ({
        ...g,
        day: { ...g.day, turnIndex: nextIndex, turnSubStage: isBlind ? 'speaking' : 'challenge' },
      }));
    }
  };

  const finishChallengeStep = () => {
    update((g) => ({ ...g, day: { ...g.day, turnSubStage: 'speaking' } }));
  };

  // اگر هیچ هدف واجد شرایطی برای چالش باقی نمانده، خودکار از این مرحله عبور کن
  useEffect(() => {
    if (noEligible) {
      finishChallengeStep();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noEligible]);

  const confirmChallenge = () => {
    if (!selectedTarget || !speaker) return;
    const target = byId[selectedTarget];
    update((g) => ({
      ...g,
      day: {
        ...g.day,
        challengedIds: [...g.day.challengedIds, selectedTarget],
        challengeLog: [...g.day.challengeLog, { fromName: speaker.name, toName: target.name }],
      },
    }));
    setChallengeConfirmed(true);
  };

  if (!speaker || noEligible) return null;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <Title level={3} style={{ textAlign: 'center' }}>
        {dayTitle} — نفر {turnIndex + 1} از {order.length}
      </Title>

      {kind === 'blind' && (
        <Alert
          style={{ marginBottom: 16 }}
          type="info"
          showIcon
          title="این روز قبل از شب معارفه برگزار می‌شود؛ مافیا هنوز یکدیگر را نمی‌شناسند. این روز فقط صحبت آزاد دارد و چالش و رای‌گیری ندارد."
        />
      )}
      {kind === 'postIntro' && (
        <Alert
          style={{ marginBottom: 16 }}
          type="info"
          showIcon
          title="شب معارفه تمام شد؛ هنوز هیچ اتفاقی نیفتاده، این فقط فرصتی برای صحبت و آشنایی بیشتر است."
        />
      )}

      <Steps
        current={turnIndex}
        size="small"
        items={order.map((id) => ({ title: byId[id]?.name }))}
        style={{ marginBottom: 24, overflowX: 'auto' }}
      />

      <Card style={{ textAlign: 'center', marginBottom: 16 }}>
        <Text type="secondary">نوبت صحبت</Text>
        <Title level={2} style={{ margin: '4px 0' }}>
          {speaker.name}
        </Title>
      </Card>

      {!isBlind && turnSubStage === 'challenge' && !challengeConfirmed && (
        <Card>
          <Space orientation="vertical" style={{ width: '100%' }} size="middle">
            <Alert
              type="info"
              showIcon
              icon={<ThunderboltOutlined />}
              title={`${speaker.name} می‌تواند قبل از صحبت، چالشش را به یکی از افراد زیر بدهد (کسی که هنوز در این دور چالش نگرفته)، یا اصلاً چالش ندهد.`}
            />
            <Radio.Group
              onChange={(e) => setSelectedTarget(e.target.value)}
              value={selectedTarget}
              style={{ width: '100%' }}
            >
              <Space orientation="vertical" style={{ width: '100%' }}>
                {eligibleTargets.map((p) => (
                  <Radio
                    key={p.id}
                    value={p.id}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #eee', borderRadius: 8 }}
                  >
                    {p.name}
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
            <Space wrap style={{ width: '100%', justifyContent: 'center', rowGap: 8 }}>
              <Button block onClick={finishChallengeStep}>
                این نفر چالش نمی‌دهد
              </Button>
              <Button type="primary" block disabled={!selectedTarget} onClick={confirmChallenge}>
                ثبت چالش و شروع زمان چالش
              </Button>
            </Space>
          </Space>
        </Card>
      )}

      {!isBlind && turnSubStage === 'challenge' && challengeConfirmed && (
        <Card>
          <Space orientation="vertical" style={{ width: '100%' }} size="middle">
            <Alert
              type="warning"
              showIcon
              title={`چالش گرفته‌شده: ${byId[selectedTarget]?.name} — زمان چالش (نصف زمان صحبت):`}
            />
            <CountdownTimer
              key={`challenge-${turnIndex}`}
              totalSeconds={challengeSeconds}
              onFinish={finishChallengeStep}
              color="#d46b08"
              finishLabel="پایان زمان چالش"
            />
          </Space>
        </Card>
      )}

      {turnSubStage === 'speaking' && (
        <Card>
          <Space orientation="vertical" style={{ width: '100%' }} size="middle">
            <Alert type="success" showIcon icon={<SoundOutlined />} title={`زمان صحبت ${speaker.name}:`} />
            <CountdownTimer
              key={`speaking-${turnIndex}`}
              totalSeconds={speakSeconds}
              onFinish={goToVotingOrNextTurn}
              color="#389e0d"
              finishLabel="پایان صحبت"
            />
          </Space>
        </Card>
      )}

      {!isBlind && challengeLog.length > 0 && (
        <Card size="small" title="چالش‌های این دور" style={{ marginTop: 16 }}>
          <Space orientation="vertical" size={4}>
            {challengeLog.map((c, idx) => (
              <Text key={idx}>
                {c.fromName} ← چالش داد به → {c.toName}
              </Text>
            ))}
          </Space>
        </Card>
      )}
    </div>
  );
}
