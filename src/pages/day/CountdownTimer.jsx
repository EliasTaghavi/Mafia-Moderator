import React, { useEffect, useRef, useState } from 'react';
import { Progress, Space, Button, Typography } from 'antd';
import { PauseCircleOutlined, PlayCircleOutlined, StepForwardOutlined, RedoOutlined } from '@ant-design/icons';

const { Title } = Typography;

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * تایمر شمارش معکوس. با تغییر totalSeconds یا resetKey کاملاً از نو شروع می‌شود
 * (چون از key در کامپوننت والد استفاده می‌کنیم تا کامپوننت remount شود).
 */
export default function CountdownTimer({ totalSeconds, onFinish, color = '#8b0000', finishLabel = 'پایان' }) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const [running, setRunning] = useState(true);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const finishedRef = useRef(false);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (remaining === 0 && !finishedRef.current) {
      finishedRef.current = true;
      onFinishRef.current?.();
    }
  }, [remaining]);

  const percent = totalSeconds > 0 ? Math.round((remaining / totalSeconds) * 100) : 0;

  return (
    <div style={{ textAlign: 'center' }}>
      <Progress
        type="circle"
        percent={percent}
        format={() => <span style={{ fontSize: 22 }}>{formatTime(remaining)}</span>}
        strokeColor={remaining <= 5 ? '#cf1322' : color}
        size={140}
      />
      <div style={{ marginTop: 16, width: '100%' }}>
        <Space wrap style={{ width: '100%', justifyContent: 'center', rowGap: 8 }}>
          <Button
            icon={running ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={() => setRunning((r) => !r)}
          >
            {running ? 'توقف' : 'ادامه'}
          </Button>
          <Button icon={<RedoOutlined />} onClick={() => setRemaining(totalSeconds)}>
            شروع دوباره
          </Button>
          <Button
            type="primary"
            icon={<StepForwardOutlined />}
            onClick={() => {
              if (!finishedRef.current) {
                finishedRef.current = true;
                onFinishRef.current?.();
              }
            }}
          >
            {finishLabel}
          </Button>
        </Space>
      </div>
    </div>
  );
}
