import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SyncContextType {
  online: boolean;
  isElectron: boolean;
  syncDocuments: (docs: any[]) => Promise<void>;
  fetchDocuments: () => Promise<any[]>;
  saveDocument: (doc: any) => Promise<any>;
}

const SyncContext = createContext<SyncContextType | null>(null);

// Get the electron API safely (it won't exist in browser)
const win = window as any;
const electronAPI = win.electronAPI;

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(navigator.onLine);
  const isElectron = !!electronAPI;

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      toast.info("Back online. Syncing changes...");
      triggerGlobalSync();
    };
    const handleOffline = () => {
      setOnline(false);
      toast.warning("You are currently offline. Changes will be saved locally.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerGlobalSync = async () => {
    if (!online || !isElectron) return;
    
    try {
      const localDocs = await electronAPI.getLocalDocuments();
      const dirtyDocs = localDocs.filter((d: any) => d.isDirty);
      
      if (dirtyDocs.length > 0) {
        for (const doc of dirtyDocs) {
          const { id, isDirty, lastSync, ...cleanDoc } = doc;
          const { error } = await supabase.from('documents').upsert(cleanDoc);
          if (!error) {
            await electronAPI.saveLocalDocument({ ...doc, isDirty: false, lastSync: new Date().toISOString() });
          }
        }
        toast.success(`Successfully synced ${dirtyDocs.length} documents!`);
      }
    } catch (err) {
      console.error("Sync error:", err);
    }
  };

  const fetchDocuments = async () => {
    if (online) {
      const { data, error } = await supabase
        .from('documents')
        .select('*, projects(name)')
        .order('created_at', { ascending: false });

      if (error) {
        if (isElectron) return await electronAPI.getLocalDocuments();
        throw error;
      }
      
      // Update local cache if in Electron
      if (isElectron && data) {
        for (const doc of data) {
          await electronAPI.saveLocalDocument({ ...doc, isDirty: false, lastSync: new Date().toISOString() });
        }
      }
      return data;
    } else if (isElectron) {
      return await electronAPI.getLocalDocuments();
    }
    return [];
  };

  const saveDocument = async (doc: any) => {
    if (online) {
      const { data, error } = await supabase.from('documents').upsert(doc).select().single();
      if (error) throw error;
      
      if (isElectron) {
        await electronAPI.saveLocalDocument({ ...data, isDirty: false, lastSync: new Date().toISOString() });
      }
      return data;
    } else if (isElectron) {
      // Save locally with dirty flag
      const offlineDoc = { 
        ...doc, 
        id: doc.id || `offline_${Date.now()}`,
        isDirty: true,
        created_at: doc.created_at || new Date().toISOString()
      };
      await electronAPI.saveLocalDocument(offlineDoc);
      return offlineDoc;
    } else {
      throw new Error("No internet connection and not in Desktop mode.");
    }
  };

  const syncDocuments = async (docs: any[]) => {
    // Basic sync runner
    await triggerGlobalSync();
  };

  return (
    <SyncContext.Provider value={{ online, isElectron, syncDocuments, fetchDocuments, saveDocument }}>
      {children}
    </SyncContext.Provider>
  );
}

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) throw new Error("useSync must be used within a SyncProvider");
  return context;
};
