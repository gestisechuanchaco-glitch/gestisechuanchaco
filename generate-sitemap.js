const fs = require("fs");

const urls = [
  "https://gestisec.arcode-pe.com/",
  "https://gestisec.arcode-pe.com/login",
  "https://gestisec.arcode-pe.com/dashboard",
  "https://gestisec.arcode-pe.com/inspecciones",
  "https://gestisec.arcode-pe.com/reportes"
];

const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(url => `  <url><loc>${url}</loc></url>`).join("\n") +
  `\n</urlset>`;

fs.writeFileSync("docs/sitemap.xml", sitemap);

console.log("Sitemap generado correctamente");

