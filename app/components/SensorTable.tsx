'use client';
import dynamic from 'next/dynamic';
import { Box } from '@mui/material';
import {
  GridRowsProp,
  GridColDef,
  GridColumnGroupingModel,
} from '@mui/x-data-grid-premium';
import { useEffect, useState } from 'react';

const DataGrid = dynamic(() => import('@mui/x-data-grid-premium').then(m => m.DataGridPremium), {
  ssr: false,
});

type ParameterRecord = {
  param_id: string;
  param_name_en: string;
  param_name_ja: string;
  plant_name: string;
  machine_no: string;
  data_source: string;
  insert_date: string;
};

type RowData = {
  id: string;
  param_name_en: string;
  param_name_ja: string;
  [key: string]: string;
};

function pivotData(records: ParameterRecord[]) {
  const rowMap = new Map<string, RowData>();
  const columnFields: string[] = [];
  const plantMap = new Map<string, Map<string, Map<string, string>>>();

  records.forEach((rec) => {
    const rowKey = `${rec.param_name_en}|${rec.param_name_ja}`;
    let row = rowMap.get(rowKey);
    if (!row) {
      row = {
        id: rowKey,
        param_name_en: rec.param_name_en,
        param_name_ja: rec.param_name_ja,
      };
      rowMap.set(rowKey, row);
    }

    const field = `${rec.plant_name}_${rec.machine_no}_${rec.data_source}`;
    row[field] = rec.param_id;
    if (!columnFields.includes(field)) {
      columnFields.push(field);
    }

    if (!plantMap.has(rec.plant_name)) {
      plantMap.set(rec.plant_name, new Map());
    }
    const machineMap = plantMap.get(rec.plant_name)!;
    if (!machineMap.has(rec.machine_no)) {
      machineMap.set(rec.machine_no, new Map());
    }
    const sourceMap = machineMap.get(rec.machine_no)!;
    if (!sourceMap.has(field)) {
      sourceMap.set(field, rec.data_source);
    }
  });

  const rows: GridRowsProp = Array.from(rowMap.values());

  const columns: GridColDef[] = [
    { field: 'param_name_en', headerName: 'param_name_en', width: 160 },
    { field: 'param_name_ja', headerName: 'param_name_ja', width: 140 },
    ...columnFields.map((field) => ({
      field,
      headerName: field.split('_')[2],
      width: 120,
    })),
  ];

  const columnGroupingModel: GridColumnGroupingModel = [];
  plantMap.forEach((machineMap, plant) => {
    const plantGroup: GridColumnGroupingModel[number] = { groupId: plant, headerName: plant, children: [] };
    machineMap.forEach((sourceMap, machine) => {
      const machineGroup: GridColumnGroupingModel[number] = {
        groupId: `${plant}-${machine}`,
        headerName: machine,
        children: [],
      };
      sourceMap.forEach((dataSource, field) => {
        machineGroup.children.push({ field, headerName: dataSource });
      });
      plantGroup.children.push(machineGroup);
    });
    columnGroupingModel.push(plantGroup);
  });

  return { rows, columns, columnGroupingModel };
}

export default function SensorTable() {
  const [rows, setRows] = useState<GridRowsProp>([]);
  const [columns, setColumns] = useState<GridColDef[]>([]);
  const [columnGroups, setColumnGroups] = useState<GridColumnGroupingModel>([]);

  useEffect(() => {
    fetch('/api/parameter_id_master')
      .then((res) => res.json())
      .then((data: ParameterRecord[]) => {
        const { rows, columns, columnGroupingModel } = pivotData(data);
        setRows(rows);
        setColumns(columns);
        setColumnGroups(columnGroupingModel);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <Box sx={{ height: 750, width: '100%', padding: 2 }}>
      <DataGrid rows={rows} columns={columns} columnGroupingModel={columnGroups} />
    </Box>
  );
}
