import { NextResponse } from 'next/server';
import data from '@/data/parameter_id_master.json';

export async function GET() {
  return NextResponse.json(data);
}
