import { useState, useCallback, useEffect, useRef } from "react";
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
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const mockUser = {
  name: "Alex Johnson",
  avatar: "",
  streak: 12,
};

interface Section {
  id: string;
  title: string;
  chunks: { id: string; wordCount: number }[];
  isExpanded?: boolean;
}

interface AnalysisResult {
  title: string;
  sections: Section[];
  totalChunks: number;
  questionsGenerated: number;
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
      if (!session) {
        navigate("/auth?mode=login");
      }
    };
    checkAuth();
  }, [navigate]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, []);

  const validateAndSetFile = (file: File) => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, DOCX, or TXT file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setFile(file);
    setAnalysisResult(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const simulateAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simulate analysis progress
    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    clearInterval(progressInterval);
    setAnalysisProgress(100);

    // Mock analysis result
    const result: AnalysisResult = {
      title: file?.name.replace(/\.[^/.]+$/, "") || "Document",
      sections: [
        {
          id: "1",
          title: "Introduction and Overview",
          chunks: [
            { id: "1-1", wordCount: 250 },
            { id: "1-2", wordCount: 320 },
          ],
        },
        {
          id: "2",
          title: "Core Concepts",
          chunks: [
            { id: "2-1", wordCount: 280 },
            { id: "2-2", wordCount: 350 },
            { id: "2-3", wordCount: 200 },
          ],
        },
        {
          id: "3",
          title: "Advanced Topics",
          chunks: [
            { id: "3-1", wordCount: 400 },
            { id: "3-2", wordCount: 280 },
          ],
        },
        {
          id: "4",
          title: "Practical Applications",
          chunks: [
            { id: "4-1", wordCount: 350 },
            { id: "4-2", wordCount: 300 },
            { id: "4-3", wordCount: 420 },
          ],
        },
        {
          id: "5",
          title: "Summary and Conclusions",
          chunks: [
            { id: "5-1", wordCount: 180 },
          ],
        },
      ],
      totalChunks: 11,
      questionsGenerated: 18,
    };

    setAnalysisResult(result);
    setIsAnalyzing(false);

    toast({
      title: "Analysis complete!",
      description: `${result.sections.length} sections and ${result.totalChunks} chunks created.`,
    });
  };

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleAskQuestion = async () => {
    if (!chatInput.trim() || !analysisResult) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput.trim(),
    };
    
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsAskingQuestion(true);
    
    try {
      // Call the edge function for Q&A
      const { data, error } = await supabase.functions.invoke("document-qa", {
        body: {
          question: userMessage.content,
          documentTitle: analysisResult.title,
          sections: analysisResult.sections.map((s) => s.title),
        },
      });
      
      if (error) throw error;
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data?.answer || "I couldn't find an answer to that question. Please try rephrasing or ask something else about the document.",
      };
      
      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Q&A error:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I couldn't process your question. Please try again later.",
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsAskingQuestion(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const getFileIcon = () => {
    if (!file) return <UploadIcon className="w-12 h-12 text-primary" />;
    
    if (file.type === "application/pdf") {
      return <FileText className="w-12 h-12 text-red-400" />;
    }
    return <File className="w-12 h-12 text-blue-400" />;
  };

  return (
    <AppLayout user={mockUser}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Upload <span className="gradient-text-primary">Study Material</span>
          </h1>
          <p className="text-muted-foreground">
            Upload any document and our AI will break it into digestible learning chunks.
          </p>
        </motion.div>

        {/* Upload Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "upload-zone relative",
              isDragging && "drag-active",
              file && "border-success/50 bg-success/5"
            )}
          >
            {file ? (
              <div className="flex flex-col items-center">
                {getFileIcon()}
                <p className="mt-4 font-medium text-lg">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setAnalysisResult(null);
                  }}
                  className="mt-4 text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove file
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse-glow">
                  <UploadIcon className="w-10 h-10 text-primary" />
                </div>
                <p className="text-lg font-medium mb-2">
                  Drag and drop your file here
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports PDF, DOCX, and TXT files up to 10MB
                </p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button variant="outline" asChild>
                    <span>
                      <UploadIcon className="w-4 h-4 mr-2" />
                      Browse Files
                    </span>
                  </Button>
                </label>
              </div>
            )}
          </div>
        </motion.div>

        {/* Analyze Button */}
        {file && !analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Button
              onClick={simulateAnalysis}
              disabled={isAnalyzing}
              className="w-full h-14 gradient-bg-primary text-primary-foreground text-lg glow-primary"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing your document...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Analyze with AI
                </>
              )}
            </Button>
            
            {isAnalyzing && (
              <div className="mt-4">
                <Progress value={analysisProgress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Extracting content and generating quiz questions...
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Analysis Results */}
        <AnimatePresence>
          {analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8"
            >
              {/* Success Header */}
              <div className="glass-card p-6 mb-6 border-success/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-xl">{analysisResult.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {analysisResult.sections.length} sections • {analysisResult.totalChunks} chunks • {analysisResult.questionsGenerated} questions
                    </p>
                  </div>
                </div>
              </div>

              {/* Document Structure */}
              <div className="glass-card p-6 mb-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-primary" />
                  Document Structure
                </h3>
                
                <div className="space-y-2">
                  {analysisResult.sections.map((section) => (
                    <div key={section.id} className="border border-border/50 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {expandedSections.has(section.id) ? (
                            <ChevronDown className="w-5 h-5 text-primary" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          )}
                          <span className="font-medium">{section.title}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {section.chunks.length} chunks
                        </span>
                      </button>
                      
                      <AnimatePresence>
                        {expandedSections.has(section.id) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-border/50"
                          >
                            <div className="p-4 pl-12 space-y-2 bg-muted/30">
                              {section.chunks.map((chunk, index) => (
                                <div
                                  key={chunk.id}
                                  className="flex items-center gap-3 text-sm"
                                >
                                  <FileText className="w-4 h-4 text-muted-foreground" />
                                  <span>Chunk {index + 1}</span>
                                  <span className="text-muted-foreground">
                                    ({chunk.wordCount} words)
                                  </span>
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

              {/* Ask Questions Section */}
              <div className="glass-card p-6 mb-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Ask Questions About Your Document
                </h3>
                
                {/* Chat Messages */}
                <div className="max-h-64 overflow-y-auto mb-4 space-y-3">
                  {chatMessages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Ask any question about your uploaded document and AI will answer based on its content.
                    </p>
                  ) : (
                    chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "p-3 rounded-lg text-sm",
                          msg.role === "user"
                            ? "bg-primary/10 ml-8"
                            : "bg-muted/50 mr-8"
                        )}
                      >
                        <p className="font-medium text-xs mb-1 text-muted-foreground">
                          {msg.role === "user" ? "You" : "AI Assistant"}
                        </p>
                        <p>{msg.content}</p>
                      </div>
                    ))
                  )}
                  {isAskingQuestion && (
                    <div className="bg-muted/50 mr-8 p-3 rounded-lg">
                      <p className="font-medium text-xs mb-1 text-muted-foreground">AI Assistant</p>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                
                {/* Chat Input */}
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask a question about this document..."
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAskQuestion()}
                    disabled={isAskingQuestion}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAskQuestion}
                    disabled={!chatInput.trim() || isAskingQuestion}
                    size="icon"
                    className="gradient-bg-primary"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Start Learning Button */}
              <Button
                onClick={() => navigate("/learn")}
                className="w-full h-14 gradient-bg-primary text-primary-foreground text-lg glow-primary"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Start Learning
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
