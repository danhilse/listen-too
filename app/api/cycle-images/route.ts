import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const cycleDir = path.join(process.cwd(), 'public/bg/cycle');

  try {
    const files = fs.readdirSync(cycleDir)
      .filter(file => /\.(webp|png|jpg|jpeg)$/i.test(file))
      .map(file => `/bg/cycle/${file}`);

    return NextResponse.json({ images: files });
  } catch {
    return NextResponse.json({ images: [] });
  }
}
