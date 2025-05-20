// components/SensorTable.tsx
'use client';                           
import dynamic from 'next/dynamic';
import { Box } from '@mui/material';
import { GridRowsProp, GridValidRowModel, GridColumnGroupingModel } from '@mui/x-data-grid-premium';
import { useCallback, useState } from 'react';

// DataGridPro だけクライアント側でロード
const DataGridPro = dynamic(
  () => import('@mui/x-data-grid-pro').then((m) => m.DataGridPro),
  { ssr: false }
);


export default function SensorTable() {


  return (
    <Box sx={{ height: 600, width: '100%' }}>
    <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold">Sensor Table</h1>
        <p>
            ここにセンサーマスターテーブルを表示したい
        </p>
    </div>

    </Box>
  );
}