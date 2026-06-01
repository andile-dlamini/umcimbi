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

const CEREMONIES = [
  "Lobola", "Umembeso", "Umbondo",
  "Umabo (Traditional Zulu Wedding)",
  "Umemulo (Coming of Age)",
  "Imbeleko", "Ancestral Ritual", "Other",
];

const SERVICES = [
  "Catering", "Decor & Styling", "Photographer / Videographer", "Attire & Tailoring",
  "Tents & Stretch Tents", "Transport", "Livestock / Abattoir", "Makeup & Beauty",
  "Invitations, Stationery & Printing", "Florist", "Cakes & Baking", "DJ / Sound & Audio",
  "Drinks & Ice Delivery", "Cold Room Hire", "Mobile Toilets & Sanitation", "Other",
];

const Q3_OPTIONS = [
  "Yes, I found vendors",
  "No, I couldn't find suitable vendors",
  "I didn't look for vendors yet",
];

const Q4_OPTIONS = [
  "I could not find suitable vendors",
  "I found vendors but did not trust them enough to contact them",
  "I wanted pricing information before reaching out",
  "I was not sure how to contact vendors",
  "I found vendors elsewhere",
  "I postponed or cancelled my event",
  "I experienced a technical issue",
  "Other",
];

const Q5_OPTIONS = [
  "Reviews from previous customers",
  "Verified vendors",
  "More photos of their work",
  "Visible pricing information",
  "A guarantee that vendors will respond",
  "More detailed vendor profiles",
  "Other",
];

export default function FeedbackPlannerNoVendor() {
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState<string[]>([]);
  const [q3, setQ3] = useState("");
  const [q4, setQ4] = useState("");
  const [q5, setQ5] = useState<string[]>([]);
  const [q6, setQ6] = useState("");
  const [q7, setQ7] = useState("");
  const [q8, setQ8] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const toggle = (arr: string[], v: string, setter: (a: string[]) => void) =>
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!q1 || q2.length === 0 || !q3 || !q4 || !q8) {
      toast.error("Please answer all required questions.");
      return;
    }
    setSubmitting(true);
    const willing = q8 === "Yes";
    const { error } = await supabase.from("survey_responses").insert([{
      survey_type: "planner_no_vendor",
      responses: { q1, q2, q3, q4, q5, q6, q7, q8 },
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
        title="Tell us about your vendor search"
        subtitle="A few quick questions to help us improve UMCIMBI."
      />
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="text-base font-semibold">1. Which ceremony were you planning? <span className="text-red-500">*</span></Label>
            <RadioGroup value={q1} onValueChange={setQ1}>
              {CEREMONIES.map((c) => (
                <div key={c} className="flex items-start gap-2">
                  <RadioGroupItem value={c} id={`q1-${c}`} className="mt-1" />
                  <Label htmlFor={`q1-${c}`} className="font-normal cursor-pointer">{c}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="text-base font-semibold">2. What services were you looking for? <span className="text-red-500">*</span></Label>
            {SERVICES.map((s) => (
              <div key={s} className="flex items-start gap-2">
                <Checkbox id={`q2-${s}`} checked={q2.includes(s)} onCheckedChange={() => toggle(q2, s, setQ2)} className="mt-1" />
                <Label htmlFor={`q2-${s}`} className="font-normal cursor-pointer">{s}</Label>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="text-base font-semibold">3. Did you find vendors on the platform that matched what you needed? <span className="text-red-500">*</span></Label>
            <RadioGroup value={q3} onValueChange={setQ3}>
              {Q3_OPTIONS.map((o) => (
                <div key={o} className="flex items-start gap-2">
                  <RadioGroupItem value={o} id={`q3-${o}`} className="mt-1" />
                  <Label htmlFor={`q3-${o}`} className="font-normal cursor-pointer">{o}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="text-base font-semibold">4. What best describes why you did not contact a vendor? <span className="text-red-500">*</span></Label>
            <RadioGroup value={q4} onValueChange={setQ4}>
              {Q4_OPTIONS.map((o) => (
                <div key={o} className="flex items-start gap-2">
                  <RadioGroupItem value={o} id={`q4-${o}`} className="mt-1" />
                  <Label htmlFor={`q4-${o}`} className="font-normal cursor-pointer">{o}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="text-base font-semibold">5. What would have made you feel more comfortable contacting a vendor?</Label>
            {Q5_OPTIONS.map((o) => (
              <div key={o} className="flex items-start gap-2">
                <Checkbox id={`q5-${o}`} checked={q5.includes(o)} onCheckedChange={() => toggle(q5, o, setQ5)} className="mt-1" />
                <Label htmlFor={`q5-${o}`} className="font-normal cursor-pointer">{o}</Label>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="text-base font-semibold">6. What did you expect to happen after creating your event?</Label>
            <Textarea value={q6} onChange={(e) => setQ6(e.target.value)} rows={3} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="text-base font-semibold">7. If UMCIMBI worked perfectly for you, what would it do? Is there anything missing that would make you use it?</Label>
            <Textarea value={q7} onChange={(e) => setQ7(e.target.value)} rows={3} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="text-base font-semibold">8. Would you be willing to spend 10 minutes on a call helping us improve UMCIMBI? <span className="text-red-500">*</span></Label>
            <RadioGroup value={q8} onValueChange={setQ8}>
              {["Yes", "No"].map((o) => (
                <div key={o} className="flex items-center gap-2">
                  <RadioGroupItem value={o} id={`q8-${o}`} />
                  <Label htmlFor={`q8-${o}`} className="font-normal cursor-pointer">{o}</Label>
                </div>
              ))}
            </RadioGroup>
            {q8 === "Yes" && (
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
