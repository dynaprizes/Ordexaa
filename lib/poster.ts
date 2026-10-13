export const buildPosterHtml = (
  name: string,
  address: string,
  url: string,
  mode: 'menu' | 'home'
) => {
  const label = mode === 'menu' ? 'Dine-in' : 'Home Order'
  const headline = mode === 'menu' ? 'Scan to order food' : 'Order from home. Collect when ready.'
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(url)}`

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>QR Poster</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Georgia, serif; background: #f0f0f0; display: flex; flex-direction: column; align-items: center; padding: 40px 20px; gap: 24px; min-height: 100vh; }
  .controls { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
  .controls button { padding: 10px 24px; border: none; background: #111; color: white; font-size: 14px; cursor: pointer; border-radius: 6px; font-family: system-ui; }
  .poster { width: 100%; max-width: 400px; background: #fff; border: 1px solid #ddd; box-shadow: 0 4px 24px rgba(0,0,0,0.12); display: flex; flex-direction: column; overflow: hidden; padding: 32px 28px 24px; }
  .qr-wrap { display: flex; justify-content: center; margin-bottom: 24px; }
  .qr-box { border: 2px solid #111; padding: 16px; background: #fff; }
  .qr-box img { width: 240px; height: 240px; display: block; }
  .headline { font-size: 24px; font-weight: 700; color: #111; text-align: center; line-height: 1.2; margin-bottom: 20px; }
  .divider { height: 1px; background: #E5E1D8; margin: 20px 0; }
  .brand-name { font-size: 22px; font-weight: 700; color: #111; text-align: center; text-transform: uppercase; letter-spacing: 0.02em; margin-bottom: 8px; }
  .brand-address { font-size: 12px; color: #888; text-align: center; font-family: system-ui; line-height: 1.5; margin-bottom: 12px; }
  .brand-label { font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #999; text-align: center; font-family: system-ui; }
  .powered { font-size: 10px; color: #B8923A; font-family: system-ui; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; text-align: center; margin-top: 18px; padding-top: 16px; border-top: 1px solid #F5F3EF; }
  @media print {
    body { background: #fff; padding: 0; gap: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .controls { display: none; }
    .poster { box-shadow: none; border: none; width: 100%; max-width: 500px; margin: 0 auto; page-break-inside: avoid; }
    .qr-box img { width: 320px; height: 320px; }
    .brand-name { font-size: 26px; }
    .headline { font-size: 28px; }
  }
</style>
</head>
<body>
  <div class="controls">
    <button onclick="window.print()">Print / Save as PDF</button>
    <button onclick="window.close()">Close</button>
  </div>
  <div class="poster">
    <div class="qr-wrap">
      <div class="qr-box">
        <img src="${qrSrc}" alt="QR" />
      </div>
    </div>
    <div class="headline">${headline}</div>
    <div class="divider"></div>
    <div class="brand-label">${label}</div>
    <div class="brand-name" style="margin-top: 8px;">${name.toUpperCase()}</div>
    ${address ? `<div class="brand-address">${address}</div>` : ''}
    <div class="powered">Powered by Ordexaa</div>
  </div>
</body>
</html>`
}