import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const fallback = {
  insight: "We don't have enough data to assess this quote right now.",
  sentiment: "neutral",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const authClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { price, category, ceremonyType, vendorRating, reviewCount, isVerified, jobsCompleted, notes } = await req.json();

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not set');
      return new Response(
        JSON.stringify(fallback),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const safenotes = notes ? String(notes).slice(0, 500) : null;
    const anthropicResponse = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 200,
          system: `You are a helpful assistant for UMCIMBI, a South African traditional ceremony planning platform. You help families planning ceremonies like umabo, umembeso, umemulo, lobola, imbeleko and family introductions understand whether vendor quotes are reasonable. You know the South African market well — including typical pricing differences between KwaZulu-Natal and Gauteng, and what different ceremony types typically require in terms of vendors and spend. You always respond in plain, warm, practical language. Never use jargon. Keep responses to 2 sentences maximum. Respond ONLY with a JSON object in this exact format with no preamble or markdown: {"insight": "your 1-2 sentence insight here", "sentiment": "good" | "neutral" | "caution"} sentiment rules: - "good": quote looks reasonable or strong value for this ceremony type and category - "caution": quote seems high, unusually low, or something worth questioning - "neutral": not enough data to form a clear view`,
          messages: [
            {
              role: "user",
              content: `A vendor has quoted R${price} for ${category} services for a ${ceremonyType} ceremony. The vendor has ${jobsCompleted} completed jobs on the platform, a rating of ${vendorRating ?? 'no rating yet'} from ${reviewCount} reviews, and is ${isVerified ? 'verified' : 'not yet verified'} by UMCIMBI. ${safenotes ? `Their quote notes say: "${safenotes}"` : ''} Give a brief, helpful insight about whether this quote seems reasonable for this type of ceremony in South Africa.`
            }
          ]
        })
      }
    );

    const anthropicData = await anthropicResponse.json();
    if (!anthropicResponse.ok) {
      console.error('Anthropic API error:', anthropicResponse.status, anthropicData?.error?.message);
      return new Response(JSON.stringify(fallback), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const rawText = anthropicData?.content?.[0]?.text || '';

    let insight = fallback.insight;
    let sentiment = fallback.sentiment;

    try {
      // Handle potential markdown code blocks wrapping the JSON
      const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(cleaned);
      insight = parsed.insight?.slice(0, 200) || insight;
      sentiment = ['good', 'neutral', 'caution'].includes(parsed.sentiment)
        ? parsed.sentiment
        : 'neutral';
    } catch (e) {
      console.error('JSON parse error:', e, 'rawText:', rawText);
    }

    try {
      const _supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      await _supabase.from('platform_events').insert({
        event_type: 'quote_analyser_called',
        actor_type: 'system',
        ceremony_type: ceremonyType ?? null,
        metadata: {
          price,
          category,
          ceremony_type: ceremonyType,
          sentiment_returned: sentiment,
          vendor_jobs_completed: jobsCompleted ?? null,
          is_verified: isVerified ?? false,
          vendor_rating: vendorRating ?? null,
          review_count: reviewCount ?? null,
        },
      });
    } catch (logErr) {
      console.error('quote_analyser_called log failed:', logErr);
    }

    return new Response(
      JSON.stringify({ insight, sentiment }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyse-quote:', error);
    return new Response(
      JSON.stringify(fallback),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
