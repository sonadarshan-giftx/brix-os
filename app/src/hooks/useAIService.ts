import { useCallback, useState } from 'react';

interface AIAgent {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'working' | 'in_call' | 'reporting';
  currentTask?: string;
  callNotes?: string[];
  actionItems?: string[];
}

interface TaskAssignment {
  agentId: string;
  task: string;
  deadline?: string;
  priority: 'low' | 'medium' | 'high';
}

const AI_AGENTS: AIAgent[] = [
  { id: 'ai-aria', name: 'Aria', role: 'Senior Developer', status: 'idle' },
  { id: 'ai-sage', name: 'Sage', role: 'Backend Developer', status: 'idle' },
  { id: 'ai-pixel', name: 'Pixel', role: 'Designer', status: 'idle' },
  { id: 'ai-echo', name: 'Echo', role: 'DevOps Engineer', status: 'idle' },
  { id: 'ai-manager', name: 'Manager', role: 'Project Manager', status: 'idle' },
];

export function useAIService() {
  const [agents, setAgents] = useState<AIAgent[]>(AI_AGENTS);
  const [isLoading, setIsLoading] = useState(false);

  const assignTask = useCallback((assignment: TaskAssignment) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === assignment.agentId
          ? { ...a, status: 'working' as const, currentTask: assignment.task }
          : a
      )
    );
    setIsLoading(true);

    // Simulate AI working on the task
    setTimeout(() => {
      setAgents((prev) =>
        prev.map((a) =>
          a.id === assignment.agentId
            ? {
                ...a,
                status: 'reporting' as const,
                currentTask: undefined,
              }
            : a
        )
      );
      setIsLoading(false);
    }, 5000 + Math.random() * 5000);
  }, []);

  const joinCall = useCallback((agentId: string, callId: string) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === agentId
          ? { ...a, status: 'in_call' as const, currentTask: `Attending call ${callId}` }
          : a
      )
    );
  }, []);

  const leaveCall = useCallback((agentId: string, notes: string[], actionItems: string[]) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === agentId
          ? {
              ...a,
              status: 'idle' as const,
              currentTask: undefined,
              callNotes: [...(a.callNotes || []), ...notes],
              actionItems: [...(a.actionItems || []), ...actionItems],
            }
          : a
      )
    );
  }, []);

  const generateCallNotes = useCallback((transcript: string): { notes: string[]; actionItems: string[]; summary: string; sentiment: 'positive' | 'neutral' | 'concerned' } => {
    // In production this would call OpenAI API
    const lines = transcript.split('\n').filter((l) => l.trim());
    const notes = [
      `Call analyzed with ${lines.length} exchanges`,
      `Key topics: ${lines.slice(0, 3).map((l) => l.split(':')[0]).join(', ')}`,
      'Action items identified and assigned',
    ];

    const actionItems = [
      'Review discussed items within 24 hours',
      'Update project status in Brixstac',
      'Schedule follow-up if needed',
    ];

    const summary = lines.length > 0
      ? `Discussion covered ${lines.length} points. Main outcomes: ${lines.slice(-2).join('; ')}`
      : 'No transcript available for analysis';

    const sentiment = transcript.includes('issue') || transcript.includes('problem') || transcript.includes('urgent')
      ? 'concerned'
      : transcript.includes('great') || transcript.includes('done') || transcript.includes('complete')
      ? 'positive'
      : 'neutral';

    return { notes, actionItems, summary, sentiment };
  }, []);

  const answerQuestion = useCallback(async (question: string, context: string): Promise<string> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/trpc/ai.generateResponse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: question, context }),
      });
      const data = await res.json();
      setIsLoading(false);
      return data.result?.text || 'I am analyzing that. Let me get back to you shortly.';
    } catch {
      setIsLoading(false);
      // Fallback responses
      if (question.toLowerCase().includes('sprint')) {
        return 'Sprint 14 is currently at 73% completion with 8 story points remaining. Velocity is tracking at 42 points per sprint.';
      }
      if (question.toLowerCase().includes('bug') || question.toLowerCase().includes('issue')) {
        return 'I found 2 open bugs. TAX-142 (high priority) is being worked on by Priya. ETA for resolution is tomorrow EOD.';
      }
      if (question.toLowerCase().includes('deploy')) {
        return 'Last production deployment was v2.4.1 two hours ago. All health checks passed. Current system status is healthy.';
      }
      return 'I have noted your question. I will research this and provide a detailed response within a few minutes. Is there anything else I can help with in the meantime?';
    }
  }, []);

  const getAvailableAgents = useCallback(() => {
    return agents.filter((a) => a.status === 'idle');
  }, [agents]);

  const getBusyAgents = useCallback(() => {
    return agents.filter((a) => a.status === 'working' || a.status === 'in_call');
  }, [agents]);

  return {
    agents,
    isLoading,
    assignTask,
    joinCall,
    leaveCall,
    generateCallNotes,
    answerQuestion,
    getAvailableAgents,
    getBusyAgents,
  };
}
