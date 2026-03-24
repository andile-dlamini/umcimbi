import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { price, category, ceremonyType, vendorRating, reviewCount, isVerified, jobsCompleted, notes } = await req.json();

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not set');
      return new Response(
        JSON.stringify(fallback),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
              content: `A vendor has quoted R${price} for ${category} services for a ${ceremonyType} ceremony. The vendor has ${jobsCompleted} completed jobs on the platform, a rating of ${vendorRating ?? 'no rating yet'} from ${reviewCount} reviews, and is ${isVerified ? 'verified' : 'not yet verified'} by UMCIMBI. ${notes ? `Their quote notes say: "${notes}"` : ''} Give a brief, helpful insight about whether this quote seems reasonable for this type of ceremony in South Africa.`
            }
          ]
        })
      }
    );

    const anthropicData = await anthropicResponse.json();
    console.log('Anthropic response status:', anthropicResponse.status);
    console.log('Anthropic full response:', JSON.stringify(anthropicData));
    const rawText = anthropicData?.content?.[0]?.text || '';
    console.log('Raw text:', rawText);

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
