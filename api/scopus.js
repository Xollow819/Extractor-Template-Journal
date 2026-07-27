// Vercel Serverless Function: pembungkus Elsevier Scopus Serial Title API.
// Kunci API disimpan sebagai environment variable SCOPUS_API_KEY di Vercel,
// sehingga tidak pernah muncul di kode sisi browser.

export default async function handler(req, res) {
  const q = (req.query && req.query.q ? String(req.query.q) : "").trim()
  const key = process.env.SCOPUS_API_KEY
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400")

  if (!q) {
    res.status(400).json({ error: "Parameter q wajib diisi." })
    return
  }
  if (!key) {
    res.status(501).json({
      error: "SCOPUS_API_KEY belum diatur di environment variable Vercel.",
      fallback: "openalex",
    })
    return
  }

  const url =
    "https://api.elsevier.com/content/serial/title?count=25&query=" + encodeURIComponent(q)

  try {
    const upstream = await fetch(url, {
      headers: { Accept: "application/json", "X-ELS-APIKey": key },
    })
    if (!upstream.ok) {
      res.status(502).json({ error: `Scopus membalas status ${upstream.status}.` })
      return
    }
    const data = await upstream.json()
    const entries = (data["serial-metadata-response"] || {}).entry || []
    const results = entries
      .filter((x) => x && x["dc:title"])
      .map((x) => {
        const cs =
          x.citeScoreYearInfoList && x.citeScoreYearInfoList.citeScoreCurrentMetric
            ? "CiteScore " + x.citeScoreYearInfoList.citeScoreCurrentMetric
            : ""
        return {
          title: x["dc:title"],
          publisher: x.publisher || "",
          issn: x["prism:issn"] || x["prism:eIssn"] || "",
          scopus: true,
          oa: x.openaccess === "1",
          quartile: cs,
          homepage: (x.link || []).map((l) => l["@href"]).find(Boolean) || "",
          source: "Scopus",
        }
      })
    res.status(200).json({ query: q, results })
  } catch (err) {
    res.status(504).json({
      error: "Permintaan ke Scopus gagal.",
      detail: String(err && err.message ? err.message : err),
    })
  }
}
