import { useState, FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FeedbackHeader, FeedbackShell, ThankYou, SubmitButton } from "./FeedbackShared";

const Q1_OPTIONS = [
  { value: "no_profile", label: "I signed up as a vendor but haven't created my business profile yet" },
  { value: "has_profile", label: "I created my business profile but haven't received or responded to any requests" },
];

const SERVICES = [
  "Catering", "Decor & Styling", "Photographer / Videographer", "Attire & Tailoring",
  "Tents & Stretch Tents", "Transport", "Livestock / Abattoir", "Makeup & Beauty",
  "Invitations, Stationery & Printing", "Florist", "Cakes & Baking", "DJ / Sound & Audio",
  "Drinks & Ice Delivery", "Cold Room Hire", "Mobile Toilets & Sanitation", "Other",
];

const Q2A_OPTIONS = [
  "There were too many steps",
  "I wasn't sure what information to provide",
  "I was uncomfortable providing my banking details",
  "I experienced a technical problem",
  "I wasn't ready to list my business yet",
  "I wasn't sure if UMCIMBI was right for my business",
  "Other",
];

const Q2B_OPTIONS = [
  "Not enough planners on the platform yet",
  "Not sure my profile looks complete enough",
  "I don't think my listing is visible to planners",
  "Planners in my area aren't using it yet",
  "I'm not sure",
  "Other",
];

const Q3B_OPTIONS = [
  "Knowing there are more planners actively using the platform",
  "Seeing how many times my profile has been viewed",
  "Hearing from other vendors who got bookings",
  "Tips on how to improve my profile",
  "Other",
];

export default function FeedbackVendor() {
  const [q1, setQ1] = useState("");
  // Branch A
  const [q2a, setQ2a] = useState<string[]>([]);
  const [q3a, setQ3a] = useState<string[]>([]);
  const [q4a, setQ4a] = useState("");
  // Branch B
  const [q2b, setQ2b] = useState<string[]>([]);
  const [q3b, setQ3b] = useState<string[]>([]);
  const [q4b, setQ4b] = useState("");
  // Shared
  const [q5, setQ5] = useState("");
  const [q6, setQ6] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const toggle = (arr: string[], v: string, setter: (a: string[]) => void) =>
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!q1 || !q6) {
      toast.error("Please answer all required questions.");
      return;
    }
    if (q1 === "no_profile" && q2a.length === 0) {
      toast.error("Please answer all required questions.");
      return;
    }
    if (q1 === "has_profile" && q2b.length === 0) {
      toast.error("Please answer all required questions.");
      return;
    }
    setSubmitting(true);
    const willing = q6 === "Yes";
    const responses: Record<string, any> = { q1, q5, q6 };
    if (q1 === "no_profile") Object.assign(responses, { q2a, q3a, q4a });
    if (q1 === "has_profile") Object.assign(responses, { q2b, q3b, q4b });

    const { error } = await supabase.from("survey_responses").insert([{
      survey_type: "vendor",
      responses,
      willing_to_call: willing,
      whatsapp_number: willing ? phone : null,
    }]);
    setSubmitting(false);
    if (error) {
      toast.error("Could not submit. Please try again.");
      return;
    }
    setDone(true);
  };

  if (done) return <ThankYou />;

  return (
    <FeedbackShell>
      <FeedbackHeader
        title="Help us improve UMCIMBI for vendors"
        subtitle="A few quick questions about your experience."
      />
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="text-base font-semibold">
              1. Which best describes where you are on UMCIMBI? <span className="text-red-500">*</span>
            </Label>
            <RadioGroup value={q1} onValueChange={setQ1}>
              {Q1_OPTIONS.map((o) => (
                <div key={o.value} className="flex items-start gap-2">
                  <RadioGroupItem value={o.value} id={`q1-${o.value}`} className="mt-1" />
                  <Label htmlFor={`q1-${o.value}`} className="font-normal cursor-pointer">{o.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {q1 === "no_profile" && (
          <>
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Label className="text-base font-semibold">
                  2. What stopped you from completing your vendor profile? <span className="text-red-500">*</span>
                </Label>
                {Q2A_OPTIONS.map((o) => (
                  <div key={o} className="flex items-start gap-2">
                    <Checkbox id={`q2a-${o}`} checked={q2a.includes(o)} onCheckedChange={() => toggle(q2a, o, setQ2a)} className="mt-1" />
                    <Label htmlFor={`q2a-${o}`} className="font-normal cursor-pointer">{o}</Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <Label className="text-base font-semibold">3. What type of services does your business offer?</Label>
                {SERVICES.map((s) => (
                  <div key={s} className="flex items-start gap-2">
                    <Checkbox id={`q3a-${s}`} checked={q3a.includes(s)} onCheckedChange={() => toggle(q3a, s, setQ3a)} className="mt-1" />
                    <Label htmlFor={`q3a-${s}`} className="font-normal cursor-pointer">{s}</Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <Label className="text-base font-semibold">4. What would make you confident enough to list your business on UMCIMBI?</Label>
                <Textarea value={q4a} onChange={(e) => setQ4a(e.target.value)} rows={3} />
              </CardContent>
            </Card>
          </>
        )}

        {q1 === "has_profile" && (
          <>
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Label className="text-base font-semibold">
                  2. Why do you think you haven't received any requests yet? <span className="text-red-500">*</span>
                </Label>
                {Q2B_OPTIONS.map((o) => (
                  <div key={o} className="flex items-start gap-2">
                    <Checkbox id={`q2b-${o}`} checked={q2b.includes(o)} onCheckedChange={() => toggle(q2b, o, setQ2b)} className="mt-1" />
                    <Label htmlFor={`q2b-${o}`} className="font-normal cursor-pointer">{o}</Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <Label className="text-base font-semibold">3. What would make you feel more confident that UMCIMBI will bring you customers?</Label>
                {Q3B_OPTIONS.map((o) => (
                  <div key={o} className="flex items-start gap-2">
                    <Checkbox id={`q3b-${o}`} checked={q3b.includes(o)} onCheckedChange={() => toggle(q3b, o, setQ3b)} className="mt-1" />
                    <Label htmlFor={`q3b-${o}`} className="font-normal cursor-pointer">{o}</Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <Label className="text-base font-semibold">4. Is there anything about how UMCIMBI works that concerns you as a vendor?</Label>
                <Textarea value={q4b} onChange={(e) => setQ4b(e.target.value)} rows={3} />
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="text-base font-semibold">5. If you could change one thing about the UMCIMBI vendor experience, what would it be?</Label>
            <Textarea value={q5} onChange={(e) => setQ5(e.target.value)} rows={3} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="text-base font-semibold">
              6. Would you be willing to spend 10 minutes on a call helping us improve UMCIMBI? <span className="text-red-500">*</span>
            </Label>
            <RadioGroup value={q6} onValueChange={setQ6}>
              {["Yes", "No"].map((o) => (
                <div key={o} className="flex items-center gap-2">
                  <RadioGroupItem value={o} id={`q6-${o}`} />
                  <Label htmlFor={`q6-${o}`} className="font-normal cursor-pointer">{o}</Label>
                </div>
              ))}
            </RadioGroup>
            {q6 === "Yes" && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="phone">Please share your WhatsApp number so we can reach you</Label>
                <Input id="phone" type="tel" placeholder="+27 XXX XXX XXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            )}
          </CardContent>
        </Card>

        <SubmitButton disabled={submitting}>{submitting ? "Submitting..." : "Submit feedback"}</SubmitButton>
      </form>
    </FeedbackShell>
  );
}
