export const buildPosterHtml = (
  name: string,
  address: string,
  url: string,
  mode: 'menu' | 'home'
) => {
  const headline = mode === 'menu' ? 'Scan to Order Food' : 'Scan to Order from Home'
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(url)}`
  const displayName = name.toUpperCase() || 'RESTAURANT NAME'

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>QR Poster - ${displayName}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --navy: #0b1c31;
    --gold: #d4a355;
    --cream: #fdfbf6;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { 
    font-family: 'Montserrat', sans-serif; 
    background: #e5e5e5; 
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    padding: 40px 20px; 
    gap: 24px; 
    min-height: 100vh; 
  }
  .controls { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
  .controls button { 
    padding: 10px 24px; border: none; background: var(--navy); color: white; 
    font-size: 14px; cursor: pointer; border-radius: 6px; font-family: 'Montserrat', sans-serif; font-weight: 600;
  }
  
  /* PREMIUM POSTER DESIGN */
  .poster { 
    width: 100%; max-width: 500px; 
    background-color: var(--cream);
    background-image: url('https://www.transparenttextures.com/patterns/cream-paper.png');
    border: 8px solid var(--cream);
    border-radius: 24px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    display: flex; flex-direction: column; overflow: hidden; position: relative;
    min-height: 700px;
  }
  
  /* Background Elements */
  .bg-shape {
    position: absolute; z-index: 0; pointer-events: none;
  }
  .bg-top-left {
    top: -20px; left: -20px; width: 150px; height: 150px;
    background: var(--navy); border-bottom-right-radius: 100%; 
  }
  .bg-top-left-inner {
    position: absolute; top: -20px; left: -20px; width: 160px; height: 160px;
    border: 3px solid var(--gold); border-bottom-right-radius: 100%; opacity: 0.5;
  }
  .bg-bottom-right {
    bottom: -20px; right: -20px; width: 200px; height: 100px;
    background: var(--navy); border-top-left-radius: 100px;
  }
  .bg-bottom-right-inner {
    position: absolute; bottom: -20px; right: -20px; width: 220px; height: 110px;
    border: 3px solid var(--gold); border-top-left-radius: 110px; opacity: 0.5;
  }
  
  /* Main Content */
  .poster-content {
    position: relative; z-index: 1; padding: 40px 30px; display: flex; flex-direction: column; align-items: center; height: 100%;
  }
  
  /* Header */
  .header { display: flex; align-items: center; gap: 15px; width: 100%; justify-content: center; margin-bottom: 10px; }
  .header-line { flex: 1; height: 1px; background: var(--gold); }
  .icon-cloche { width: 40px; height: 40px; }
  
  .restaurant-name { 
    font-family: 'Playfair Display', serif; font-size: 38px; font-weight: 700; 
    color: var(--navy); text-align: center; line-height: 1.1; margin-bottom: 5px;
    text-transform: uppercase; letter-spacing: 1px;
    word-break: break-word;
  }
  .restaurant-address {
    font-size: 11px; color: var(--navy); text-transform: uppercase; letter-spacing: 2px; 
    font-weight: 600; margin-bottom: 30px; opacity: 0.8;
  }

  /* QR Code */
  .qr-container {
    background: #fff; padding: 15px; border-radius: 20px;
    border: 3px solid var(--gold); box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    margin-bottom: 30px; position: relative;
  }
  .qr-container img { width: 240px; height: 240px; display: block; }
  
  /* Call to action */
  .cta-banner {
    background: var(--navy); border-radius: 50px; padding: 15px 30px;
    display: flex; align-items: center; gap: 15px; width: 100%; justify-content: center;
    margin-bottom: 30px; box-shadow: 0 4px 10px rgba(11, 28, 49, 0.2);
  }
  .cta-icon { color: #fff; width: 28px; height: 28px; }
  .cta-divider { width: 2px; height: 25px; background: var(--gold); }
  .cta-text { color: #fff; font-size: 18px; font-weight: 600; letter-spacing: 0.5px; }
  .cta-text span { color: var(--gold); }

  /* Features */
  .features { display: flex; justify-content: space-between; width: 100%; padding: 0 10px; margin-bottom: 30px; }
  .feature { text-align: center; flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .feature-icon { width: 30px; height: 30px; color: var(--navy); }
  .feature-text { font-size: 12px; font-weight: 600; color: var(--navy); line-height: 1.2; }
  .feature-divider { width: 1px; height: 40px; background: var(--gold); opacity: 0.5; margin-top: 5px; }

  /* Footer */
  .footer { margin-top: auto; width: 100%; text-align: center; position: relative; z-index: 1; padding-bottom: 20px; }
  .footer-powered { font-size: 12px; color: var(--navy); font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 20px; }
  .footer-powered::before, .footer-powered::after { content: ''; width: 40px; height: 1px; background: var(--gold); }
  .footer-powered strong { font-weight: 800; color: var(--navy); font-size: 14px; }
  
  .footer-tagline {
    color: var(--gold); font-size: 10px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase;
    display: flex; justify-content: center; align-items: center; gap: 10px;
  }
  .footer-tagline::before, .footer-tagline::after { content: '•'; color: var(--gold); font-size: 14px; }

  @media print {
    @page { margin: 0; size: auto; }
    body { background: #fff; padding: 0; gap: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .controls { display: none; }
    .poster { 
      box-shadow: none; border: none; 
      width: 100%; max-width: 100%; 
      border-radius: 0;
      -webkit-print-color-adjust: exact; 
      print-color-adjust: exact;
    }
  }
</style>
</head>
<body>
  <div class="controls">
    <button onclick="window.print()">Print / Save as PDF</button>
    <button onclick="window.close()">Close</button>
  </div>
  
  <div class="poster">
    <!-- Background Graphics -->
    <div class="bg-shape bg-top-left"></div>
    <div class="bg-shape bg-top-left-inner"></div>
    <div class="bg-shape bg-bottom-right"></div>
    <div class="bg-shape bg-bottom-right-inner"></div>

    <div class="poster-content">
      
      <!-- Header -->
      <div class="header">
        <div class="header-line"></div>
        <svg class="icon-cloche" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v2"/><path d="M4 13a8 8 0 0 1 16 0"/><path d="M2 13h20"/><path d="M3 17h18"/><path d="M6 17a6 6 0 0 1 12 0"/>
        </svg>
        <div class="header-line"></div>
      </div>

      <!-- Restaurant Name -->
      <div class="restaurant-name">${displayName}</div>
      ${address ? `<div class="restaurant-address">${address}</div>` : '<div class="restaurant-address" style="margin-bottom:30px;">GOOD FOOD • GOOD MOOD</div>'}

      <!-- QR Code -->
      <div class="qr-container">
        <img src="${qrSrc}" alt="QR Code" />
      </div>

      <!-- CTA -->
      <div class="cta-banner">
        <svg class="cta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
        </svg>
        <div class="cta-divider"></div>
        <div class="cta-text">${headline.replace('Scan to ', 'Scan to <span>')}</span></div>
      </div>

      <!-- Features -->
      <div class="features">
        <div class="feature">
          <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          <div class="feature-text">Order<br/>Quickly</div>
        </div>
        <div class="feature-divider"></div>
        <div class="feature">
          <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v2"/><path d="M4 13a8 8 0 0 1 16 0"/><path d="M2 13h20"/><path d="M3 17h18"/><path d="M6 17a6 6 0 0 1 12 0"/>
          </svg>
          <div class="feature-text">Enjoy<br/>Delicious Food</div>
        </div>
        <div class="feature-divider"></div>
        <div class="feature">
          <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
          <div class="feature-text">Have a<br/>Great Time</div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-powered">Powered by <strong>Ordexaa</strong></div>
        <div class="footer-tagline">Order &nbsp;•&nbsp; Manage &nbsp;•&nbsp; Grow</div>
      </div>

    </div>
  </div>
</body>
</html>`
}