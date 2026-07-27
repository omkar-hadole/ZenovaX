import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          to="/auth?mode=signup"
          className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign Up
        </Link>

        <div className="bg-white/50 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                Terms & Conditions
              </h1>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Last updated: July 2026</p>
            </div>
          </div>

          <div className="space-y-6 text-gray-600 dark:text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using ZenovaX ("the Platform"), you agree to be bound by these Terms & Conditions.
                If you do not agree, please do not use the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">2. Eligibility</h2>
              <p>
                You must be a student with a valid institutional email address to register. By creating an account,
                you confirm that all information provided is accurate and complete.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">3. User Responsibilities</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Use the Platform only for lawful educational purposes</li>
                <li>Not engage in harassment, plagiarism, or academic dishonesty</li>
                <li>Not attempt to manipulate ratings, reviews, or session data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">4. Mentor Conduct</h2>
              <p>
                Mentors are expected to provide accurate, helpful guidance. ZenovaX reserves the right to review
                sessions and remove mentors who violate community standards.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">5. Payments & Refunds</h2>
              <p>
                Paid sessions are processed securely through our payment partners. Refund policies are determined
                on a per-session basis and are subject to mentor approval. ZenovaX is not liable for disputes
                between learners and mentors.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">6. Intellectual Property</h2>
              <p>
                All content shared during sessions, including notes and resources, is the intellectual property of
                the respective mentor unless otherwise stated. Reproduction outside the Platform requires consent.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">7. Limitation of Liability</h2>
              <p>
                ZenovaX is provided "as is" without warranties of any kind. We are not responsible for any
                damages arising from the use or inability to use the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">8. Changes to Terms</h2>
              <p>
                We reserve the right to update these terms at any time. Users will be notified of material changes
                via email or platform notification.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">9. Contact</h2>
              <p>
                For questions about these terms, please reach out to our support team through the Help Center.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
