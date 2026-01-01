import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Tidak ada file yang ditemukan.' }, { status: 400 });
    }

    let documents: { name: string; content: string }[] = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      let text = '';

      if (file.type === 'application/pdf') {
        const data = await pdf(buffer);
        text = data.text;
      } else if (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const { value } = await mammoth.extractRawText({ buffer });
        text = value;
      } else if (file.type.startsWith('text/')) {
        text = buffer.toString('utf-8');
      } else {
        console.log(`Melewatkan file yang tidak didukung: ${file.name}`);
        continue;
      }

      if (text.trim()) {
        documents.push({ name: file.name, content: text.trim() });
      }
    }


    if (documents.length === 0) {
      return NextResponse.json({ error: 'Tidak ada teks yang dapat diekstrak dari file yang disediakan.' }, { status: 400 });
    }


    return NextResponse.json({ documents });
  } catch (error: any) {
    console.error('Error processing files:', error);
    return NextResponse.json({ error: `Gagal memproses file: ${error.message}` }, { status: 500 });
  }
}
