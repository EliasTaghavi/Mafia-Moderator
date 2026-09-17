import React, { useMemo, useState } from 'react';
import { Card, Typography, InputNumber, Space, Button, Alert, Radio, Row, Col } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { DAY_STAGES, DAY_KINDS, useGame } from '../../store';

const { Title, Text, Paragraph } = Typography;

export default function DayVoting() {
  const { game, update } = useGame();
  const { players, day } = game;
  const alivePlayers = players.filter((p) => p.alive);
  const kind = day.kind || DAY_KINDS.REGULAR;
  const votingTitle =
    kind === DAY_KINDS.BLIND ? '🗳️ رای‌گیری روز کوری' : kind === DAY_KINDS.POST_INTRO ? '🗳️ رای‌گیری بعد از شب معارفه' : '🗳️ رای‌گیری روز';

  const [votes, setVotes] = useState(() =>
    Object.fromEntries(alivePlayers.map((p) => [p.id, 0]))
  );
  const [tieChoice, setTieChoice] = useState(undefined);

  const maxVotes = useMemo(() => Math.max(0, ...Object.values(votes)), [votes]);
  const topCandidates = useMemo(
    () => alivePlayers.filter((p) => maxVotes > 0 && votes[p.id] === maxVotes),
    [votes, maxVotes, alivePlayers]
  );
  const isTie = topCandidates.length > 1;

  const handleVoteChange = (id, value) => {
    setVotes({ ...votes, [id]: value ?? 0 });
  };

  const finalize = () => {
    let eliminatedId = null;
    let eliminatedName = null;

    if (maxVotes === 0) {
      eliminatedId = null;
    } else if (isTie) {
      if (!tieChoice) return; // منتظر انتخاب گرداننده در تساوی
      eliminatedId = tieChoice === 'none' ? null : tieChoice;
    } else {
      eliminatedId = topCandidates[0].id;
    }
    eliminatedName = eliminatedId ? players.find((p) => p.id === eliminatedId)?.name : null;

    const votesTally = alivePlayers.map((p) => ({ name: p.name, votes: votes[p.id] || 0 }));

    update((g) => {
      const updatedPlayers = eliminatedId
        ? g.players.map((p) => (p.id === eliminatedId ? { ...p, alive: false } : p))
        : g.players;
      const updatedHistory = [...g.history];
      const kind = g.day.kind || DAY_KINDS.REGULAR;
      if (kind === DAY_KINDS.REGULAR) {
        // این رای‌گیری مربوط به یک شب واقعی است -> همان رکورد شب را تکمیل کن
        const lastIdx = updatedHistory.length - 1;
        if (lastIdx >= 0) {
          updatedHistory[lastIdx] = {
            ...updatedHistory[lastIdx],
            eliminatedByVote: eliminatedName,
            votesTally,
          };
        }
      } else {
        // روز کوری یا روز بعد از شب معارفه -> هیچ شبی قبلش نبوده، یک رکورد جدید ثبت کن
        updatedHistory.push({
          night: 0,
          kind,
          deaths: [],
          toughSaved: null,
          eliminatedByVote: eliminatedName,
          votesTally,
        });
      }
      return {
        ...g,
        players: updatedPlayers,
        history: updatedHistory,
        day: {
          ...g.day,
          stage: DAY_STAGES.RESULTS,
          votes,
          eliminatedId,
          eliminatedName,
          tie: isTie,
        },
      };
    });
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <Title level={3} style={{ textAlign: 'center' }}>
        {votingTitle}
      </Title>
      <Paragraph type="secondary" style={{ textAlign: 'center' }}>
        برای هر بازیکن، تعداد رای‌هایی که از بقیه گرفته را وارد کنید.
      </Paragraph>

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

      {isTie && (
        <Card style={{ marginBottom: 16 }}>
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            title={`تساوی رای بین: ${topCandidates.map((p) => p.name).join('، ')} — گرداننده باید تصمیم بگیرد.`}
          />
          <Radio.Group onChange={(e) => setTieChoice(e.target.value)} value={tieChoice}>
            <Space orientation="vertical">
              {topCandidates.map((p) => (
                <Radio key={p.id} value={p.id}>
                  {p.name} حذف شود
                </Radio>
              ))}
              <Radio value="none">هیچ‌کس حذف نشود (رای‌گیری مجدد در جلسه بعد)</Radio>
            </Space>
          </Radio.Group>
        </Card>
      )}

      <Button
        type="primary"
        size="large"
        block
        icon={<CheckCircleOutlined />}
        disabled={isTie && !tieChoice}
        onClick={finalize}
      >
        ثبت نهایی رای‌گیری و مشاهده‌ی نتیجه
      </Button>
    </div>
  );
}
