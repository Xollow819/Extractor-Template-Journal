// Vercel Serverless Function: proxy + parser untuk Sinta.
// Sinta tidak menyediakan API publik dan memblokir permintaan lintas domain,
// jadi pengambilan HTML dilakukan di server lalu diubah menjadi JSON.

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"

function parseSinta(html, baseUrl) {
  const out = []
  const seen = new Set()
  const itemRe = /<a[^>]+href="([^"]*\/journals\/profile\/(\d+))"[^>]*>([\s\S]*?)<\/a>/gi
  let m
  while ((m = itemRe.exec(html)) !== null) {
    const href = m[1]
    const id = m[2]
    const title = m[3].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    if (!title || title.length < 4 || seen.has(id)) continue
    seen.add(id)

    // Ambil potongan HTML sesudah tautan untuk membaca peringkat dan ISSN.
    const tail = html.slice(m.index, m.index + 1600)
    const rank = (tail.match(/\bS([1-6])\b/) || [])[1]
    const issn = (tail.match(/\d{4}-\d{3}[\dXx]/) || [])[0]
    const publisher = (tail.match(/Universitas[^<]{0,80}|Institut[^<]{0,80}|Politeknik[^<]{0,80}/) || [])[0]

    out.push({
      title,
      issn: issn || "",
      sintaRank: rank || "",
      publisher: publisher ? publisher.trim() : "",
      sinta: new URL(href, baseUrl).href,
      source: "Sinta",
    })
    if (out.length >= 25) break
  }
  return out
}

export default async function handler(req, res) {
  const q = (req.query && req.query.q ? String(req.query.q) : "").trim()
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400")

  if (!q) {
    res.status(400).json({ error: "Parameter q wajib diisi." })
    return
  }

  const base = "https://sinta.kemdikbud.go.id"
  const target = `${base}/journals/?q=${encodeURIComponent(q)}`

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12000)
    const upstream = await fetch(target, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!upstream.ok) {
      res.status(502).json({ error: `Sinta membalas status ${upstream.status}.`, searchUrl: target })
      return
    }

    const html = await upstream.text()
    res.status(200).json({ query: q, searchUrl: target, results: parseSinta(html, base) })
  } catch (err) {
    res.status(504).json({
      error: "Sinta tidak merespons dalam batas waktu.",
      detail: String(err && err.message ? err.message : err),
      searchUrl: target,
    })
  }
}
