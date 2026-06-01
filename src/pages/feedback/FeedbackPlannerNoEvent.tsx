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
  { value: "just_browsing", label: "I was just browsing and do not currently have a ceremony to plan" },
  { value: "has_ceremony", label: "I have a ceremony to plan but wasn't sure what to do next" },
  { value: "could_not_find_ceremony", label: "I could not find the type of ceremony I wanted" },
  { value: "technical_issue", label: "I experienced a technical issue" },
  { value: "another_method", label: "I decided to use another method to find vendors" },
  { value: "other", label: "Other" },
];

const CEREMONIES = [
  "Lobola",
  "Umembeso",
  "Umbondo",
  "Umabo (Traditional Zulu Wedding)",
  "Umemulo (Coming of Age)",
  "Imbeleko",
  "Ancestral Ritual",
  "Other",
];

const Q3_OPTIONS = [
  "Finding trusted vendors",
  "Comparing prices",
  "Getting vendor recommendations",
  "Planning my ceremony",
  "Understanding what services I need",
  "Getting quotations quickly",
  "Other",
];

const Q4_OPTIONS = [
  "I wasn't sure what to do next",
  "I couldn't find enough vendors",
  "I didn't trust the vendors yet",
  "The platform was confusing",
  "The platform was missing information",
  "I had a technical problem",
  "I wasn't ready to start planning yet",
  "Other",
];

export default function FeedbackPlannerNoEvent() {
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const [q3, setQ3] = useState<string[]>([]);
  const [q4, setQ4] = useState<string[]>([]);
  const [q5, setQ5] = useState("");
  const [q6, setQ6] = useState("");
  const [q7, setQ7] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const toggle = (arr: string[], v: string, setter: (a: string[]) => void) =>
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!q1 || q3.length === 0 || q4.length === 0 || !q7) {
      toast.error("Please answer all required questions.");
      return;
    }
    setSubmitting(true);
    const willing = q7 === "Yes";
    const { error } = await supabase.from("survey_responses").insert([{
      survey_type: "planner_no_event",
      responses: { q1, q2, q3, q4, q5, q6, q7 },
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
        title="Help us build UMCIMBI for you"
        subtitle="A few quick questions about your experience. Takes 2 minutes."
      />
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="text-base font-semibold">
              1. What best describes your situation? <span className="text-red-500">*</span>
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

        {q1 === "has_ceremony" && (
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Label className="text-base font-semibold">2. Which ceremony are you planning?</Label>
              <RadioGroup value={q2} onValueChange={setQ2}>
                {CEREMONIES.map((c) => (
                  <div key={c} className="flex items-start gap-2">
                    <RadioGroupItem value={c} id={`q2-${c}`} className="mt-1" />
                    <Label htmlFor={`q2-${c}`} className="font-normal cursor-pointer">{c}</Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="text-base font-semibold">
              3. What were you hoping UMCIMBI would help you with? <span className="text-red-500">*</span>
            </Label>
            {Q3_OPTIONS.map((o) => (
              <div key={o} className="flex items-start gap-2">
                <Checkbox id={`q3-${o}`} checked={q3.includes(o)} onCheckedChange={() => toggle(q3, o, setQ3)} className="mt-1" />
                <Label htmlFor={`q3-${o}`} className="font-normal cursor-pointer">{o}</Label>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="text-base font-semibold">
              4. What stopped you from continuing? <span className="text-red-500">*</span>
            </Label>
            {Q4_OPTIONS.map((o) => (
              <div key={o} className="flex items-start gap-2">
                <Checkbox id={`q4-${o}`} checked={q4.includes(o)} onCheckedChange={() => toggle(q4, o, setQ4)} className="mt-1" />
                <Label htmlFor={`q4-${o}`} className="font-normal cursor-pointer">{o}</Label>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="text-base font-semibold">5. If you could change one thing about UMCIMBI, what would it be?</Label>
            <Textarea value={q5} onChange={(e) => setQ5(e.target.value)} rows={3} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="text-base font-semibold">6. Is there anything you expected UMCIMBI to do that it currently does not?</Label>
            <Textarea value={q6} onChange={(e) => setQ6(e.target.value)} rows={3} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="text-base font-semibold">
              7. Would you be willing to spend 10 minutes on a call helping us improve UMCIMBI? <span className="text-red-500">*</span>
            </Label>
            <RadioGroup value={q7} onValueChange={setQ7}>
              {["Yes", "No"].map((o) => (
                <div key={o} className="flex items-center gap-2">
                  <RadioGroupItem value={o} id={`q7-${o}`} />
                  <Label htmlFor={`q7-${o}`} className="font-normal cursor-pointer">{o}</Label>
                </div>
              ))}
            </RadioGroup>
            {q7 === "Yes" && (
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
