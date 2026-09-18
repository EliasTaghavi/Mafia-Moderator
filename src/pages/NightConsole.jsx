import React, { useState } from 'react';
import { Card, Typography, Steps, Radio, Button, Space, Alert, Tag, Empty } from 'antd';
import { MoonOutlined, StepForwardOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { INTRO_NIGHT_STEP, NIGHT_STEPS, ROLES, MAX_TOUGH_INQUIRIES } from '../roles';
import { apparentTeamForDetective, resolveNight } from '../gameLogic';
import { PHASES, DAY_KINDS, buildDiscussionDay, freshDay, useGame } from '../store';

const { Title, Paragraph, Text } = Typography;

const STEP_ACTION_FIELD = {
  mafiaTeam: 'mafiaTeamTargetId',
  sniper: 'sniperTargetId',
  doctor: 'doctorTargetId',
  detective: 'detectiveTargetId',
  toughInquiry: 'toughInquiryRequested',
};

export default function NightConsole() {
  const { game, update } = useGame();
  const { players, nightNumber, nightStepIndex } = game;
  const [selected, setSelected] = useState(null);

  const alivePlayers = players.filter((p) => p.alive);

  // شب شماره‌ی ۰ یعنی «شب معارفه» (فقط شناخت اعضای مافیا)؛ از شب ۱ به بعد شب‌های واقعی هستند
  const isIntroNight = nightNumber === 0;
  const effectiveSteps = isIntroNight ? [INTRO_NIGHT_STEP] : NIGHT_STEPS;
  const step = effectiveSteps[nightStepIndex];

  // آیا این نقش اصلاً در بازی زنده هست؟
  const roleIsAlive = step ? step.roles.some((rId) => alivePlayers.some((p) => p.roleId === rId)) : true;

  if (!step) return null;

  const field = STEP_ACTION_FIELD[step.key];

  const detectiveResult =
    step.key === 'detective' && selected
      ? (() => {
          const target = players.find((p) => p.id === selected);
          if (!target) return null;
          const team = apparentTeamForDetective(target.roleId);
          return { name: target.name, team };
        })()
      : null;

  // همه‌ی محاسبات با استفاده از وضعیت زنده‌ی گیم در لحظه‌ی آپدیت انجام می‌شود تا هیچ داده‌ای گم نشود
  function goToNextStep(actionsPatch) {
    setSelected(null);
    update((g) => {
      const updatedActions = { ...g.nightActions, ...actionsPatch };
      const steps = g.nightNumber === 0 ? [INTRO_NIGHT_STEP] : NIGHT_STEPS;

      if (g.nightStepIndex + 1 < steps.length) {
        return { ...g, nightActions: updatedActions, nightStepIndex: g.nightStepIndex + 1 };
      }

      if (g.nightNumber === 0) {
        // پایان شب معارفه: هیچ کشته‌ای نداریم؛ مستقیم برو به روزِ بعد از شب معارفه
        return {
          ...g,
          nightActions: {},
          nightStepIndex: 0,
          phase: PHASES.DAY,
          day: buildDiscussionDay(g.players, DAY_KINDS.POST_INTRO, g.currentRoundStarterId),
        };
      }

      // پایان تمام مراحل یک شب واقعی -> محاسبه نتیجه
      const { deaths, toughSaved, toughInquiryResult, updatedPlayers } = resolveNight(
        g.players,
        updatedActions
      );
      return {
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
            toughInquiryResult,
          },
        ],
      };
    });
  }

  const handleConfirm = () => {
    goToNextStep(field ? { [field]: selected || null } : {});
  };

  const handleSkip = () => {
    goToNextStep(field ? { [field]: null } : {});
  };

  const confirmYesNo = (value) => {
    goToNextStep({ [field]: value });
  };

  const continueDeadRole = () => {
    goToNextStep(field ? { [field]: step.yesNo ? false : null } : {});
  };

  const mafiaTeamMembers = step?.noSelection
    ? players.filter((p) => step.roles.includes(p.roleId) && p.alive)
    : [];

  const toughPlayer = players.find((p) => p.alive && p.roleId === 'tough');
  const toughRemaining = toughPlayer ? MAX_TOUGH_INQUIRIES - (toughPlayer.toughInquiriesUsed || 0) : 0;
  const toughExhausted = step.key === 'toughInquiry' && toughPlayer && toughRemaining <= 0;

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

          {!roleIsAlive ? (
            // نقش حذف شده: طبق روال دوباره صدا زده می‌شود تا امکان تشخیصِ حذف‌شدن‌ها نباشد
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Alert
                type="warning"
                showIcon
                title="این نقش دیگر بازیکن زنده‌ای در بازی ندارد"
                description="برای اینکه بازیکنان نتوانند از روی ترتیب صدا زدن، حذف‌شده‌ها را حدس بزنند، طبق روالِ همیشگی این مرحله را اجرا کنید (مثل قبل با صدای بلند این نقش را صدا بزنید و کمی صبر کنید)، سپس ادامه بدهید."
              />
              <Button type="primary" block onClick={continueDeadRole}>
                ادامه
              </Button>
            </Space>
          ) : step.noSelection ? (
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Alert
                type="info"
                showIcon
                title="اعضای مافیا (فقط برای گرداننده)"
                description={
                  mafiaTeamMembers.length === 0 ? 'هیچ عضو زنده‌ای از مافیا باقی نمانده' : undefined
                }
              />
              {mafiaTeamMembers.length > 0 && (
                <Space orientation="vertical" size={4} style={{ width: '100%' }}>
                  {mafiaTeamMembers.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #eee',
                        borderRadius: 8,
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text strong>{p.name}</Text>
                      <Text type="secondary">
                        {ROLES[p.roleId]?.icon} {ROLES[p.roleId]?.name}
                      </Text>
                    </div>
                  ))}
                </Space>
              )}
              <Button type="primary" block icon={<StepForwardOutlined />} onClick={handleConfirm}>
                تایید و ادامه
              </Button>
            </Space>
          ) : step.yesNo ? (
            toughExhausted ? (
              <Space orientation="vertical" style={{ width: '100%' }}>
                <Alert
                  type="info"
                  showIcon
                  title="جان‌سخت هر دو فرصتِ استعلام خود را استفاده کرده است"
                />
                <Button type="primary" block onClick={() => confirmYesNo(false)}>
                  ادامه
                </Button>
              </Space>
            ) : (
              <Space orientation="vertical" style={{ width: '100%' }}>
                <Alert
                  type="info"
                  showIcon
                  title={`فرصت‌های باقی‌مانده‌ی جان‌سخت: ${toughRemaining} از ${MAX_TOUGH_INQUIRIES}`}
                />
                <Space style={{ width: '100%' }}>
                  <Button block onClick={() => confirmYesNo(false)} icon={<CloseOutlined />}>
                    خیر
                  </Button>
                  <Button type="primary" block onClick={() => confirmYesNo(true)} icon={<CheckOutlined />}>
                    بله، استعلام می‌خواهد
                  </Button>
                </Space>
              </Space>
            )
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

          {roleIsAlive && !step.noSelection && !step.yesNo && (
            <Space wrap style={{ width: '100%', justifyContent: 'center', rowGap: 8 }}>
              {step.optional && (
                <Button onClick={handleSkip}>این نقش امشب اقدامی نمی‌کند</Button>
              )}
              <Button
                type="primary"
                icon={<StepForwardOutlined />}
                disabled={!selected}
                onClick={handleConfirm}
                style={{ marginInlineStart: 'auto' }}
              >
                ثبت و مرحله بعد
              </Button>
            </Space>
          )}
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
