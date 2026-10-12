export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F5F3EF]" style={{ fontFamily: 'system-ui, sans-serif' }}>

      {/* Nav */}
      <nav className="bg-white border-b border-[#E5E1D8] sticky top-0 z-50">
        <div className="max-w-[800px] mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" className="no-underline flex items-center gap-2.5">
  <img src="/ordexaa-logo.jpeg" alt="Ordexaa" className="w-9 h-9 rounded-lg object-cover" />
  <div>
    <div className="text-base font-black tracking-widest text-[#111]">ORDEXAA</div>
    <div className="text-[8.5px] text-[#B8923A] tracking-[0.24em]">ORDER · MANAGE · GROW</div>
  </div>
</a>
          <a href="/" className="text-xs text-gray-500 hover:text-gray-900 no-underline">← Back to Home</a>
        </div>
      </nav>

      <div className="max-w-[800px] mx-auto px-6 py-12">

        <div className="mb-8">
          <div className="text-[11px] font-bold text-[#B8923A] tracking-widest uppercase mb-3">Legal</div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#111] mb-3">Privacy Policy</h1>
          <p className="text-sm text-gray-500">Last updated: 1 October 2026</p>
        </div>

        <div className="bg-white border border-[#E5E1D8] rounded-2xl p-6 sm:p-8 space-y-6 text-[15px] text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">1. Introduction</h2>
            <p>
              Ordexa ("we", "our", "us") provides restaurant ordering software to restaurants and cafes in India.
              This Privacy Policy explains how we collect, use, and protect your information when you use our
              services at ordexa.in (the "Service").
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">2. Information We Collect</h2>
            <p className="mb-3"><strong>From Restaurant Owners:</strong></p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Email address (for login)</li>
              <li>Restaurant name, address, and phone number</li>
              <li>UPI ID (for receiving customer payments directly)</li>
              <li>Menu data (categories, items, prices, images)</li>
              <li>Order history and analytics</li>
            </ul>
            <p className="mt-4 mb-3"><strong>From Customers:</strong></p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Name (optional)</li>
              <li>Phone number (optional, only if customer chooses to receive WhatsApp bill)</li>
              <li>Order details (items, quantity, total)</li>
              <li>Payment method selected</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">3. How We Use Information</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>To operate the Service (process orders, manage menus)</li>
              <li>To send order notifications via WhatsApp or SMS (only if phone provided)</li>
              <li>To generate business analytics for restaurant owners</li>
              <li>To improve our software and features</li>
              <li>To respond to support requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">4. Payment Information</h2>
            <p>
              Ordexa <strong>never handles customer payments</strong>. Customer UPI payments go directly to the
              restaurant's UPI ID. We do not store, process, or have access to any card numbers, UPI PINs, or
              bank account details.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">5. Data Sharing</h2>
            <p className="mb-3">We do not sell your data. We may share limited information with:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Supabase</strong> — for secure data storage</li>
              <li><strong>Interakt / WhatsApp Business API</strong> — to deliver customer order notifications</li>
              <li><strong>Fast2SMS</strong> — for SMS fallback notifications</li>
              <li><strong>Anthropic (Claude AI)</strong> — to generate weekly business reports (aggregated, anonymized data only)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">6. Data Security</h2>
            <p>
              All data is stored on encrypted servers. Passwords and sessions use industry-standard encryption.
              Restaurant owners can request data deletion at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">7. Your Rights</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Access your data</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your account</li>
              <li>Opt out of WhatsApp/SMS notifications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">8. Cookies</h2>
            <p>
              We use minimal cookies for authentication and session management. No third-party tracking cookies
              are used for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">9. Children's Privacy</h2>
            <p>
              Our Service is not intended for users under 18. We do not knowingly collect data from children.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Material changes will be notified via email
              to registered restaurant owners.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">11. Contact Us</h2>
            <p className="mb-2">For any privacy-related questions:</p>
            <p className="text-sm">
              <strong>Bhuvnesh Sharma</strong><br />
              📞 <a href="tel:8433242149" className="text-[#B8923A] no-underline">8433242149</a><br />
              💬 <a href="https://wa.me/918750083831" className="text-[#25D366] no-underline">8750083831</a>
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center text-xs text-gray-500">
          <a href="/privacy" className="text-[#B8923A] font-semibold no-underline">Privacy Policy</a>
          <a href="/terms" className="hover:text-gray-900 no-underline">Terms</a>
          <a href="/refund" className="hover:text-gray-900 no-underline">Refund Policy</a>
        </div>
      </div>
    </div>
  )
}