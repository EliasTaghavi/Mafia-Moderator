import React, { useState } from 'react';
import { Card, Typography, Steps, Radio, Button, Space, Alert, Tag, Empty } from 'antd';
import { MoonOutlined, StepForwardOutlined } from '@ant-design/icons';
import { INTRO_NIGHT_STEP, NIGHT_STEPS, ROLES } from '../roles';
import { apparentTeamForDetective, resolveNight } from '../gameLogic';
import { PHASES, DAY_KINDS, buildDiscussionDay, freshDay, useGame } from '../store';

const { Title, Paragraph, Text } = Typography;

const STEP_ACTION_FIELD = {
  mafiaTeam: 'mafiaTeamTargetId',
  sniper: 'sniperTargetId',
  doctor: 'doctorTargetId',
  detective: 'detectiveTargetId',
};

export default function NightConsole() {
  const { game, update } = useGame();
  const { players, nightNumber, nightStepIndex, nightActions } = game;
  const [selected, setSelected] = useState(null);

  const alivePlayers = players.filter((p) => p.alive);

  // شب شماره‌ی ۰ یعنی «شب معارفه» (فقط شناخت اعضای مافیا)؛ از شب ۱ به بعد شب‌های واقعی هستند
  const isIntroNight = nightNumber === 0;
  const effectiveSteps = isIntroNight ? [INTRO_NIGHT_STEP] : NIGHT_STEPS;
  const step = effectiveSteps[nightStepIndex];

  // آیا این نقش اصلاً در بازی زنده هست؟ اگر نه، این مرحله را رد کن
  const roleAliveForStep = (s) =>
    s.roles.some((rId) => alivePlayers.some((p) => p.roleId === rId));

  React.useEffect(() => {
    if (step && !roleAliveForStep(step)) {
      goToNextStep({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nightStepIndex]);

  if (!step) return null;

  const detectiveResult =
    step.key === 'detective' && selected
      ? (() => {
          const target = players.find((p) => p.id === selected);
          if (!target) return null;
          const team = apparentTeamForDetective(target.roleId);
          return { name: target.name, team };
        })()
      : null;

  function goToNextStep(actionsPatch) {
    const updatedActions = { ...nightActions, ...actionsPatch };
    setSelected(null);

    if (nightStepIndex + 1 < effectiveSteps.length) {
      update((g) => ({
        ...g,
        nightActions: updatedActions,
        nightStepIndex: g.nightStepIndex + 1,
      }));
    } else if (isIntroNight) {
      // پایان شب معارفه: هیچ کشته‌ای نداریم؛ مستقیم برو به روزِ بعد از شب معارفه
      update((g) => ({
        ...g,
        nightActions: {},
        nightStepIndex: 0,
        phase: PHASES.DAY,
        day: buildDiscussionDay(g.players, DAY_KINDS.POST_INTRO),
      }));
    } else {
      // پایان تمام مراحل یک شب واقعی -> محاسبه نتیجه
      const { deaths, toughSaved, updatedPlayers } = resolveNight(players, updatedActions);
      update((g) => ({
        ...g,
        players: updatedPlayers,
        nightActions: {},
        nightStepIndex: 0,
        phase: PHASES.DAY,
        day: freshDay(DAY_KINDS.REGULAR),
        history: [
          ...g.history,
          {
            night: g.nightNumber,
            deaths,
            toughSaved,
          },
        ],
      }));
    }
  }

  const handleConfirm = () => {
    const field = STEP_ACTION_FIELD[step.key];
    goToNextStep(field ? { [field]: selected || null } : {});
  };

  const handleSkip = () => {
    const field = STEP_ACTION_FIELD[step.key];
    goToNextStep(field ? { [field]: null } : {});
  };

  const mafiaTeamNames = step?.noSelection
    ? players.filter((p) => step.roles.includes(p.roleId) && p.alive).map((p) => p.name)
    : [];

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <Title level={3} style={{ textAlign: 'center' }}>
        <MoonOutlined /> {isIntroNight ? 'شب معارفه' : `شب شماره ${nightNumber}`}
      </Title>

      <Steps
        current={nightStepIndex}
        size="small"
        items={effectiveSteps.map((s) => ({ title: s.subtitle }))}
        style={{ marginBottom: 24 }}
      />

      <Card>
        <Space orientation="vertical" style={{ width: '100%' }} size="middle">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48 }}>{step.icon}</div>
            <Title level={4}>{step.title}</Title>
            <Paragraph type="secondary">{step.prompt}</Paragraph>
          </div>

          {step.noSelection ? (
            <Alert
              type="info"
              showIcon
              title="اعضای مافیا (فقط برای گرداننده)"
              description={
                mafiaTeamNames.length > 0
                  ? mafiaTeamNames.join('، ')
                  : 'هیچ عضو زنده‌ای از مافیا باقی نمانده'
              }
            />
          ) : alivePlayers.length === 0 ? (
            <Empty description="بازیکن زنده‌ای باقی نمانده" />
          ) : (
            <Radio.Group
              onChange={(e) => setSelected(e.target.value)}
              value={selected}
              style={{ width: '100%' }}
            >
              <Space orientation="vertical" style={{ width: '100%' }}>
                {alivePlayers.map((p) => (
                  <Radio
                    key={p.id}
                    value={p.id}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #eee',
                      borderRadius: 8,
                    }}
                  >
                    {p.name}
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          )}

          {detectiveResult && (
            <Alert
              showIcon
              type={detectiveResult.team === 'mafia' ? 'error' : 'success'}
              title={`نتیجه‌ی استعلام (فقط برای گرداننده): ${detectiveResult.name} یک عضو ${
                detectiveResult.team === 'mafia' ? 'مافیاست 🔴' : 'شهروند است 🔵'
              }`}
            />
          )}

          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            {step.optional && (
              <Button onClick={handleSkip}>این نقش امشب اقدامی نمی‌کند</Button>
            )}
            <Button
              type="primary"
              icon={<StepForwardOutlined />}
              disabled={!step.noSelection && !selected}
              onClick={handleConfirm}
              style={{ marginInlineStart: 'auto' }}
            >
              {step.noSelection ? 'تایید و ادامه' : 'ثبت و مرحله بعد'}
            </Button>
          </Space>
        </Space>
      </Card>

      <Card size="small" style={{ marginTop: 16 }} title="بازیکنان زنده">
        <Space wrap>
          {players.map((p) => (
            <Tag key={p.id} color={p.alive ? 'green' : 'default'}>
              {p.name} {p.alive ? '' : '(حذف شده)'}
            </Tag>
          ))}
        </Space>
      </Card>
    </div>
  );
}
