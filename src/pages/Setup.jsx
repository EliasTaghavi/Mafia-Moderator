import React, { useMemo, useState } from 'react';
import {
  Card,
  Input,
  Button,
  Space,
  Typography,
  InputNumber,
  Row,
  Col,
  Alert,
  Divider,
  Switch,
} from 'antd';
import { PlusOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { ROLE_LIST, DEFAULT_ROLE_COUNTS } from '../roles';
import { distributeRoles } from '../gameLogic';
import { PHASES, freshDay, useGame } from '../store';

const { Title, Text } = Typography;

export default function Setup() {
  const { update } = useGame();
  const [names, setNames] = useState(['']);
  const [roleCounts, setRoleCounts] = useState(DEFAULT_ROLE_COUNTS);
  const [speakSeconds, setSpeakSeconds] = useState(60);
  const [blindDayEnabled, setBlindDayEnabled] = useState(false);
  const [error, setError] = useState('');

  const totalRoles = useMemo(
    () => Object.values(roleCounts).reduce((a, b) => a + (Number(b) || 0), 0),
    [roleCounts]
  );
  const totalPlayers = names.filter((n) => n.trim() !== '').length;

  const handleNameChange = (idx, value) => {
    const next = [...names];
    next[idx] = value;
    setNames(next);
  };

  const addNameField = () => setNames([...names, '']);
  const removeNameField = (idx) => {
    if (names.length === 1) return;
    setNames(names.filter((_, i) => i !== idx));
  };

  const handleRoleCountChange = (roleId, value) => {
    setRoleCounts({ ...roleCounts, [roleId]: value ?? 0 });
  };

  const startGame = () => {
    setError('');
    const cleanNames = names.map((n) => n.trim()).filter(Boolean);

    if (cleanNames.length < 2) {
      setError('حداقل باید اسم ۲ بازیکن را وارد کنید.');
      return;
    }
    const duplicates = cleanNames.filter((n, i) => cleanNames.indexOf(n) !== i);
    if (duplicates.length > 0) {
      setError(`اسم تکراری وجود دارد: ${[...new Set(duplicates)].join('، ')}`);
      return;
    }
    if (totalRoles !== cleanNames.length) {
      setError(
        `جمع تعداد نقش‌ها (${totalRoles}) باید دقیقاً برابر تعداد بازیکنان (${cleanNames.length}) باشد.`
      );
      return;
    }

    try {
      const players = distributeRoles(cleanNames, roleCounts);
      update((g) => ({
        ...g,
        players,
        settings: { ...g.settings, speakSeconds: speakSeconds || 60, blindDayEnabled },
        phase: PHASES.REVEAL,
        revealIndex: 0,
        nightNumber: 0,
        nightStepIndex: 0,
        nightActions: {},
        detectiveResult: null,
        day: freshDay(),
        history: [],
      }));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '16px' }}>
      <Title level={3} style={{ textAlign: 'center' }}>
        🎭 راه‌اندازی بازی مافیا
      </Title>
      <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
        اسامی بازیکنان و تعداد هر نقش را وارد کنید، سپس نقش‌ها به‌صورت تصادفی توزیع می‌شود.
      </Text>

      <Card title="۱. اسامی بازیکنان" style={{ marginBottom: 16 }}>
        <Space orientation="vertical" style={{ width: '100%' }} size="small">
          {names.map((name, idx) => (
            <Space key={idx} style={{ width: '100%' }}>
              <Input
                placeholder={`نام بازیکن ${idx + 1}`}
                value={name}
                onChange={(e) => handleNameChange(idx, e.target.value)}
                style={{ width: 260, maxWidth: '60vw' }}
              />
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeNameField(idx)}
                disabled={names.length === 1}
              />
            </Space>
          ))}
          <Button icon={<PlusOutlined />} onClick={addNameField}>
            افزودن بازیکن
          </Button>
          <Text type="secondary">تعداد بازیکنان: {totalPlayers}</Text>
        </Space>
      </Card>

      <Card title="۲. تعداد هر نقش" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]}>
          {ROLE_LIST.map((role) => (
            <Col xs={12} sm={8} key={role.id}>
              <Space orientation="vertical" size={2} style={{ width: '100%' }}>
                <Text>
                  {role.icon} {role.name}
                </Text>
                <InputNumber
                  min={0}
                  max={20}
                  value={roleCounts[role.id]}
                  onChange={(v) => handleRoleCountChange(role.id, v)}
                  style={{ width: '100%' }}
                />
              </Space>
            </Col>
          ))}
        </Row>
        <Divider />
        <Text strong>
          جمع نقش‌ها: {totalRoles} {totalRoles === totalPlayers ? '✅' : ''}
        </Text>
      </Card>

      <Card title="۳. زمان صحبت و چالش در روز" style={{ marginBottom: 16 }}>
        <Space orientation="vertical" size={4} style={{ width: '100%' }}>
          <Text>زمان صحبت هر بازیکن (ثانیه)</Text>
          <InputNumber
            min={10}
            max={600}
            step={10}
            value={speakSeconds}
            onChange={(v) => setSpeakSeconds(v ?? 60)}
            style={{ width: 160 }}
          />
          <Text type="secondary">
            زمان چالش به‌صورت خودکار نصف زمان صحبت در نظر گرفته می‌شود: {Math.round((speakSeconds || 0) / 2)} ثانیه.
          </Text>
        </Space>
      </Card>

      <Card title="۴. روز کوری (اختیاری)" style={{ marginBottom: 16 }}>
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space orientation="vertical" size={2}>
            <Text>برگزاری «روز کوری» قبل از شب معارفه</Text>
            <Text type="secondary">
              چون اعضای مافیا هنوز یکدیگر را نمی‌شناسند، اگر روشن باشد قبل از شب معارفه یک روز
              برای صحبت و آشنایی اولیه برگزار می‌شود.
            </Text>
          </Space>
          <Switch checked={blindDayEnabled} onChange={setBlindDayEnabled} />
        </Space>
      </Card>

      {error && <Alert type="error" title={error} showIcon style={{ marginBottom: 16 }} />}

      <Button
        type="primary"
        size="large"
        block
        icon={<PlayCircleOutlined />}
        onClick={startGame}
      >
        توزیع نقش‌ها و شروع بازی
      </Button>
    </div>
  );
}
