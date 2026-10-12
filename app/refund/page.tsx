export default function RefundPage() {
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
          <h1 className="text-3xl sm:text-4xl font-black text-[#111] mb-3">Refund Policy</h1>
          <p className="text-sm text-gray-500">Last updated: 1 October 2026</p>
        </div>

        <div className="bg-white border border-[#E5E1D8] rounded-2xl p-6 sm:p-8 space-y-6 text-[15px] text-gray-700 leading-relaxed">

          <section className="bg-[#FBF7ED] border border-[#F5D98B] rounded-xl p-5">
            <h2 className="text-base font-bold text-[#92400E] mb-2">💡 Summary</h2>
            <p className="text-sm text-[#92400E]">
              14-day free trial · No card required · Cancel anytime · No refunds on paid periods after trial ends ·
              Exceptions for billing errors and service failures.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">1. Free Trial</h2>
            <p>
              All new restaurant accounts get a <strong>14-day free trial</strong> with full access to Starter plan
              features. No payment method is required to start the trial. You will not be charged unless you
              choose to subscribe after the trial ends.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">2. Subscription Payments</h2>
            <p className="mb-3">
              Subscription fees are charged <strong>in advance</strong> for the chosen billing cycle
              (monthly or yearly). Once a billing cycle has started:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>No refunds for partial months or unused portions.</li>
              <li>No refunds for accounts terminated due to Terms violations.</li>
              <li>No refunds for features not used during the paid period.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">3. Cancellation</h2>
            <p>
              You may cancel your subscription anytime from your account settings or by contacting support.
              After cancellation:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Service continues until the end of the current paid period.</li>
              <li>No further charges will be made.</li>
              <li>Your data remains accessible until the period ends.</li>
              <li>Data is deleted 30 days after the paid period ends (unless you request an export).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">4. Refund Eligibility</h2>
            <p className="mb-3">Refunds <strong>may</strong> be issued in the following cases:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Duplicate charge:</strong> If you were charged twice for the same period.</li>
              <li><strong>Billing error:</strong> If you were charged an incorrect amount.</li>
              <li><strong>Unauthorized charge:</strong> If your account was accessed without permission.</li>
              <li><strong>Extended service outage:</strong> If downtime exceeded 72 continuous hours in a paid month.</li>
            </ul>
            <p className="mt-4">
              Refund requests must be submitted within <strong>7 days</strong> of the charge.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">5. Non-Refundable Items</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>WhatsApp utility message costs (billed to customers, not owners)</li>
              <li>SMS message costs beyond the free plan limit</li>
              <li>Failed orders caused by customer error</li>
              <li>Accounts terminated for policy violations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">6. How to Request a Refund</h2>
            <p className="mb-3">To request a refund, contact us with:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Your registered email and restaurant name</li>
              <li>Date of charge and amount</li>
              <li>Reason for refund request</li>
              <li>Any supporting screenshots or documents</li>
            </ul>
            <p className="mt-4">
              We respond to all refund requests within <strong>3 business days</strong>. Approved refunds are
              processed within <strong>7-10 business days</strong> to the original payment method.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">7. Chargebacks</h2>
            <p>
              If you initiate a chargeback with your bank without contacting us first, we may suspend your
              account pending investigation. Please reach out to us directly — we resolve most issues without
              formal disputes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">8. Customer Payments</h2>
            <p>
              Ordexa does not process customer payments. All customer UPI payments go directly to the
              restaurant's UPI ID. Refunds for customer orders (if any) are the sole responsibility of
              the restaurant, not Ordexa.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111] mb-3">9. Contact for Refunds</h2>
            <p className="mb-2">Reach us at:</p>
            <p className="text-sm">
              <strong>Bhuvnesh Sharma</strong><br />
              📞 <a href="tel:8433242149" className="text-[#B8923A] no-underline">8433242149</a><br />
              💬 <a href="https://wa.me/918750083831" className="text-[#25D366] no-underline">8750083831</a>
            </p>
          </section>

        </div>

        <div className="mt-8 flex flex-wrap gap-4 justify-center text-xs text-gray-500">
          <a href="/privacy" className="hover:text-gray-900 no-underline">Privacy Policy</a>
          <a href="/terms" className="hover:text-gray-900 no-underline">Terms</a>
          <a href="/refund" className="text-[#B8923A] font-semibold no-underline">Refund Policy</a>
        </div>
      </div>
    </div>
  )
}