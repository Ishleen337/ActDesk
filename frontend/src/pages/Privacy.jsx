import React from 'react';

export default function Privacy() {
  return (
    // Added max-w-4xl to keep the text readable in the center
    <div className="max-w-4xl text-slate-700 dark:text-slate-300 space-y-6 text-sm leading-relaxed pt-2">
      
      <section>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">1. Information We Collect</h2>
        <p className="mb-2">When you interact with the ActDesk AI agent, we collect the following information to provide our services:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Identity Data:</strong> Your registered mobile number and order ID to verify your identity via OTP.</li>
          <li><strong>Interaction Data:</strong> The text of the messages you send to the AI (in English or Hinglish) and your feedback ratings (Thumbs Up/Down).</li>
          <li><strong>Transaction Data:</strong> Details about the refunds, cancellations, or address changes you request.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">2. How We Use Your Data</h2>
        <p className="mb-2">Your data is strictly used to resolve your customer support request. Specifically:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>To authenticate you and prevent unauthorized access to your orders.</li>
          <li>To allow the AI to understand your intent and propose the correct action (e.g., tracking, refunding).</li>
          <li>To log all actions in our secure audit trail for compliance and dispute resolution.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">3. AI Processing & Data Minimization</h2>
        <p>Your messages are parsed by a local language model. Crucially, the AI cannot execute financial actions on its own. All actions are routed through a strict server-side Policy Engine. Furthermore, we practice <strong>Data Minimization</strong>: the AI model only sees the specific fields required for the current action (e.g., order status), never your full customer record.</p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">4. Data Sharing & Security</h2>
        <p>We do not sell your data to third parties. All conversations are logged in our secure PostgreSQL and MongoDB databases with strict access controls. We use industry-standard JWT authentication and idempotency keys to prevent data corruption and duplicate charges.</p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">5. Your Rights</h2>
        <p>You have the right to request the deletion of your conversation history. To do so, please contact us at ishleenk722@gmail.com. Please note that transaction records (like refunds) must be retained for accounting purposes.</p>
      </section>
    </div>
  );
}