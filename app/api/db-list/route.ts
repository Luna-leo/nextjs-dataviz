import fallbackData from '@/data/db_list.json';
import { NextResponse } from 'next/server';

const API_URL = 'http://127.0.0.1:8000/db_list';

export async function GET() {
  try {
    const response = await fetch(API_URL, { next: { revalidate: 60 } });
    if (!response.ok) {
      throw new Error(`FastAPI request failed with status ${response.status}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching DB list:', error);
    return NextResponse.json(fallbackData, { status: 200 });
  }
}
