import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Instagram, Facebook, Music2 } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="mx-auto max-w-3xl px-5 sm:px-8 pt-8 flex items-center justify-between">
        <img src="/images/umcimbi-logo.png" alt="UMCIMBI" className="h-7 invert dark:invert-0" />
        <Link to="/onboarding">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} className="mr-1" /> Back
          </Button>
        </Link>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-5 sm:px-8 py-12 prose prose-neutral max-w-none">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Effective Date: 1 May 2026 · Version 1.0</p>

        <div className="rounded-lg border border-border bg-muted/50 p-4 my-6 text-sm">
          <p className="font-semibold text-foreground mb-1">ISINTU DIGITAL (Pty) Ltd — Privacy Policy (UMCIMBI Platform)</p>
          <p className="text-muted-foreground">This Privacy Policy applies to all users of the UMCIMBI platform, including the website at www.umcimbi.co.za and any associated mobile or web applications.</p>
          <p className="text-muted-foreground mt-2 font-medium">UMCIMBI is committed to protecting your personal information in compliance with the Protection of Personal Information Act 4 of 2013 (POPIA) and all applicable South African law.</p>
        </div>

        {/* 1 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">1. Introduction & Who We Are</h2>
        <p className="text-muted-foreground">ISINTU DIGITAL (Pty) Ltd ('ISINTU DIGITAL', 'we', 'us', 'our') is a South African technology company and the legal entity that owns and operates the UMCIMBI platform. UMCIMBI is a digital product designed to simplify the planning of traditional ceremonies by connecting ceremony planners with trusted service providers. Our platform serves families, individual planners, and vendors across South Africa. UMCIMBI acts as the Responsible Party as defined in POPIA, meaning we determine the purpose of and means for processing your personal information. Contact details for all privacy-related matters:</p>

        <div className="rounded-lg border border-border bg-muted/50 p-4 my-4 text-sm">
          <p className="font-semibold text-foreground">Information Officer: Andile (Founder & CEO)</p>
          <p className="text-muted-foreground">Email: hello@umcimbi.co.za</p>
          <p className="text-muted-foreground">Website: www.umcimbi.co.za</p>
          <p className="text-muted-foreground">Correspondence: ISINTU DIGITAL (Pty) Ltd, South Africa</p>
        </div>

        {/* 2 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">2. Definitions</h2>
        <p className="text-muted-foreground">In this Privacy Policy, the following definitions apply:</p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li><strong className="text-foreground">"Personal Information"</strong> means any information relating to an identifiable, living natural person or juristic person, as defined in POPIA.</li>
          <li><strong className="text-foreground">"Processing"</strong> means any operation performed on personal information, including collection, storage, use, disclosure, or deletion.</li>
          <li><strong className="text-foreground">"Data Subject"</strong> means the person to whom personal information relates — this includes you as a user of our platform.</li>
          <li><strong className="text-foreground">"Responsible Party"</strong> means ISINTU DIGITAL (Pty) Ltd, the company that owns and operates the UMCIMBI platform and determines the purpose and means of processing your personal information.</li>
          <li><strong className="text-foreground">"Operator"</strong> means a person who processes personal information for UMCIMBI in terms of a contract or mandate.</li>
          <li><strong className="text-foreground">"Platform"</strong> means the UMCIMBI website, web application, and any associated mobile applications.</li>
        </ul>

        {/* 3 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">3. Information We Collect</h2>

        <h3 className="text-lg font-medium mt-6 text-foreground">3.1 Information You Provide Directly</h3>
        <p className="text-muted-foreground">When you register on or use the UMCIMBI Platform, we may collect:</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Full name and surname</li>
          <li>Email address and mobile phone number</li>
          <li>Physical address and location data (province, city, area)</li>
          <li>Profile photograph (optional)</li>
          <li>Business name, business registration number, and trading details (for Vendors)</li>
          <li>Service offerings, pricing, and portfolio content (for Vendors)</li>
          <li>Quotation requests, messages, and communication records between planners and vendors</li>
          <li>Payment details processed via secure third-party payment providers</li>
          <li>Ceremony details and planning preferences</li>
          <li>Ratings and reviews submitted through the Platform</li>
        </ul>

        <h3 className="text-lg font-medium mt-6 text-foreground">3.2 Information Collected Automatically</h3>
        <p className="text-muted-foreground">When you access the Platform, we may automatically collect:</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Device information (device type, operating system, browser type)</li>
          <li>IP address and approximate geographic location</li>
          <li>Pages visited, features used, and time spent on the Platform</li>
          <li>Referral source (how you found the Platform)</li>
          <li>Cookies and similar tracking technologies (see Section 10)</li>
        </ul>

        <h3 className="text-lg font-medium mt-6 text-foreground">3.3 Information From Third Parties</h3>
        <p className="text-muted-foreground">We may receive information about you from:</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Our ecosystem partners who refer vendors or customers to the Platform</li>
          <li>Social media platforms if you choose to connect your account or log in via a third-party service</li>
          <li>Payment processors who confirm transaction status</li>
        </ul>

        {/* 4 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">4. How We Use Your Information</h2>
        <p className="text-muted-foreground">UMCIMBI processes your personal information only for lawful purposes as required by POPIA. These purposes include:</p>

        <h3 className="text-lg font-medium mt-6 text-foreground">4.1 Platform Operation & Service Delivery</h3>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Creating and managing your account</li>
          <li>Facilitating connections between planners and vendors</li>
          <li>Processing quotation requests, bookings, and payments</li>
          <li>Sending transactional messages (booking confirmations, payment receipts)</li>
          <li>Providing customer support and resolving disputes</li>
        </ul>

        <h3 className="text-lg font-medium mt-6 text-foreground">4.2 Platform Improvement & Analytics</h3>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Analysing how the Platform is used to improve features and user experience</li>
          <li>Identifying and fixing technical issues</li>
          <li>Conducting internal research and reporting (using aggregated, anonymised data)</li>
        </ul>

        <h3 className="text-lg font-medium mt-6 text-foreground">4.3 Communication & Marketing</h3>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Sending you service updates, new features, and policy notices</li>
          <li>Sending marketing communications (only with your consent, and you may withdraw consent at any time)</li>
          <li>Notifying you of new vendors, ceremonies, or services relevant to your activity on the Platform</li>
        </ul>

        <h3 className="text-lg font-medium mt-6 text-foreground">4.4 Legal & Compliance Obligations</h3>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Complying with applicable South African law, including POPIA, the Electronic Communications and Transactions Act 25 of 2002 (ECTA), and the Consumer Protection Act 68 of 2008</li>
          <li>Responding to lawful requests from regulatory or law enforcement authorities</li>
          <li>Enforcing our Terms of Service and protecting the rights and safety of our users</li>
        </ul>

        {/* 5 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">5. Legal Bases for Processing (POPIA Compliance)</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li><strong className="text-foreground">Contract performance:</strong> Processing necessary to provide the service you have requested or to enter into a contract with you.</li>
          <li><strong className="text-foreground">Legitimate interests:</strong> Processing necessary for our legitimate interests in operating and improving the Platform, where these interests are not overridden by your rights.</li>
          <li><strong className="text-foreground">Consent:</strong> Where you have given specific, voluntary consent for a particular purpose (e.g., marketing communications). You may withdraw consent at any time.</li>
          <li><strong className="text-foreground">Legal obligation:</strong> Processing required to comply with a legal obligation applicable to UMCIMBI.</li>
        </ul>

        {/* 6 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">6. How We Share Your Information</h2>
        <p className="text-muted-foreground">UMCIMBI does not sell your personal information to third parties. We may share your information in the following limited circumstances:</p>

        <h3 className="text-lg font-medium mt-6 text-foreground">6.1 Between Platform Users</h3>
        <p className="text-muted-foreground">The Platform is designed to facilitate communication between planners and vendors. When a planner submits a quotation request or booking, relevant contact details and ceremony information are shared with the relevant vendor, and vice versa. You acknowledge and consent to this sharing as a core function of the Platform.</p>

        <h3 className="text-lg font-medium mt-6 text-foreground">6.2 With Service Providers (Operators)</h3>
        <p className="text-muted-foreground">We engage trusted third-party service providers to support Platform operations, including:</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Cloud hosting and infrastructure providers</li>
          <li>Payment processing partners</li>
          <li>Email and communication service providers</li>
          <li>Analytics platforms</li>
        </ul>
        <p className="text-muted-foreground">All Operators are contractually bound to process personal information only on UMCIMBI's instructions and in compliance with POPIA.</p>

        <h3 className="text-lg font-medium mt-6 text-foreground">6.3 With Ecosystem Partners</h3>
        <p className="text-muted-foreground">Where you are referred to the Platform by an ecosystem partner, we may share limited information with that partner for purposes of the referral arrangement, subject to appropriate data protection agreements.</p>

        <h3 className="text-lg font-medium mt-6 text-foreground">6.4 Legal Requirements</h3>
        <p className="text-muted-foreground">We may disclose your information where required to do so by law, court order, or to protect the rights and safety of UMCIMBI, our users, or the public.</p>

        <h3 className="text-lg font-medium mt-6 text-foreground">6.5 Business Transfers</h3>
        <p className="text-muted-foreground">In the event of a merger, acquisition, or sale of all or part of UMCIMBI's business, personal information may be transferred to the acquiring entity, subject to equivalent data protection obligations.</p>

        {/* 7 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">7. Cross-Border Transfer of Information</h2>
        <p className="text-muted-foreground">UMCIMBI may process or store personal information on servers located outside of South Africa (for example, where our cloud hosting provider operates infrastructure in another country). Any such transfer will only occur where:</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>The recipient country has equivalent data protection laws recognised by the Information Regulator of South Africa, or</li>
          <li>We have implemented appropriate safeguards, such as contractual clauses, to protect your information in accordance with POPIA Section 72.</li>
        </ul>

        {/* 8 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">8. How We Protect Your Information</h2>
        <p className="text-muted-foreground">UMCIMBI takes the security of your personal information seriously. We implement appropriate technical and organisational measures to protect against unauthorised access, disclosure, alteration, or destruction of your information. These measures include:</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Encryption of data in transit using industry-standard protocols (HTTPS/TLS)</li>
          <li>Secure storage of sensitive information including hashed passwords</li>
          <li>Access controls limiting employee access to personal information on a need-to-know basis</li>
          <li>Regular review of our security practices</li>
        </ul>
        <p className="text-muted-foreground">Despite our efforts, no method of transmission over the internet or electronic storage is completely secure. If you believe your account has been compromised, please contact us immediately at hello@umcimbi.co.za.</p>

        {/* 9 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">9. Retention of Personal Information</h2>
        <p className="text-muted-foreground">UMCIMBI retains your personal information only for as long as is necessary to fulfil the purposes for which it was collected, or as required by applicable law. In general:</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Active account data is retained for the duration of your relationship with UMCIMBI.</li>
          <li>Transactional and financial records are retained for a minimum of 5 years in compliance with South African financial and tax laws.</li>
          <li>Upon account deletion, personal information will be anonymised or deleted within 90 days, unless retention is required by law.</li>
          <li>Backup copies may persist for a further reasonable retention period for disaster recovery purposes.</li>
        </ul>

        {/* 10 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">10. Cookies & Tracking Technologies</h2>
        <p className="text-muted-foreground">UMCIMBI uses cookies and similar technologies on our website and Platform to enhance your experience and gather analytics. Types of cookies we use include:</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li><strong className="text-foreground">Essential cookies:</strong> Required for the Platform to function correctly (e.g., session management, authentication).</li>
          <li><strong className="text-foreground">Analytics cookies:</strong> Used to understand how users interact with the Platform (e.g., Google Analytics). These use anonymised or pseudonymised data.</li>
          <li><strong className="text-foreground">Marketing cookies:</strong> Only used with your explicit consent to serve relevant content or measure campaign performance.</li>
        </ul>
        <p className="text-muted-foreground">You can manage your cookie preferences through your browser settings. Disabling certain cookies may affect the functionality of the Platform.</p>

        {/* 11 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">11. Your Rights as a Data Subject (POPIA)</h2>
        <p className="text-muted-foreground">As a Data Subject under POPIA, you have the following rights in respect of your personal information held by UMCIMBI:</p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li><strong className="text-foreground">Right of access:</strong> You may request confirmation of whether UMCIMBI holds personal information about you and request access to that information.</li>
          <li><strong className="text-foreground">Right to correction:</strong> You may request that we correct inaccurate, incomplete, or misleading personal information.</li>
          <li><strong className="text-foreground">Right to deletion:</strong> You may request deletion of your personal information, subject to our legal retention obligations.</li>
          <li><strong className="text-foreground">Right to object:</strong> You may object to the processing of your personal information in certain circumstances, including for direct marketing.</li>
          <li><strong className="text-foreground">Right to withdraw consent:</strong> Where processing is based on consent, you may withdraw that consent at any time without affecting the lawfulness of prior processing.</li>
          <li><strong className="text-foreground">Right to complain:</strong> You have the right to lodge a complaint with the Information Regulator of South Africa.</li>
        </ul>
        <p className="text-muted-foreground">To exercise any of these rights, please contact us at hello@umcimbi.co.za. We will respond within 30 days of receiving your request, as required by POPIA.</p>

        <div className="rounded-lg border border-border bg-muted/50 p-4 my-4 text-sm">
          <p className="font-semibold text-foreground">Information Regulator of South Africa</p>
          <p className="text-muted-foreground">Website: www.inforegulator.org.za</p>
          <p className="text-muted-foreground">Email: inforeg@justice.gov.za</p>
          <p className="text-muted-foreground mt-2">You have the right to lodge a complaint with the Information Regulator if you believe your personal information rights have been violated.</p>
        </div>

        {/* 12 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">12. Children's Privacy</h2>
        <p className="text-muted-foreground">The UMCIMBI Platform is not intended for use by persons under the age of 18 years. We do not knowingly collect personal information from minors. If you are a parent or guardian and believe your child has provided us with personal information without your consent, please contact us at hello@umcimbi.co.za and we will delete such information as soon as practicable.</p>

        {/* 13 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">13. Changes to This Privacy Policy</h2>
        <p className="text-muted-foreground">UMCIMBI may update this Privacy Policy from time to time to reflect changes in our practices, legal requirements, or Platform functionality. We will notify you of material changes by posting the updated Policy on our website with a revised effective date. Your continued use of the Platform following such notification constitutes your acceptance of the updated Policy.</p>

        {/* 14 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">14. Contact Us — Privacy Enquiries</h2>
        <div className="rounded-lg border border-border bg-muted/50 p-4 my-4 text-sm">
          <p className="text-muted-foreground">For any privacy-related enquiries, requests, or complaints:</p>
          <p className="text-muted-foreground mt-2">Email: hello@umcimbi.co.za</p>
          <p className="text-muted-foreground">Website: www.umcimbi.co.za</p>
          <p className="text-muted-foreground">Platform: Use the 'Contact Us' feature within your account</p>
          <p className="text-muted-foreground mt-2 font-medium text-foreground">ISINTU DIGITAL (Pty) Ltd — Information Officer: Andile</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-8">
        <div className="mx-auto max-w-3xl px-5 sm:px-8 py-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            <a href="https://instagram.com/umcimbi.official" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors"><Instagram size={18} /></a>
            <a href="https://facebook.com/umcimbi.official" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors"><Facebook size={18} /></a>
            <a href="https://tiktok.com/@umcimbi.official" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors"><Music2 size={18} /></a>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} UMCIMBI</p>
        </div>
      </footer>
    </div>
  );
}
