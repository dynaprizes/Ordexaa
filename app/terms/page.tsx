export default function TermsPage() {
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
          <h1 className="text-3xl sm:text-4xl font-black text-[#111] mb-3">Terms of Service</h1>
          <p className="text-sm text-gray-500">Last updated: 1 October 2026</p>
        </div>

        <div className="bg-white border border-[#E5E1D8] rounded-2xl p-6 sm:p-8 space-y-6 text-[15px] text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">1. Acceptance of Terms</h2>
            <p>
              By creating an account on Ordexa, you ("Restaurant Owner") agree to be bound by these Terms of
              Service. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">2. Description of Service</h2>
            <p>
              Ordexa provides restaurant ordering software including QR ordering, kitchen display, order management,
              voice alerts, WhatsApp bill delivery, and analytics. The Service is provided on a subscription basis.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">3. Account Registration</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>You must provide accurate information (business name, UPI ID, phone).</li>
              <li>You are responsible for maintaining the security of your login credentials and Kitchen PIN.</li>
              <li>You must be at least 18 years old and legally able to run a business.</li>
              <li>One account per restaurant. Multiple outlets require separate accounts.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">4. Subscription Plans & Billing</h2>
            <p className="mb-3"><strong>Starter Plan:</strong> ₹999/month or ₹9,999/year</p>
            <p className="mb-3"><strong>Growth Plan:</strong> ₹1,999/month or ₹19,999/year</p>
            <ul className="list-disc pl-6 space-y-1.5 mt-3">
              <li>14-day free trial on both plans. No card required to start.</li>
              <li>Billing is prepaid monthly or yearly. No partial refunds.</li>
              <li>You may cancel anytime. Service continues until end of paid period.</li>
              <li>Prices may change with 30 days' notice.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">5. Payments to Restaurants</h2>
            <p>
              Customer UPI payments go <strong>directly to the Restaurant's UPI ID</strong>. Ordexa does not
              process, hold, or route customer payments. Ordexa charges zero commission on UPI transactions.
              You are solely responsible for your own tax compliance (including GST, if applicable).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">6. Acceptable Use</h2>
            <p className="mb-3">You agree <strong>not</strong> to:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Use the Service for illegal activities</li>
              <li>Upload offensive, misleading, or copyrighted content</li>
              <li>Attempt to hack, reverse-engineer, or overload the Service</li>
              <li>Resell or sublicense the Service to third parties</li>
              <li>Use the WhatsApp/SMS features for marketing spam</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">7. Data Ownership</h2>
            <p>
              You own your restaurant data (menu, orders, customer contacts). Ordexa owns the software,
              code, and platform. You grant Ordexa a license to use your data solely to operate the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">8. Service Availability</h2>
            <p>
              We aim for 99% uptime but do not guarantee uninterrupted service. Scheduled maintenance will be
              announced in advance. We are not liable for losses caused by downtime, network issues, or
              third-party outages (Supabase, WhatsApp, etc.).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">9. Termination</h2>
            <p>
              We may suspend or terminate accounts that violate these Terms. You may close your account anytime
              by contacting support. Upon termination, you may request a data export within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">10. Limitation of Liability</h2>
            <p>
              Ordexa is provided "as-is". We are not liable for: lost orders, customer disputes, missed
              notifications due to network failure, or any indirect damages. Maximum liability is limited to
              the amount you paid in the last 3 months.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">11. Governing Law</h2>
            <p>
              These Terms are governed by the laws of India. Any disputes will be resolved in the courts of
              Gautam Buddh Nagar, Uttar Pradesh.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">12. Contact</h2>
            <p className="mb-2">For questions about these Terms:</p>
            <p className="text-sm">
              <strong>Bhuvnesh Sharma</strong><br />
              📞 <a href="tel:8433242149" className="text-[#B8923A] no-underline">8433242149</a><br />
              💬 <a href="https://wa.me/918750083831" className="text-[#25D366] no-underline">8750083831</a>
            </p>
          </section>

        </div>

        <div className="mt-8 flex flex-wrap gap-4 justify-center text-xs text-gray-500">
          <a href="/privacy" className="hover:text-gray-900 no-underline">Privacy Policy</a>
          <a href="/terms" className="text-[#B8923A] font-semibold no-underline">Terms</a>
          <a href="/refund" className="hover:text-gray-900 no-underline">Refund Policy</a>
        </div>
      </div>
    </div>
  )
}