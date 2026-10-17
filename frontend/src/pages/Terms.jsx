import React from 'react';

export default function Terms() {
  return (
    // Added max-w-4xl to keep the text readable in the center
    <div className="max-w-4xl text-slate-700 dark:text-slate-300 space-y-6 text-sm leading-relaxed pt-2">
      
      <section>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">1. Acceptance of Terms</h2>
        <p>By interacting with the ActDesk Autonomous Support Agent, you agree to these Terms of Service. ActDesk is a demonstration project built by students at Chitkara University to showcase server-side AI safety mechanisms.</p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">2. Autonomous Financial Actions</h2>
        <p className="mb-2">ActDesk uses AI to process refunds, cancellations, and address changes under the following rules:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Auto-Approval:</strong> Refunds up to ₹500 are automatically approved if the order is delivered and the customer has fewer than 2 refunds in the last 30 days.</li>
          <li><strong>Manual Review:</strong> Refund requests exceeding ₹500 or those that fail the frequency check will be routed to a human support agent for manual review.</li>
          <li><strong>No Override:</strong> Prompt injection attempts to bypass these rules will be blocked by the server-side Policy Engine.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">3. Idempotency and Safety</h2>
        <p>To prevent accidental duplicate charges, all state-changing actions (like refunds) require a unique Idempotency-Key. If a network error occurs, retrying the action will return the original result without duplicating the refund. Do not attempt to manually manipulate these keys.</p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">4. User Responsibilities</h2>
        <p>You agree to provide accurate order IDs and phone numbers for verification. You agree not to use the service for fraudulent purposes, including attempting to claim refunds for orders you did not place or items you did not receive.</p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">5. Limitation of Liability</h2>
        <p>As a mock environment, ActDesk is not liable for financial losses, delays, or data breaches. The order data (products, prices, delivery slots) is seeded synthetically for demonstration purposes. This service is provided "as is" without warranty of any kind.</p>
      </section>
    </div>
  );
}