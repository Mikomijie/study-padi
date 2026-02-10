import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { text, filename } = await req.json();
    if (!text || text.trim().length < 50) {
      return new Response(JSON.stringify({ error: "Document text is too short to analyze." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Processing document:", filename, "text length:", text.length);

    // Step 1: Use AI to analyze and structure the document
    const analysisPrompt = `You are a document analysis AI for an adaptive learning platform called StudyPadi.

Analyze the following document text and create a structured learning breakdown.

INSTRUCTIONS:
1. Create 3-7 logical sections based on the document content
2. For each section, break content into learning chunks of 150-400 words each
3. For each section, generate 2-4 multiple choice quiz questions

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "title": "A clear, concise title for this document",
  "sections": [
    {
      "title": "Section Title",
      "chunks": [
        {
          "content": "The actual learning content text for this chunk...",
          "word_count": 250
        }
      ],
      "questions": [
        {
          "question_text": "What is...?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct_answer": "Option B",
          "explanation": "This is correct because..."
        }
      ]
    }
  ]
}

DOCUMENT TEXT:
${text.substring(0, 15000)}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "user", content: analysisPrompt },
        ],
        max_tokens: 8000,
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let rawContent = aiData.choices?.[0]?.message?.content || "";
    
    // Clean up: remove markdown code blocks if present
    rawContent = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    let analysis;
    try {
      analysis = JSON.parse(rawContent);
    } catch (parseErr) {
      console.error("Failed to parse AI response:", rawContent.substring(0, 500));
      return new Response(JSON.stringify({ error: "AI returned invalid format. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("AI analysis complete:", analysis.title, analysis.sections?.length, "sections");

    // Step 2: Save to database
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({
        title: analysis.title || filename?.replace(/\.[^/.]+$/, "") || "Untitled Document",
        user_id: user.id,
        original_filename: filename || null,
      })
      .select("id")
      .single();

    if (docError) {
      console.error("Document insert error:", docError);
      return new Response(JSON.stringify({ error: "Failed to save document" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const documentId = doc.id;
    let totalChunks = 0;
    let totalQuestions = 0;
    const sectionResults = [];

    for (let sIdx = 0; sIdx < analysis.sections.length; sIdx++) {
      const section = analysis.sections[sIdx];

      // Insert section
      const { data: sectionData, error: sectionError } = await supabase
        .from("sections")
        .insert({
          document_id: documentId,
          title: section.title,
          order_index: sIdx,
        })
        .select("id")
        .single();

      if (sectionError) {
        console.error("Section insert error:", sectionError);
        continue;
      }

      const sectionId = sectionData.id;
      const chunkIds = [];

      // Insert chunks
      for (let cIdx = 0; cIdx < (section.chunks || []).length; cIdx++) {
        const chunk = section.chunks[cIdx];
        const { data: chunkData, error: chunkError } = await supabase
          .from("chunks")
          .insert({
            section_id: sectionId,
            content: chunk.content,
            word_count: chunk.word_count || chunk.content.split(/\s+/).length,
            order_index: cIdx,
          })
          .select("id")
          .single();

        if (!chunkError && chunkData) {
          chunkIds.push({ id: chunkData.id, wordCount: chunk.word_count || 0 });
          totalChunks++;
        }
      }

      // Insert questions
      for (const q of (section.questions || [])) {
        const { error: qError } = await supabase
          .from("questions")
          .insert({
            section_id: sectionId,
            question_text: q.question_text,
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation || null,
          });

        if (!qError) totalQuestions++;
      }

      sectionResults.push({
        id: sectionId,
        title: section.title,
        chunks: chunkIds,
      });
    }

    // Create learning progress entry
    const firstSectionId = sectionResults[0]?.id || null;
    await supabase.from("learning_progress").insert({
      user_id: user.id,
      document_id: documentId,
      current_section_id: firstSectionId,
    });

    console.log("Document processed:", documentId, totalChunks, "chunks", totalQuestions, "questions");

    return new Response(JSON.stringify({
      documentId,
      title: analysis.title,
      sections: sectionResults,
      totalChunks,
      questionsGenerated: totalQuestions,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Process document error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
