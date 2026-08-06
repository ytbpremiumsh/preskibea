import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { topic, category, tone = "informal", language = "id" } = await req.json();

    if (!topic) {
      return new Response(JSON.stringify({ error: "Topic is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a professional content writer and SEO expert. 
Your task is to write a high-quality, human-like article about educational scholarship programs in Indonesia.
The article should feel natural, engaging, and not like typical AI-generated content. Avoid repetitive phrases, overly formal structures, and common AI tropes.
Use a ${tone} tone and write in ${language === 'id' ? 'Indonesian' : 'English'}.

Follow these SEO guidelines:
1. Write a compelling title (H1).
2. Include clear subheadings (H2, H3) using Markdown.
3. Write an engaging meta description / excerpt.
4. Use relevant keywords naturally.
5. Structure the content for readability (short paragraphs, bullet points).
6. End with a strong call to action related to Prestasi Kita scholarship.

Respond with a valid json object with:
- title: string
- excerpt: string (meta description)
- content: string (Markdown body)
- category: string (suggested category)`;

    const userPrompt = `Write an article about: ${topic}. ${category ? `The category is ${category}.` : ""} Return the result as json.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Lovable-API-Key": lovableApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: `AI gateway error (${response.status}): ${errText}` }), {
        status: response.status === 429 || response.status === 402 ? response.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content;
    
    if (!resultText) {
      throw new Error("Failed to generate content from AI");
    }

    let result;
    try {
      result = JSON.parse(resultText);
    } catch {
      // Fallback if JSON format isn't perfect
      result = { content: resultText, title: topic, category: category || "Umum", excerpt: topic.slice(0, 160) };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
