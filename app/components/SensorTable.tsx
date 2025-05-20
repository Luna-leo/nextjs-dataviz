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

// 2 本のインデックス列（編集不可 & ピン留め）
const indexColumns = [
  { field: 'param_name_en', headerName: 'ITEM NAME', width: 140, editable: false },
  { field: 'param_name_ja', headerName: '項目名',  width: 120, editable: false },
];

// センサ列（編集可）
const dataColumns = [
  { field: 'tempA', headerName: 'センサ A', width: 120, type: 'number', editable: true },
  { field: 'tempB', headerName: 'センサ B', width: 120, type: 'number', editable: true },
  { field: 'humA',  headerName: '湿度 A',  width: 120, type: 'number', editable: true },
];

// 3 段ヘッダーを columnGroupingModel で表現
const columnGroupingModel: GridColumnGroupingModel = [
  {
    groupId: 'env',          // ── 1 段目 ──
    headerName: '環境情報',
    children: [
      {
        groupId: 'temp',     // ── 2 段目 ──
        headerName: '温度',
        children: [{ field: 'tempA' }, { field: 'tempB' }], // ── 3 段目 ──
      },
      {
        groupId: 'hum',
        headerName: '湿度',
        children: [{ field: 'humA' }],
      },
    ],
  },
];

const rows = [
  { id: 1, plant: '東京第一', machine: 'M-001', tempA: 25.1, tempB: 24.8, humA: 42 },
  { id: 2, plant: '東京第一', machine: 'M-002', tempA: 26.3, tempB: 25.9, humA: 40 },
  // …
];

// index 列を常時表示
const pinnedColumns = { left: ['param_name_en', 'param_name_ja'] };   // Data Grid Pro 6+


export default function SensorTable() {
  const [tableRows, setTableRows] = useState<GridRowsProp>(rows);

  // 編集後にローカル state を更新（API 連携する場合はここで fetch）
  const processRowUpdate = useCallback(
    (newRow: GridValidRowModel) => {
      setTableRows((prev) =>
        prev.map((r) => (r.id === newRow.id ? newRow : r)),
      );
      return newRow;
    },
    [],
  );

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <DataGridPro
        rows={tableRows}
        columns={[...indexColumns, ...dataColumns]}
        columnGroupingModel={columnGroupingModel}
        slotProps={{
          pagination: {
            labelRowsPerPage: '1ページの行数:',
          },
        }}
        pinnedColumns={pinnedColumns}
        editMode="cell"
        processRowUpdate={processRowUpdate}
        onProcessRowUpdateError={(err) => console.error(err)}
        disableRowSelectionOnClick
      />
    </Box>
  );
}