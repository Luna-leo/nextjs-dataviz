'use client';
import { useState } from 'react';
import EventTable from '@/components/EventTable';
import { Button, TextField } from '@mui/material';

interface ManualCondition {
  plant_name: string;
  machine_no: string;
  start_time: string;
  end_time: string;
}

export default function DataSelection() {
  const [selectedEvents, setSelectedEvents] = useState<(string | number)[]>([]);
  const [conditions, setConditions] = useState<ManualCondition[]>([
    { plant_name: '', machine_no: '', start_time: '', end_time: '' },
  ]);

  const handleAddCondition = () => {
    setConditions([...conditions, { plant_name: '', machine_no: '', start_time: '', end_time: '' }]);
  };

  const handleChange = (index: number, field: keyof ManualCondition, value: string) => {
    const updated = [...conditions];
    updated[index][field] = value;
    setConditions(updated);
  };

  const handleFetch = () => {
    console.log('selected events', selectedEvents);
    console.log('manual conditions', conditions);
    alert('条件をコンソールに出力しました');
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">データ選択</h1>

      <section>
        <h2 className="text-lg font-semibold mb-2">① イベントから選択</h2>
        <EventTable onSelectionChange={setSelectedEvents} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">② 自分で指定</h2>
        <div className="space-y-2">
          {conditions.map((c, i) => (
            <div key={i} className="flex space-x-2">
              <TextField
                label="plant"
                size="small"
                value={c.plant_name}
                onChange={e => handleChange(i, 'plant_name', e.target.value)}
              />
              <TextField
                label="machine"
                size="small"
                value={c.machine_no}
                onChange={e => handleChange(i, 'machine_no', e.target.value)}
              />
              <TextField
                label="start_time"
                type="datetime-local"
                size="small"
                value={c.start_time}
                onChange={e => handleChange(i, 'start_time', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="end_time"
                type="datetime-local"
                size="small"
                value={c.end_time}
                onChange={e => handleChange(i, 'end_time', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </div>
          ))}
          <Button variant="outlined" size="small" onClick={handleAddCondition}>
            条件追加
          </Button>
        </div>
      </section>

      <Button variant="contained" onClick={handleFetch}>
        データ取得
      </Button>
    </div>
  );
}
