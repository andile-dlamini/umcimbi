import { useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, Camera, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const INDIGO = "#111872";
const GOLD = "#E8A838";

function Header() {
  return (
    <header
      className="w-full px-6 py-5 text-center"
      style={{ backgroundColor: INDIGO }}
    >
      <div
        className="text-2xl font-bold tracking-wide"
        style={{ color: GOLD, fontFamily: "Fraunces, serif" }}
      >
        UMCIMBI
      </div>
      <div className="text-white/90 text-sm mt-1">Identity Verification</div>
    </header>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 px-5 py-8 max-w-md mx-auto w-full">{children}</main>
    </div>
  );
}

export default function SelfieSubmission() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!token) {
    return (
      <Shell>
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <p className="text-slate-700">
            This link is invalid or has already been used.
          </p>
        </div>
      </Shell>
    );
  }

  if (success) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ backgroundColor: INDIGO }}
      >
        <CheckCircle2 className="h-16 w-16 mb-6" style={{ color: GOLD }} />
        <h1
          className="text-3xl font-bold mb-4"
          style={{ color: GOLD, fontFamily: "Fraunces, serif" }}
        >
          Thank you!
        </h1>
        <p className="text-white/90 max-w-sm leading-relaxed">
          Your selfie has been submitted. We will review your profile shortly.
        </p>
        <div
          className="mt-8 text-sm tracking-widest"
          style={{ color: GOLD }}
        >
          — UMCIMBI
        </div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  };

  const readAsBase64 = (f: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(",") ? result.split(",")[1] : result;
        resolve(base64);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(f);
    });

  const handleSubmit = async () => {
    if (!file) return;
    setSubmitting(true);
    setError(null);
    try {
      const photo_base64 = await readAsBase64(file);
      const { data, error: fnErr } = await supabase.functions.invoke(
        "vendor-selfie-submission",
        { body: { token, photo_base64, mime_type: file.type } }
      );
      if (fnErr) throw fnErr;
      if (data && (data as any).success === false) {
        throw new Error((data as any).error || "Submission failed");
      }
      setSuccess(true);
    } catch (e: any) {
      console.error(e);
      setError(
        e?.message ||
          "We couldn't submit your photo. Please check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shell>
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
        <p className="text-slate-700 leading-relaxed">
          Please take a clear photo of yourself holding your ID document (ID
          card, passport, or driver's licence). Make sure your face and the ID
          are both clearly visible.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition active:scale-[0.99] disabled:opacity-60"
          style={{ backgroundColor: INDIGO }}
        >
          <Camera className="h-5 w-5" />
          {file ? "Retake / Choose Different" : "Take Photo / Choose File"}
        </button>

        {previewUrl && (
          <div className="rounded-xl overflow-hidden border border-slate-200">
            <img
              src={previewUrl}
              alt="Selected selfie"
              className="w-full h-auto object-contain bg-slate-100"
            />
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!file || submitting}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition active:scale-[0.99] disabled:opacity-50"
          style={{ backgroundColor: GOLD }}
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Submitting…
            </>
          ) : (
            "Submit"
          )}
        </button>
      </div>
    </Shell>
  );
}
