import { NextResponse } from 'next/server';
import duckdb from 'duckdb';

const db = new duckdb.Database('data/database.db');

export async function GET() {
  try {
    const rows = await new Promise<any[]>((resolve, reject) => {
      db.all(
        'SELECT param_id, param_name, param_name_ja, plant_name, machine_no, data_source, insert_date FROM parameter_id_master',
        (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        }
      );
    });
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json(
      { error: 'Database query failed' },
      { status: 500 }
    );
  }
}
