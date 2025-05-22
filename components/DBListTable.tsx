'use client';
import { Box } from '@mui/material';
import { useEffect, useState } from 'react';

type Range = {
  start: string;
  end: string;
};

type Machine = {
  machine_no: string;
  ranges: Range[];
};

type Plant = {
  plant_name: string;
  machines: Machine[];
};

export default function DBListTable() {
  const [data, setData] = useState<Plant[]>([]);

  useEffect(() => {
    fetch('/api/db-list')
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error(err));
  }, []);

  return (
    <Box sx={{ padding: 2 }}>
      {data.map((plant) => (
        <Box key={plant.plant_name} sx={{ mb: 4 }}>
          <h2 className="text-lg font-bold">{plant.plant_name}</h2>
          {plant.machines.map((machine) => (
            <Box key={machine.machine_no} sx={{ ml: 4, mb: 2 }}>
              <h3 className="font-semibold">{machine.machine_no}</h3>
              <ul className="list-disc ml-6">
                {machine.ranges.map((range, idx) => (
                  <li key={idx}>
                    {range.start} ~ {range.end}
                  </li>
                ))}
              </ul>
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
}
