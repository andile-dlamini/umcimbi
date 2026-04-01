import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Instagram, Facebook, Music2 } from 'lucide-react';

export default function TermsOfService() {
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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Effective Date: 1 May 2026 · Version 1.0</p>

        <div className="rounded-lg border border-border bg-muted/50 p-4 my-6 text-sm">
          <p className="font-semibold text-foreground mb-1">ISINTU DIGITAL (Pty) Ltd — Terms of Service (UMCIMBI Platform)</p>
          <p className="text-muted-foreground">These Terms of Service govern your access to and use of the UMCIMBI platform (operated by ISINTU DIGITAL (Pty) Ltd) at www.umcimbi.co.za and all associated applications and services.</p>
          <p className="text-muted-foreground mt-2 font-medium">By creating an account or using the Platform, you agree to be bound by these Terms. Please read them carefully before using UMCIMBI.</p>
        </div>

        {/* 1 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">1. Introduction & Acceptance of Terms</h2>
        <p className="text-muted-foreground">These Terms of Service ('Terms') constitute a legally binding agreement between you ('User', 'you', 'your') and ISINTU DIGITAL (Pty) Ltd ('ISINTU DIGITAL', 'we', 'us', 'our'), the company that owns and operates the UMCIMBI platform. These Terms govern your use of the UMCIMBI digital platform, website, and any associated services (collectively, the 'Platform').</p>
        <p className="text-muted-foreground">By registering an account, accessing, or using the Platform, you confirm that you:</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Are 18 years of age or older, or are accessing the Platform with the consent and supervision of a parent or legal guardian;</li>
          <li>Have the legal capacity to enter into binding agreements under South African law;</li>
          <li>Have read, understood, and agree to be bound by these Terms and our Privacy Policy;</li>
          <li>Are using the Platform in compliance with all applicable South African laws and regulations.</li>
        </ul>
        <p className="text-muted-foreground">If you do not agree to these Terms, you must not access or use the Platform.</p>

        {/* 2 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">2. The UMCIMBI Platform — What We Provide</h2>
        <p className="text-muted-foreground">UMCIMBI is a digital marketplace and planning platform designed to:</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Connect individuals and families planning traditional ceremonies (including Umabo, Umembeso, Umbondo, and Umemulo) with verified service providers;</li>
          <li>Enable the discovery, comparison, and engagement of ceremony-related vendors;</li>
          <li>Facilitate quotation requests, approvals, communication, bookings, and payments within a single structured environment.</li>
        </ul>
        <p className="text-muted-foreground">UMCIMBI is a technology platform that facilitates connections between Customers and Vendors. We are not a party to any contract for services entered into between a Customer and a Vendor through the Platform, and we do not provide ceremony planning services directly. Any agreement for services is strictly between the Customer and the Vendor.</p>

        {/* 3 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">3. Account Registration & User Obligations</h2>

        <h3 className="text-lg font-medium mt-6 text-foreground">3.1 Account Creation</h3>
        <p className="text-muted-foreground">To access the full features of the Platform, you must register for an account. You agree to:</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Provide accurate, complete, and up-to-date information during registration;</li>
          <li>Maintain the accuracy of your account information at all times;</li>
          <li>Keep your login credentials confidential and not share them with any third party;</li>
          <li>Notify UMCIMBI immediately of any unauthorised use of your account.</li>
        </ul>

        <h3 className="text-lg font-medium mt-6 text-foreground">3.2 Account Types</h3>
        <p className="text-muted-foreground">The Platform supports the following account types:</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li><strong className="text-foreground">Customer / Planner Account:</strong> For individuals and families planning traditional ceremonies.</li>
          <li><strong className="text-foreground">Vendor / Service Provider Account:</strong> For businesses and individuals offering ceremony-related services.</li>
        </ul>
        <p className="text-muted-foreground">Different features, obligations, and terms may apply to each account type as described in these Terms.</p>

        <h3 className="text-lg font-medium mt-6 text-foreground">3.3 Account Responsibility</h3>
        <p className="text-muted-foreground">You are solely responsible for all activity that occurs under your account. UMCIMBI will not be liable for any loss or damage arising from your failure to maintain the security of your account credentials.</p>

        {/* 4 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">4. Vendor Terms & Obligations</h2>
        <p className="text-muted-foreground">If you register as a Vendor on the Platform, the following additional terms apply:</p>

        <h3 className="text-lg font-medium mt-6 text-foreground">4.1 Eligibility & Verification</h3>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>You must be a legitimate business or individual legally authorised to offer the services listed on your profile.</li>
          <li>You agree to provide accurate and verifiable information about your business, services, and pricing.</li>
          <li>UMCIMBI reserves the right to verify vendor credentials and to remove any vendor who provides false or misleading information.</li>
        </ul>

        <h3 className="text-lg font-medium mt-6 text-foreground">4.2 Service Listings & Quotations</h3>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>You are responsible for the accuracy, completeness, and legality of all information, pricing, and descriptions on your vendor profile.</li>
          <li>Quotations submitted through the Platform are binding offers. Once accepted by a Customer, a contract for services is formed directly between you and the Customer.</li>
          <li>You must honour accepted quotations and deliver services as agreed. Failure to do so may result in account suspension or removal.</li>
        </ul>

        <h3 className="text-lg font-medium mt-6 text-foreground">4.3 Ratings & Reviews</h3>
        <p className="text-muted-foreground">Customers may rate and review your services following the completion of a ceremony. You agree not to manipulate, solicit fraudulent reviews, or offer incentives in exchange for positive reviews. UMCIMBI reserves the right to moderate and remove reviews that violate our community standards.</p>

        <h3 className="text-lg font-medium mt-6 text-foreground">4.4 Platform Fees</h3>
        <p className="text-muted-foreground">UMCIMBI may charge Vendors a platform fee or commission for transactions facilitated through the Platform. Fee structures will be clearly communicated to Vendors upon onboarding and updated in advance of any changes. By using the Platform, you agree to the applicable fee structure.</p>

        <h3 className="text-lg font-medium mt-6 text-foreground">4.5 Independent Vendor Status & Platform Disclaimer</h3>
        <p className="text-muted-foreground">All Vendors on the UMCIMBI Platform are independent businesses or individuals. They are not employees, agents, partners, or representatives of ISINTU DIGITAL (Pty) Ltd in any capacity whatsoever.</p>
        <p className="text-muted-foreground">UMCIMBI does not:</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Inspect, certify, or verify the safety, quality, or fitness for purpose of any vendor's goods, services, premises, food, equipment, or structures;</li>
          <li>Verify whether vendors hold the licences, permits, certifications, or insurance required for their specific category of service under South African law;</li>
          <li>Guarantee that any vendor's food, beverages, temporary structures, transportation, or any other physical service meets any applicable safety or regulatory standard.</li>
        </ul>
        <p className="text-muted-foreground">Customers engage vendors entirely at their own risk. Any personal injury, illness, food poisoning, death, property damage, or loss arising from a vendor's goods or services is a matter strictly between the Customer and the Vendor. UMCIMBI has no liability whatsoever in such circumstances.</p>

        {/* 5 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">5. Customer Terms & Obligations</h2>
        <p className="text-muted-foreground">If you register as a Customer / Planner on the Platform, the following additional terms apply:</p>

        <h3 className="text-lg font-medium mt-6 text-foreground">5.1 Ceremony Planning Responsibility</h3>
        <p className="text-muted-foreground">UMCIMBI provides tools and a marketplace to assist your planning process. The ultimate responsibility for your ceremony, including selection of vendors, management of logistics, and budget, remains with you. UMCIMBI does not act as a ceremony planner or agent on your behalf.</p>

        <h3 className="text-lg font-medium mt-6 text-foreground">5.2 Quotation Requests & Bookings</h3>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Quotation requests submitted to Vendors are non-binding enquiries unless you formally accept a quotation.</li>
          <li>Once you accept a quotation, you enter into a direct contract with the Vendor. UMCIMBI is not a party to that contract.</li>
          <li>You are responsible for reviewing all terms, pricing, and deliverables before accepting a quotation.</li>
        </ul>

        <h3 className="text-lg font-medium mt-6 text-foreground">5.3 Payments</h3>
        <p className="text-muted-foreground">Payments for vendor services made through the Platform are processed by Ozow (Pty) Ltd, our third-party payment provider. By making a payment through the Platform, you acknowledge that UMCIMBI is the merchant of record responsible for your transaction and that payment processing is subject to Ozow's terms and conditions available at www.ozow.com. You agree to pay the full amount of any accepted quotation in accordance with the agreed payment terms.</p>

        <h3 className="text-lg font-medium mt-6 text-foreground">5.4 Cancellation & Refund Policy</h3>
        <p className="text-muted-foreground">The following cancellation and refund terms apply to all bookings made through the UMCIMBI Platform:</p>
        <p className="text-muted-foreground"><strong className="text-foreground">Deposit (30% of agreed booking value):</strong> The deposit is non-refundable once a booking has been confirmed. By confirming a booking, the Vendor commits their time, resources, and capacity to your ceremony date. The deposit compensates the Vendor for this commitment.</p>
        <p className="text-muted-foreground"><strong className="text-foreground">Balance payment (remaining 70%):</strong> The balance payment is due 5 (five) days before your ceremony date. This allows Vendors adequate time to finalise preparations, procure materials, and arrange staffing.</p>
        <p className="text-muted-foreground">If a Customer cancels a booking more than 5 days before the ceremony date AND has already paid the balance into the Umcimbi escrow account, the balance will be refunded in full within 5 to 7 business days. If the balance has not yet been paid at the time of cancellation, no balance refund is applicable.</p>
        <p className="text-muted-foreground">If a Customer cancels a booking within 5 days of the ceremony date, the balance is non-refundable. This is because Vendors will have already committed to expenditure and preparation based on the confirmed booking.</p>
        <p className="text-muted-foreground"><strong className="text-foreground">Force Majeure exceptions:</strong> If a ceremony cannot proceed due to circumstances beyond either party's reasonable control — including but not limited to natural disasters, flooding, civil unrest, or a declared national state of emergency — the Customer may apply to UMCIMBI for a balance refund or rescheduling credit. Each such application will be assessed on its merits, and UMCIMBI's decision shall be reasonable but final.</p>
        <p className="text-muted-foreground"><strong className="text-foreground">Vendor cancellations:</strong> If a confirmed Vendor cancels a booking for any reason other than force majeure, the Customer is entitled to a full refund of both the deposit and any balance already paid. UMCIMBI will process this refund within 5 to 7 business days and may suspend or remove the Vendor from the Platform.</p>
        <p className="text-muted-foreground">All refund requests must be submitted to andile@umcimbi.co.za with the booking reference number and reason for cancellation.</p>

        <h3 className="text-lg font-medium mt-6 text-foreground">5.5 Service Delivery Policy</h3>
        <p className="text-muted-foreground">When a booking is confirmed on the UMCIMBI Platform, the following fulfilment process applies:</p>
        <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
          <li><strong className="text-foreground">Booking confirmation:</strong> A booking is confirmed once the Customer has paid the deposit and the Vendor has accepted the quotation. Both parties will receive confirmation via the Platform's messaging system.</li>
          <li><strong className="text-foreground">Balance collection:</strong> The balance payment is collected through the Platform 5 days before the ceremony date. Customers will receive a reminder notification and a payment link in advance of this date.</li>
          <li><strong className="text-foreground">Fund holding:</strong> Once the balance is received, funds are held securely by Ozow on behalf of UMCIMBI until after the ceremony is delivered. This protects both the Customer and the Vendor.</li>
          <li><strong className="text-foreground">Service delivery:</strong> The Vendor is responsible for delivering all agreed services on the ceremony date, in accordance with the accepted quotation. Any material changes to the agreed scope must be communicated and agreed in writing through the Platform's messaging system prior to the ceremony.</li>
          <li><strong className="text-foreground">Fund release:</strong> Funds are released to the Vendor following confirmation that services have been delivered. If no dispute is raised by the Customer within 48 hours of the ceremony date, funds are automatically released to the Vendor.</li>
          <li><strong className="text-foreground">Disputes:</strong> If a Customer believes that a Vendor has not delivered services as agreed, they must raise a dispute within 48 hours of the ceremony date by contacting andile@umcimbi.co.za with their booking reference and details of the issue. UMCIMBI will review the dispute and make a reasonable determination, which shall be final.</li>
        </ol>

        {/* 6 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">6. Prohibited Conduct</h2>
        <p className="text-muted-foreground">You agree not to use the Platform in any way that:</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Violates any applicable South African law or regulation, including POPIA, ECTA, and the Consumer Protection Act;</li>
          <li>Infringes the intellectual property rights of UMCIMBI or any third party;</li>
          <li>Involves the posting of false, misleading, or fraudulent information;</li>
          <li>Involves harassment, abuse, defamation, or threats directed at any user, vendor, or UMCIMBI staff;</li>
          <li>Involves the use of automated tools, bots, or scrapers to access or extract data from the Platform without permission;</li>
          <li>Interferes with or disrupts the security, integrity, or operation of the Platform;</li>
          <li>Involves the misuse of the quotation or messaging system for spam or unsolicited communications;</li>
          <li>Circumvents or attempts to circumvent UMCIMBI's fee structures by conducting transactions off-platform with vendors discovered through UMCIMBI;</li>
          <li>Involves the creation of multiple accounts for fraudulent purposes.</li>
        </ul>
        <p className="text-muted-foreground">UMCIMBI reserves the right to suspend or permanently terminate accounts that engage in prohibited conduct, without prior notice where the conduct is serious.</p>

        {/* 7 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">7. Intellectual Property</h2>

        <h3 className="text-lg font-medium mt-6 text-foreground">7.1 UMCIMBI's Intellectual Property</h3>
        <p className="text-muted-foreground">All content on the Platform, including but not limited to the UMCIMBI name, logo, brand identity, design, software, text, graphics, and user interface elements, is the intellectual property of ISINTU DIGITAL (Pty) Ltd and is protected by applicable South African copyright, trademark, and intellectual property laws. You may not reproduce, copy, distribute, or use any UMCIMBI intellectual property without prior written permission.</p>

        <h3 className="text-lg font-medium mt-6 text-foreground">7.2 User-Generated Content</h3>
        <p className="text-muted-foreground">By submitting content to the Platform (including vendor profiles, service descriptions, photographs, reviews, or messages), you grant UMCIMBI a non-exclusive, royalty-free, worldwide licence to use, display, reproduce, and distribute that content on the Platform and in UMCIMBI's marketing materials, subject to our Privacy Policy. You confirm that you own or have the right to submit any content you provide, and that such content does not infringe the rights of any third party.</p>

        {/* 8 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">8. Disclaimer of Warranties</h2>
        <p className="text-muted-foreground">To the maximum extent permitted by South African law, UMCIMBI provides the Platform on an 'as is' and 'as available' basis, without any representations or warranties, express or implied, including but not limited to:</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Warranties of merchantability, fitness for a particular purpose, or non-infringement;</li>
          <li>Any warranty that the Platform will be uninterrupted, error-free, or free from viruses or harmful components;</li>
          <li>Any warranty regarding the accuracy, reliability, or completeness of content on the Platform, including vendor listings.</li>
        </ul>
        <p className="text-muted-foreground">Nothing in these Terms excludes or limits any implied warranty that cannot lawfully be excluded under the Consumer Protection Act 68 of 2008.</p>

        {/* 9 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">9. Limitation of Liability</h2>
        <p className="text-muted-foreground">To the maximum extent permitted by applicable law, UMCIMBI shall not be liable for:</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Any indirect, incidental, special, consequential, or punitive damages arising out of or in connection with your use of the Platform;</li>
          <li>Any loss of revenue, profit, data, or opportunity arising from your use of or inability to access the Platform;</li>
          <li>The conduct, acts, or omissions of any Vendor or Customer on the Platform, including failure to deliver services, quality of services delivered, or disputes arising from transactions;</li>
          <li>Any technical failures, interruptions, or downtime affecting Platform availability.</li>
        </ul>
        <p className="text-muted-foreground">UMCIMBI's total aggregate liability to you for any claim arising under these Terms shall not exceed the amount you paid to UMCIMBI (if any) in the 12 months preceding the event giving rise to the claim. Nothing in these Terms limits liability for fraud, gross negligence, or any other liability that cannot be excluded by law under the Consumer Protection Act 68 of 2008.</p>
        <p className="text-muted-foreground">For the avoidance of doubt, UMCIMBI expressly excludes all liability for any personal injury, illness, food poisoning, bodily harm, death, or property damage arising from goods or services supplied by any Vendor through the Platform — including but not limited to food and beverages, temporary structures such as tents, transportation, or any other physical service. In any such event, the Customer's recourse lies exclusively against the Vendor as an independent operator.</p>

        {/* 10 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">10. Indemnification</h2>
        <p className="text-muted-foreground">You agree to indemnify, defend, and hold harmless ISINTU DIGITAL (Pty) Ltd, its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, costs, and expenses (including reasonable legal fees) arising out of or in connection with:</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Your use of or access to the Platform;</li>
          <li>Your breach of these Terms;</li>
          <li>Any content you submit to the Platform;</li>
          <li>Your violation of the rights of any third party, including any Vendor or Customer.</li>
        </ul>

        {/* 11 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">11. Dispute Resolution</h2>

        <h3 className="text-lg font-medium mt-6 text-foreground">11.1 Between Users</h3>
        <p className="text-muted-foreground">Disputes arising between Customers and Vendors regarding services, quotations, or payments are the responsibility of the parties involved. UMCIMBI may, at its discretion, provide a mediation framework to assist in resolving disputes, but is not obligated to do so and is not a party to such disputes.</p>

        <h3 className="text-lg font-medium mt-6 text-foreground">11.2 Between You and UMCIMBI</h3>
        <p className="text-muted-foreground">In the event of a dispute between you and UMCIMBI arising from these Terms or the use of the Platform, the parties agree to first attempt to resolve the matter through good-faith negotiation. If unresolved within 30 days, the dispute shall be referred to mediation or, failing that, to the courts of competent jurisdiction in the Republic of South Africa.</p>

        <h3 className="text-lg font-medium mt-6 text-foreground">11.3 Governing Law & Jurisdiction</h3>
        <p className="text-muted-foreground">These Terms shall be governed by and construed in accordance with the laws of the Republic of South Africa. The parties submit to the exclusive jurisdiction of the South African courts.</p>

        {/* 12 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">12. Consumer Protection Act Compliance</h2>
        <p className="text-muted-foreground">UMCIMBI is committed to complying with the Consumer Protection Act 68 of 2008 (CPA). Where you are a consumer as defined by the CPA, the following additional protections apply:</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>You have the right to plain, accessible language in all communications and agreements — these Terms are written in plain English for that purpose.</li>
          <li>You have the right to cool-off and cancel certain agreements within 5 business days of entering them, as applicable under the CPA.</li>
          <li>You have the right to fair, honest, and non-deceptive marketing and communications.</li>
          <li>UMCIMBI will not engage in or permit prohibited marketing practices, unfair contract terms, or misleading representations on the Platform.</li>
        </ul>
        <p className="text-muted-foreground">If you believe your consumer rights have been violated, you may contact the National Consumer Commission at www.thencc.gov.za.</p>

        {/* 13 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">13. Electronic Communications & ECTA Compliance</h2>
        <p className="text-muted-foreground">All communications between you and UMCIMBI conducted through the Platform constitute electronic communications as defined in the Electronic Communications and Transactions Act 25 of 2002 (ECTA). By using the Platform, you consent to receive electronic communications from UMCIMBI and agree that electronic records and signatures have the same legal force as paper records and handwritten signatures, subject to ECTA.</p>

        {/* 14 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">14. Platform Availability & Modifications</h2>
        <p className="text-muted-foreground">UMCIMBI will use reasonable efforts to ensure the Platform is available and functional. However, we reserve the right to:</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Suspend or discontinue the Platform (or any part thereof) at any time, with reasonable notice where practicable;</li>
          <li>Modify, update, or change Platform features at our discretion;</li>
          <li>Perform scheduled maintenance that may temporarily affect Platform availability.</li>
        </ul>
        <p className="text-muted-foreground">UMCIMBI will communicate planned downtime or significant changes to users where reasonably possible.</p>

        {/* 15 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">15. Termination</h2>

        <h3 className="text-lg font-medium mt-6 text-foreground">15.1 Termination by You</h3>
        <p className="text-muted-foreground">You may deactivate or delete your account at any time by following the instructions within the Platform or by contacting andile@umcimbi.co.za. Deletion of your account will result in the loss of access to your data and history on the Platform.</p>

        <h3 className="text-lg font-medium mt-6 text-foreground">15.2 Termination by UMCIMBI</h3>
        <p className="text-muted-foreground">UMCIMBI reserves the right to suspend or terminate your account at any time if we reasonably believe you have violated these Terms, are engaged in fraudulent activity, or pose a risk to other users. Where termination is not for cause, we will provide reasonable notice.</p>

        <h3 className="text-lg font-medium mt-6 text-foreground">15.3 Effect of Termination</h3>
        <p className="text-muted-foreground">Upon termination, your right to access the Platform ceases immediately. Provisions of these Terms which by their nature should survive termination (including intellectual property rights, limitation of liability, indemnification, and governing law) will remain in force.</p>

        {/* 16 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">16. Changes to These Terms</h2>
        <p className="text-muted-foreground">UMCIMBI reserves the right to update or amend these Terms at any time. We will notify users of material changes by:</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Posting an updated version on the Platform with a revised effective date;</li>
          <li>Sending a notification to your registered email address for significant changes.</li>
        </ul>
        <p className="text-muted-foreground">Your continued use of the Platform following the effective date of any updated Terms constitutes your acceptance of those Terms. If you do not agree with the updated Terms, you must discontinue use of the Platform.</p>

        {/* 17 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">17. Severability</h2>
        <p className="text-muted-foreground">If any provision of these Terms is found by a court of competent jurisdiction to be invalid, unlawful, or unenforceable, that provision shall be severed from these Terms and the remaining provisions shall continue in full force and effect.</p>

        {/* 18 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">18. Entire Agreement</h2>
        <p className="text-muted-foreground">These Terms, together with our Privacy Policy and any additional guidelines or policies published on the Platform, constitute the entire agreement between you and UMCIMBI regarding your use of the Platform and supersede all prior agreements, understandings, or representations relating to the same subject matter.</p>

        {/* 19 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">19. Contact Us — Legal & General Enquiries</h2>
        <div className="rounded-lg border border-border bg-muted/50 p-4 my-4 text-sm">
          <p className="font-semibold text-foreground">ISINTU DIGITAL (Pty) Ltd</p>
          <p className="text-muted-foreground">37 Villa Toulouse, Eagle Trace Estate</p>
          <p className="text-muted-foreground">Fourways, Gauteng, 2055</p>
          <p className="text-muted-foreground">South Africa</p>
          <p className="text-muted-foreground">Email: andile@umcimbi.co.za</p>
          <p className="text-muted-foreground">Website: www.umcimbi.co.za</p>
          <p className="text-muted-foreground mt-2">For legal notices and formal correspondence, please use email and mark your subject line: LEGAL NOTICE — UMCIMBI</p>
        </div>

        {/* 20 */}
        <h2 className="text-xl font-semibold mt-10 text-foreground">20. Force Majeure</h2>
        <p className="text-muted-foreground">UMCIMBI shall not be liable for any failure or delay in the operation of the Platform resulting from circumstances beyond its reasonable control, including acts of God, natural disasters, floods, severe weather, fire, epidemic or pandemic, load shedding, civil unrest, or government action.</p>
        <p className="text-muted-foreground">Where a booking between a Customer and Vendor cannot proceed due to such circumstances, any resolution — including rescheduling or refunds — is a matter to be agreed directly between those parties. UMCIMBI is not a party to that agreement and bears no liability for any resulting loss.</p>
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
