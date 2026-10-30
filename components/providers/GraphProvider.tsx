"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import type { ContextNode, ContextEdge, ContextEntry } from "@/types";

interface GraphContextType {
  entries: ContextEntry[];
  nodes: ContextNode[];
  setNodes: React.Dispatch<React.SetStateAction<ContextNode[]>>;
  edges: ContextEdge[];
  setEdges: React.Dispatch<React.SetStateAction<ContextEdge[]>>;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  refreshNodes: () => Promise<void>;
  addNodeOpen: boolean;
  setAddNodeOpen: (open: boolean) => void;
  error: string;
}
const GraphContext = createContext<GraphContextType | undefined>(undefined);
export function GraphProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<ContextEntry[]>([]);
  const [nodes, setNodes] = useState<ContextNode[]>([]),
    [edges, setEdges] = useState<ContextEdge[]>([]);
  const [isLoading, setIsLoading] = useState(true),
    [selectedNodeId, setSelectedNodeId] = useState<string | null>(null),
    [addNodeOpen, setAddNodeOpen] = useState(false),
    [error, setError] = useState("");
  const inFlight = useRef(false),
    mounted = useRef(true);
  const router = useRouter();
  const refreshNodes = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const r = await fetch("/api/context", { cache: "no-store" });
      if (!r.ok)
        throw new Error("Context could not be refreshed. Please retry.");
      const data = await r.json();
      if (!mounted.current) return;
      setNodes(data.nodes);
      setEntries(data.entries);
      setEdges(data.edges);
      setError("");
      if (!data.ready) router.replace("/connect");
    } catch (e) {
      if (mounted.current)
        setError(
          e instanceof Error ? e.message : "Context could not be loaded.",
        );
    } finally {
      inFlight.current = false;
      if (mounted.current) setIsLoading(false);
    }
  }, [router]);
  useEffect(() => {
    mounted.current = true;
    void refreshNodes();
    const refresh = () => {
      if (!document.hidden) void refreshNodes();
    };
    const timer = setInterval(refresh, 10000);
    window.addEventListener("focus", refresh);
    window.addEventListener("context-updated", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      mounted.current = false;
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("context-updated", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [refreshNodes]);
  return (
    <GraphContext.Provider
      value={{
        entries,
        nodes,
        setNodes,
        edges,
        setEdges,
        isLoading,
        setIsLoading,
        selectedNodeId,
        setSelectedNodeId,
        refreshNodes,
        addNodeOpen,
        setAddNodeOpen,
        error,
      }}
    >
      {children}
    </GraphContext.Provider>
  );
}
export function useGraph() {
  const context = useContext(GraphContext);
  if (!context) throw new Error("useGraph must be used within a GraphProvider");
  return context;
}
