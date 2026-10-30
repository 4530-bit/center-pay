// 업로드된 2개월치 파싱 결과를 비공개 Blob 하나에 저장/조회한다.
// 새 파일이 올라오기 전까지 모든 사용자가 같은 데이터를 본다.
import { get, put } from '@vercel/blob';

const PATH = 'center-pay/data.json';
const MAX_BYTES = 4 * 1024 * 1024;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') {
      const r = await get(PATH, { access: 'private', useCache: false });
      if (!r || r.statusCode !== 200) return res.status(200).json(null);
      const text = await new Response(r.stream).text();
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(200).send(text);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!isValid(body)) return res.status(400).json({ error: '데이터 형식이 올바르지 않습니다.' });
      body.savedAt = new Date().toISOString();
      const text = JSON.stringify(body);
      if (text.length > MAX_BYTES) return res.status(413).json({ error: '데이터가 너무 큽니다.' });
      await put(PATH, text, {
        access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true,
      });
      return res.status(200).json({ ok: true, savedAt: body.savedAt });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    if (e?.name === 'BlobNotFoundError') return res.status(200).json(null);
    console.error(e);
    return res.status(500).json({ error: '저장소 처리 중 오류가 발생했습니다.' });
  }
}

function isValid(b) {
  if (!b || !Array.isArray(b.months) || b.months.length < 1 || b.months.length > 2) return false;
  return b.months.every(m => m && /^\d{6}$/.test(m.month) && Array.isArray(m.centers) &&
    m.billing && typeof m.billing === 'object' && Array.isArray(m.fields));
}
