import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { text, filename } = await req.json();

    if (!text || text.trim().length < 50) {
      return new Response(
        JSON.stringify({ error: "Document text is too short to analyze" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const truncatedText = text.slice(0, 50000);
    console.log(
      "Processing document:",
      filename,
      "Text length:",
      truncatedText.length
    );

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are a document analysis AI for StudyPadi, an adaptive learning platform. Analyze the provided text and structure it for learning.

Rules:
- Create 3-8 sections based on the document's natural structure
- Each section should have 2-5 chunks of 100-400 words each. Chunks should contain the ACTUAL content from the document, reorganized for learning.
- Generate 2-4 multiple choice questions per section to test understanding
- Generate 8-20 flashcards for key terms/concepts from the entire document
- Each question must have exactly 4 options
- Make explanations clear and educational
- Flashcard difficulty should reflect how complex the concept is`,
            },
            {
              role: "user",
              content: `Analyze this document and structure it for learning:\n\n${truncatedText}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "structure_document",
                description:
                  "Structure a document into sections, chunks, quiz questions, and flashcards for adaptive learning.",
                parameters: {
                  type: "object",
                  properties: {
                    title: {
                      type: "string",
                      description: "A clean descriptive title for the document",
                    },
                    sections: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          chunks: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                content: {
                                  type: "string",
                                  description:
                                    "The actual learning content for this chunk, 100-400 words",
                                },
                              },
                              required: ["content"],
                              additionalProperties: false,
                            },
                          },
                          questions: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                question_text: { type: "string" },
                                options: {
                                  type: "array",
                                  items: { type: "string" },
                                },
                                correct_answer: {
                                  type: "string",
                                  description:
                                    "The exact text of the correct option",
                                },
                                explanation: { type: "string" },
                              },
                              required: [
                                "question_text",
                                "options",
                                "correct_answer",
                                "explanation",
                              ],
                              additionalProperties: false,
                            },
                          },
                        },
                        required: ["title", "chunks", "questions"],
                        additionalProperties: false,
                      },
                    },
                    flashcards: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          term: { type: "string" },
                          definition: { type: "string" },
                          difficulty_level: {
                            type: "string",
                            enum: ["easy", "medium", "hard"],
                          },
                        },
                        required: ["term", "definition", "difficulty_level"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["title", "sections", "flashcards"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "structure_document" },
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded. Please try again in a moment.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI credits exhausted. Please add credits to continue.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      return new Response(
        JSON.stringify({ error: "AI processing failed" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in AI response:", JSON.stringify(aiData).slice(0, 500));
      return new Response(
        JSON.stringify({ error: "AI did not return structured data. Please try again." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const structured = JSON.parse(toolCall.function.arguments);
    console.log("Structured:", structured.title, structured.sections?.length, "sections", structured.flashcards?.length, "flashcards");

    // 1. Create document
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({
        title: structured.title || filename?.replace(/\.[^/.]+$/, "") || "Untitled",
        user_id: user.id,
        original_filename: filename || null,
      })
      .select()
      .single();

    if (docError) {
      console.error("Document insert error:", docError);
      throw new Error("Failed to create document record");
    }

    let totalChunks = 0;
    let totalQuestions = 0;

    // 2. Create sections, chunks, questions
    for (let sIdx = 0; sIdx < structured.sections.length; sIdx++) {
      const section = structured.sections[sIdx];

      const { data: sec, error: secError } = await supabase
        .from("sections")
        .insert({
          document_id: doc.id,
          title: section.title,
          order_index: sIdx,
        })
        .select()
        .single();

      if (secError) {
        console.error("Section insert error:", secError);
        continue;
      }

      if (section.chunks?.length) {
        const chunkRows = section.chunks.map((chunk: any, cIdx: number) => ({
          section_id: sec.id,
          content: chunk.content,
          order_index: cIdx,
          word_count: chunk.content.split(/\s+/).length,
        }));
        const { error: chunkError } = await supabase.from("chunks").insert(chunkRows);
        if (chunkError) console.error("Chunks insert error:", chunkError);
        else totalChunks += chunkRows.length;
      }

      if (section.questions?.length) {
        const questionRows = section.questions.map((q: any) => ({
          section_id: sec.id,
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation || "",
        }));
        const { error: qError } = await supabase.from("questions").insert(questionRows);
        if (qError) console.error("Questions insert error:", qError);
        else totalQuestions += questionRows.length;
      }
    }

    // 3. Insert flashcards
    if (structured.flashcards?.length) {
      const flashcardRows = structured.flashcards.map((f: any) => ({
        user_id: user.id,
        term: f.term,
        definition: f.definition,
        difficulty_level: f.difficulty_level || "medium",
        source: doc.title,
      }));
      const { error: fError } = await supabase.from("flashcards").insert(flashcardRows);
      if (fError) console.error("Flashcards insert error:", fError);
    }

    // 4. Create learning progress
    await supabase.from("learning_progress").insert({
      user_id: user.id,
      document_id: doc.id,
    });

    console.log("Document processed successfully:", doc.id);

    return new Response(
      JSON.stringify({
        documentId: doc.id,
        title: structured.title,
        sectionsCount: structured.sections.length,
        chunksCount: totalChunks,
        questionsCount: totalQuestions,
        flashcardsCount: structured.flashcards?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Process document error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
