import { NextRequest, NextResponse } from 'next/server'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { parsePdf } = require('@/lib/parsePdf')
// I couldn't find a way to import parsePdf without using require
// because I was running into bundling issues with pdfjs-dist library and Next.js + Webpack
// So I used disable eslint to still host it on vercel within the time constraint of a single day

export async function POST(req: NextRequest) {
    const data = await req.formData()
    const file = data.get('file') as File

    if (!file || file.type !== 'application/pdf') {
        return NextResponse.json({ error: 'Invalid PDF file' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    try {
        const text = await parsePdf(buffer)
        return NextResponse.json({ text })
    } catch (err) {
        console.error('PDF parse error:', err)
        return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 500 })
    }
}
