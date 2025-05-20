'use client';
import dynamic from 'next/dynamic';
import { Box } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid-premium';
import { useEffect, useState } from 'react';

const DataGrid = dynamic(() => import('@mui/x-data-grid-premium').then(m => m.DataGridPremium), { ssr: false });

type EventRecord = {
  id: number;
  plant_name: string;
  machine_no: string;
  label: string;
  label_description: string;
  event: string;
  event_detail: string;
  start_time: string;
  end_time: string;
};

type Props = {
  onSelectionChange?: (ids: (string | number)[]) => void;
};

export default function EventTable({ onSelectionChange }: Props) {
  const [rows, setRows] = useState<EventRecord[]>([]);
  const [columns] = useState<GridColDef[]>([
    { field: 'plant_name', headerName: 'plant', width: 100 },
    { field: 'machine_no', headerName: 'machine', width: 100 },
    { field: 'label', headerName: 'label', width: 100 },
    { field: 'label_description', headerName: 'label desc', width: 160 },
    { field: 'event', headerName: 'event', width: 120 },
    { field: 'event_detail', headerName: 'event detail', width: 160 },
    { field: 'start_time', headerName: 'start', width: 170 },
    { field: 'end_time', headerName: 'end', width: 170 },
  ]);

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(setRows)
      .catch(err => console.error(err));
  }, []);

  return (
    <Box sx={{ height: 300, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        checkboxSelection
        onRowSelectionModelChange={onSelectionChange}
      />
    </Box>
  );
}
