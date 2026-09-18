import React, { useMemo, useState } from 'react';
import { Card, Typography, InputNumber, Space, Button, Alert, Radio, Tag } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { applyElimination, useGame } from '../../store';

const { Title, Text, Paragraph } = Typography;

export default function DayFinalVote() {
  const { game, update } = useGame();
  const { players, day } = game;
  const { defendants, threshold, votes } = day;
  const isSingle = defendants.length === 1;

  const alivePlayers = players.filter((p) => p.alive);
  const defendantIds = defendants.map((d) => d.id);
  const nonDefendantVoters = alivePlayers.filter((p) => !defendantIds.includes(p.id));

  const [againstCount, setAgainstCount] = useState(0); // حالت تک‌نفره
  // حالت چندنفره: رای هر فرد را جداگانه نگه می‌داریم تا کسی نتواند به چند نفر رای بدهد
  const [voterChoices, setVoterChoices] = useState({}); // voterId -> defendantId
  const [tieChoice, setTieChoice] = useState(undefined);

  const finalVotes = useMemo(() => {
    const tally = Object.fromEntries(defendants.map((d) => [d.id, 0]));
    Object.values(voterChoices).forEach((defendantId) => {
      if (defendantId && tally[defendantId] !== undefined) {
        tally[defendantId] += 1;
      }
    });
    return tally;
  }, [voterChoices, defendants]);

  const votedCount = Object.values(voterChoices).filter(Boolean).length;

  const maxVotes = useMemo(() => Math.max(0, ...Object.values(finalVotes)), [finalVotes]);
  const topCandidates = useMemo(
    () => defendants.filter((d) => maxVotes > 0 && finalVotes[d.id] === maxVotes),
    [finalVotes, maxVotes, defendants]
  );
  const isTie = !isSingle && topCandidates.length > 1;

  const votesTally = alivePlayers.map((p) => ({ name: p.name, votes: votes?.[p.id] || 0 }));

  const finalizeSingle = () => {
    const defendant = defendants[0];
    const eliminatedId = againstCount >= threshold ? defendant.id : null;
    update((g) => applyElimination(g, { eliminatedId, votesTally, tie: false }));
  };

  const finalizeMulti = () => {
    let eliminatedId = null;
    if (maxVotes === 0) {
      eliminatedId = null;
    } else if (isTie) {
      if (!tieChoice) return; // منتظر انتخاب گرداننده در تساوی
      eliminatedId = tieChoice === 'none' ? null : tieChoice;
    } else {
      eliminatedId = topCandidates[0].id;
    }
    update((g) => applyElimination(g, { eliminatedId, votesTally, tie: isTie }));
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <Title level={3} style={{ textAlign: 'center' }}>
        🗳️ رای‌گیری نهایی (دور دوم)
      </Title>

      {isSingle ? (
        <>
          <Paragraph type="secondary" style={{ textAlign: 'center' }}>
            چون فقط یک نفر در دفاعیه بود، نیازی به بستن چشم نیست؛ رای‌گیری به‌صورت آشکار انجام می‌شود.
          </Paragraph>
          <Card style={{ marginBottom: 16 }}>
            <Space orientation="vertical" size={4} style={{ width: '100%' }}>
              <Text>
                تعداد رای علیه <Text strong>{defendants[0].name}</Text> در این دور:
              </Text>
              <InputNumber
                min={0}
                max={alivePlayers.length - 1}
                value={againstCount}
                onChange={(v) => setAgainstCount(v ?? 0)}
                style={{ width: 160 }}
              />
              <Text type="secondary">
                اگر {threshold} رای یا بیشتر بیاورد، از بازی خارج می‌شود؛ در غیر این صورت امروز کسی حذف
                نمی‌شود.
              </Text>
            </Space>
          </Card>
          <Button type="primary" size="large" block icon={<CheckCircleOutlined />} onClick={finalizeSingle}>
            ثبت نتیجه‌ی دفاعیه
          </Button>
        </>
      ) : (
        <>
          <Alert
            style={{ marginBottom: 16 }}
            type="warning"
            showIcon
            title="خواب نیمروز: همه به‌جز افرادِ در دفاعیه چشم‌هایشان را می‌بندند"
            description="به‌ترتیب برای هر بازیکن مشخص کنید به کدام‌یک از افراد دفاعیه رای می‌دهد؛ هر نفر فقط یک رای دارد و امکان رای دادن به چند نفر وجود ندارد."
          />

          <Card title={`رای هر نفر (${votedCount} از ${nonDefendantVoters.length} نفر رای داده‌اند)`} style={{ marginBottom: 16 }}>
            <Space orientation="vertical" style={{ width: '100%' }} size="middle">
              {nonDefendantVoters.map((voter) => (
                <div key={voter.id}>
                  <Text strong>{voter.name}</Text>
                  <div style={{ marginTop: 4 }}>
                    <Radio.Group
                      value={voterChoices[voter.id]}
                      onChange={(e) =>
                        setVoterChoices({ ...voterChoices, [voter.id]: e.target.value })
                      }
                    >
                      <Space wrap>
                        {defendants.map((d) => (
                          <Radio.Button key={d.id} value={d.id}>
                            {d.name}
                          </Radio.Button>
                        ))}
                        <Radio.Button value={null}>رای نداد</Radio.Button>
                      </Space>
                    </Radio.Group>
                  </div>
                </div>
              ))}
            </Space>
          </Card>

          <Card size="small" title="شمارش زنده" style={{ marginBottom: 16 }}>
            <Space wrap>
              {defendants.map((d) => (
                <Tag key={d.id} color={maxVotes > 0 && finalVotes[d.id] === maxVotes ? 'red' : 'default'}>
                  {d.name}: {finalVotes[d.id]} رای
                </Tag>
              ))}
            </Space>
          </Card>

          {isTie && (
            <Card style={{ marginBottom: 16 }}>
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 12 }}
                title={`تساوی رای بین: ${topCandidates.map((d) => d.name).join('، ')} — گرداننده باید تصمیم بگیرد.`}
              />
              <Radio.Group onChange={(e) => setTieChoice(e.target.value)} value={tieChoice}>
                <Space orientation="vertical">
                  {topCandidates.map((d) => (
                    <Radio key={d.id} value={d.id}>
                      {d.name} حذف شود
                    </Radio>
                  ))}
                  <Radio value="none">هیچ‌کس حذف نشود</Radio>
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
            onClick={finalizeMulti}
          >
            ثبت نتیجه‌ی نهایی
          </Button>
        </>
      )}
    </div>
  );
}
