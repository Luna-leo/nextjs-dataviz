import data from '@/data/parameter_id_master.json';
import { NextResponse } from 'next/server';

const API_URL = 'http://127.0.0.1:8000/pi_tag_master';

export async function GET() {
  try {
    // SWRのキャッシュ機能を利用（Next.js App Routerのfetchのrevalidateオプションで実現）
    const response = await fetch(API_URL, {
      next: { revalidate: 60 }, // 60秒間キャッシュ
    });

    if (!response.ok) {
      throw new Error(`FastAPI request failed with status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching data from FastAPI:', error);
    
    // エラー時にローカルのJSONデータをフォールバックとして使用
    return NextResponse.json(data, { status: 200 });
  }
}
