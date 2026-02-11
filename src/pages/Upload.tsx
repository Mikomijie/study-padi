import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Upload as UploadIcon,
  FileText,
  Loader2,
  CheckCircle,
  X,
  ChevronRight,
  ChevronDown,
  File,
  FolderOpen,
  Sparkles,
  BookOpen,
  MessageSquare,
  Send,
  AlertCircle,
  Gamepad2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { extractTextFromFile } from "@/lib/textExtractor";

const mockUser = {
  name: "Alex Johnson",
  avatar: "",
  streak: 12,
};

interface AnalysisResult {
  documentId: string;
  title: string;
  sectionsCount: number;
  chunksCount: number;
  questionsCount: number;
  flashcardsCount: number;
  sections?: { id: string; title: string; chunks: { id: string; word_count: number }[] }[];
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function UploadPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Q&A Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate("/auth?mode=login");
    };
    checkAuth();
  }, [navigate]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) validateAndSetFile(droppedFile);
  };

  const validateAndSetFile = (f: File) => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (!validTypes.includes(f.type)) {
      toast({ title: "Invalid file type", description: "Please upload a PDF, DOCX, or TXT file.", variant: "destructive" });
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload a file smaller than 10MB.", variant: "destructive" });
      return;
    }
    setFile(f);
    setAnalysisResult(null);
    setChatMessages([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) validateAndSetFile(selectedFile);
  };

  const analyzeDocument = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setAnalysisProgress(5);
    setAnalysisStatus("Extracting text from document...");

    try {
      // Step 1: Extract text
      const text = await extractTextFromFile(file);
      setAnalysisProgress(25);

      if (text.trim().length < 50) {
        toast({ title: "Too little content", description: "The document doesn't have enough text to analyze.", variant: "destructive" });
        setIsAnalyzing(false);
        return;
      }

      // Step 2: Send to AI for processing
      setAnalysisStatus("AI is analyzing your document...");
      setAnalysisProgress(40);

      const { data, error } = await supabase.functions.invoke("process-document", {
        body: { text, filename: file.name },
      });

      if (error) {
        // supabase functions.invoke wraps non-2xx as FunctionsHttpError
        const message = typeof error === 'object' && 'message' in error 
          ? error.message 
          : String(error);
        throw new Error(message || 'Failed to process document');
      }
      if (data?.error) throw new Error(data.error);

      setAnalysisProgress(85);
      setAnalysisStatus("Loading document structure...");

      // Step 3: Fetch sections with chunks for display
      const { data: sections } = await supabase
        .from("sections")
        .select("id, title, order_index, chunks(id, word_count)")
        .eq("document_id", data.documentId)
        .order("order_index");

      setAnalysisProgress(100);
      setAnalysisResult({
        documentId: data.documentId,
        title: data.title,
        sectionsCount: data.sectionsCount,
        chunksCount: data.chunksCount,
        questionsCount: data.questionsCount,
        flashcardsCount: data.flashcardsCount,
        sections: sections || [],
      });

      toast({ title: "Analysis complete!", description: `${data.sectionsCount} sections and ${data.questionsCount} questions created.` });
    } catch (err: any) {
      console.error("Analysis error:", err);
      toast({ title: "Analysis failed", description: err.message || "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
      setAnalysisStatus("");
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleAskQuestion = async () => {
    if (!chatInput.trim() || !analysisResult) return;
    const userMessage: ChatMessage = { id: Date.now().toString(), role: "user", content: chatInput.trim() };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsAskingQuestion(true);

    try {
      const { data, error } = await supabase.functions.invoke("document-qa", {
        body: {
          question: userMessage.content,
          documentTitle: analysisResult.title,
          sections: analysisResult.sections?.map((s) => s.title) || [],
        },
      });
      if (error) throw error;
      setChatMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: data?.answer || "I couldn't find an answer. Please try rephrasing." },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: "Sorry, I couldn't process your question. Please try again." },
      ]);
    } finally {
      setIsAskingQuestion(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(sectionId) ? next.delete(sectionId) : next.add(sectionId);
      return next;
    });
  };

  const getFileIcon = () => {
    if (!file) return <UploadIcon className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />;
    if (file.type === "application/pdf") return <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-destructive" />;
    return <File className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />;
  };

  return (
    <AppLayout user={mockUser}>
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
            Upload <span className="gradient-text-primary">Study Material</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Upload any document and our AI will break it into digestible learning chunks.
          </p>
        </motion.div>

        {/* Upload Zone */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn("upload-zone relative", isDragging && "drag-active", file && "border-success/50 bg-success/5")}
          >
            {file ? (
              <div className="flex flex-col items-center">
                {getFileIcon()}
                <p className="mt-4 font-medium text-base sm:text-lg text-center break-all px-4">{file.name}</p>
                <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setFile(null); setAnalysisResult(null); setChatMessages([]); }}
                  className="mt-4 text-muted-foreground hover:text-destructive min-h-[44px]"
                >
                  <X className="w-4 h-4 mr-2" /> Remove file
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse-glow">
                  <UploadIcon className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
                <p className="text-base sm:text-lg font-medium mb-2 text-center">Drag and drop your file here</p>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4 text-center px-4">
                  Supports PDF, DOCX, and TXT files up to 10MB
                </p>
                <label className="cursor-pointer">
                  <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileSelect} className="hidden" />
                  <Button variant="outline" asChild className="min-h-[44px]">
                    <span><UploadIcon className="w-4 h-4 mr-2" /> Browse Files</span>
                  </Button>
                </label>
              </div>
            )}
          </div>
        </motion.div>

        {/* Analyze Button */}
        {file && !analysisResult && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <Button
              onClick={analyzeDocument}
              disabled={isAnalyzing}
              className="w-full h-12 sm:h-14 gradient-bg-primary text-primary-foreground text-base sm:text-lg glow-primary"
            >
              {isAnalyzing ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing your document...</>
              ) : (
                <><Sparkles className="w-5 h-5 mr-2" /> Analyze with AI</>
              )}
            </Button>
            {isAnalyzing && (
              <div className="mt-4">
                <Progress value={analysisProgress} className="h-2" />
                <p className="text-xs sm:text-sm text-muted-foreground text-center mt-2">{analysisStatus}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Analysis Results */}
        <AnimatePresence>
          {analysisResult && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
              {/* Success Header */}
              <div className="glass-card p-4 sm:p-6 border-success/30">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-lg sm:text-xl truncate">{analysisResult.title}</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {analysisResult.sectionsCount} sections • {analysisResult.chunksCount} chunks • {analysisResult.questionsCount} questions • {analysisResult.flashcardsCount} flashcards
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => navigate(`/learn/${analysisResult.documentId}`)}
                  className="flex-1 h-12 gradient-bg-primary text-primary-foreground glow-primary"
                >
                  <BookOpen className="w-5 h-5 mr-2" /> Start Learning
                </Button>
                <Button
                  onClick={() => navigate(`/games/${analysisResult.documentId}`)}
                  variant="outline"
                  className="flex-1 h-12"
                >
                  <Gamepad2 className="w-5 h-5 mr-2" /> Play Games
                </Button>
              </div>

              {/* Document Structure */}
              {analysisResult.sections && analysisResult.sections.length > 0 && (
                <div className="glass-card p-4 sm:p-6">
                  <h3 className="font-semibold text-base sm:text-lg mb-4 flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-primary" /> Document Structure
                  </h3>
                  <div className="space-y-2">
                    {analysisResult.sections.map((section: any) => (
                      <div key={section.id} className="border border-border/50 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleSection(section.id)}
                          className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-muted/50 transition-colors min-h-[48px]"
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            {expandedSections.has(section.id) ? (
                              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className="font-medium text-sm sm:text-base truncate">{section.title}</span>
                          </div>
                          <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0 ml-2">
                            {section.chunks?.length || 0} chunks
                          </span>
                        </button>
                        <AnimatePresence>
                          {expandedSections.has(section.id) && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border/50">
                              <div className="p-3 sm:p-4 pl-8 sm:pl-12 space-y-2 bg-muted/30">
                                {section.chunks?.map((chunk: any, index: number) => (
                                  <div key={chunk.id} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    <span>Chunk {index + 1}</span>
                                    <span className="text-muted-foreground">({chunk.word_count} words)</span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Q&A Chat */}
              <div className="glass-card p-4 sm:p-6">
                <h3 className="font-semibold text-base sm:text-lg mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" /> Ask Questions About Your Document
                </h3>
                <div className="max-h-48 sm:max-h-64 overflow-y-auto mb-4 space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-4 px-2">
                      <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Ask any question about your uploaded document and AI will answer based on its content.
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-[80%] rounded-lg px-3 py-2 text-sm", msg.role === "user" ? "gradient-bg-primary text-primary-foreground" : "bg-muted")}>
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                  {isAskingQuestion && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about your document..."
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAskQuestion()}
                    disabled={isAskingQuestion}
                    className="flex-1"
                  />
                  <Button onClick={handleAskQuestion} disabled={!chatInput.trim() || isAskingQuestion} size="icon" className="gradient-bg-primary text-primary-foreground min-h-[40px] min-w-[40px]">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
