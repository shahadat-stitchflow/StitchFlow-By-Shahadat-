
import { useState, useEffect, useCallback } from 'react';
import { CollaborationState, UserProfile } from '../types';

const CHANNEL_NAME = 'stitchflow_collab';

export const useCollaboration = (projectId: string, user: UserProfile) => {
  const [collaborators, setCollaborators] = useState<Record<string, CollaborationState>>({});
  const [bc] = useState(() => new BroadcastChannel(CHANNEL_NAME));

  const broadcastPresence = useCallback((section?: string) => {
    const presence: CollaborationState = {
      userId: user.id || 'default',
      userName: user.name,
      userColor: user.color || '#6366f1',
      activeSection: section,
      lastSeen: Date.now(),
    };
    bc.postMessage({ type: 'PRESENCE', projectId, presence });
  }, [bc, projectId, user]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, projectId: msgProjectId, presence } = event.data;
      if (msgProjectId !== projectId) return;

      if (type === 'PRESENCE') {
        setCollaborators(prev => ({
          ...prev,
          [presence.userId]: presence
        }));
      }
    };

    bc.onmessage = handleMessage;

    // Heartbeat to keep presence active
    const interval = setInterval(() => {
      broadcastPresence();
    }, 3000);

    // Initial broadcast
    broadcastPresence();

    // Cleanup stale collaborators (not seen for > 10s)
    const cleanup = setInterval(() => {
      setCollaborators(prev => {
        const now = Date.now();
        const filtered = { ...prev };
        let changed = false;
        Object.keys(filtered).forEach(id => {
          if (now - filtered[id].lastSeen > 10000 || id === user.id) {
            delete filtered[id];
            changed = true;
          }
        });
        return changed ? filtered : prev;
      });
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(cleanup);
      bc.close();
    };
  }, [bc, projectId, user.id, broadcastPresence]);

  const onFocusSection = (sectionId: string) => {
    broadcastPresence(sectionId);
  };

  return { collaborators, onFocusSection };
};
