import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, arrayUnion, limit, where, writeBatch, deleteDoc, getDocs, setDoc, getDoc 
} from "firebase/firestore"; // ✅ ΠΡΟΣΤΕΘΗΚΑΝ ΤΑ setDoc ΚΑΙ getDoc
import { db } from "../firebase-config";
import { useAuth } from "./AuthContext";
import { Experience, Notification, AppComment } from "../types";

interface DataContextType {
  savedPostIds: string[]; 
  toggleSavePost: (expId: string) => Promise<void>; 
  getSavedExperiences: () => Promise<Experience[]>;
  experiences: Experience[];
  addExperience: (exp: any) => Promise<void>;
  addComment: (expId: string, text: string, expAuthorUid: string, replyToUid?: string, parentId?: string) => Promise<void>;
  deleteComment: (expId: string, commentId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  toggleCommentHelpful: (expId: string, comment: AppComment) => Promise<void>;
  loadMore: () => void;
  hasMore: boolean;
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notifId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>; 
  refreshNotifications: () => void;
  deleteExperience: (expId: string) => Promise<void>;
  // ✅ ΝΕΑ ΠΕΔΙΑ ΓΙΑ SCROLL
  homeScrollPos: number;
  setHomeScrollPos: (pos: number) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // ✅ ΝΕΟ STATE ΓΙΑ ΤΗ ΘΕΣΗ ΤΟΥ SCROLL
  const [homeScrollPos, setHomeScrollPos] = useState(0);

  // ✅ ΝΕΟ STATE ΓΙΑ ΤΑ ΑΠΟΘΗΚΕΥΜΕΝΑ POSTS
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);

  const { user, loading: authLoading } = useAuth();

  // Listener για τις εμπειρίες (Feed)
  useEffect(() => {
    if (authLoading || !user) return;
    const q = query(collection(db, "experiences"), orderBy("createdAt", "desc"), limit(visibleCount));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const docsData = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt?.toMillis() || Date.now(),
        })) as Experience[];
        setExperiences(docsData);
        setHasMore(docsData.length >= visibleCount);
        setIsLoading(false);
    }, (err) => { setIsLoading(false); });
    return () => unsubscribe();
  }, [user, authLoading, visibleCount]);

  // Listener για τις ειδοποιήσεις
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "notifications"), where("toUid", "==", user.uid), orderBy("createdAt", "desc"), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Notification[];
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    });
    return () => unsubscribe();
  }, [user]);

  // ✅ ΝΕΟ LISTENER: Για τα αποθηκευμένα posts του χρήστη
  useEffect(() => {
    if (!user) {
        setSavedPostIds([]);
        return;
    }
    const q = collection(db, "users", user.uid, "saved_posts");
    const unsub = onSnapshot(q, (snapshot) => {
        const ids = snapshot.docs.map(doc => doc.id);
        setSavedPostIds(ids);
    });
    return () => unsub();
  }, [user]);

  // ✅ ΝΕΑ ΣΥΝΑΡΤΗΣΗ: Για αποθήκευση/αφαίρεση post
  const toggleSavePost = async (expId: string) => {
    if (!user) return;
    const ref = doc(db, "users", user.uid, "saved_posts", expId);

    if (savedPostIds.includes(expId)) {
        await deleteDoc(ref); // Unsave
    } else {
        await setDoc(ref, { savedAt: serverTimestamp() }); // Save
    }
  };

  // ✅ ΝΕΑ ΣΥΝΑΡΤΗΣΗ: Για να φέρνουμε τα αποθηκευμένα στο Προφίλ
  const getSavedExperiences = async () => {
    if (!user || savedPostIds.length === 0) return [];

    const promises = savedPostIds.map(async (id) => {
        const found = experiences.find(e => e.id === id);
        if (found) return found;

        const docRef = doc(db, "experiences", id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            return { id: snap.id, ...snap.data(), createdAt: snap.data().createdAt?.toMillis() || Date.now() } as Experience;
        }
        return null;
    });

    const results = await Promise.all(promises);
    return results.filter(e => e !== null) as Experience[];
  };

  const loadMore = () => setVisibleCount(prev => prev + 10);

  const addExperience = async (newExp: any) => {
    if (!user) return;
    await addDoc(collection(db, "experiences"), { ...newExp, matches: 0, createdAt: serverTimestamp(), authorUid: user.uid, comments: [] });
  };

  const addComment = async (expId: string, text: string, expAuthorUid: string, replyToUid?: string, parentId?: string) => {
    if (!user) return;
    
    const comment = { 
      id: Date.now().toString(), 
      authorUid: user.uid, 
      text, 
      createdAt: new Date().toISOString(),
      parentId: parentId || null 
    };
    
    const expRef = doc(db, "experiences", expId);
    await updateDoc(expRef, { comments: arrayUnion(comment) });

    const targetUid = replyToUid || expAuthorUid;
    if (targetUid && targetUid !== user.uid) {
      await addDoc(collection(db, "notifications"), {
        toUid: targetUid, 
        fromUid: user.uid, 
        type: replyToUid ? 'reply' : 'comment',
        text: text.substring(0, 50), 
        expId: expId, 
        commentId: comment.id, 
        read: false, 
        createdAt: serverTimestamp()
      });
    }
  };

  const deleteComment = async (expId: string, commentId: string) => {
    if (!user) return;

    const expDoc = experiences.find(e => e.id === expId);
    if (!expDoc) return;

    const idsToDelete = new Set<string>();
    idsToDelete.add(commentId);

    const collectReplies = (parentId: string) => {
        expDoc.comments?.forEach(c => {
            if (c.parentId === parentId) {
                idsToDelete.add(c.id);
                collectReplies(c.id); 
            }
        });
    };
    collectReplies(commentId);

    const updatedComments = expDoc.comments?.filter(c => !idsToDelete.has(c.id)) || [];

    const expRef = doc(db, "experiences", expId);
    
    try {
        await updateDoc(expRef, { comments: updatedComments });
    } catch (err) {
        console.error("Error deleting comment:", err);
        throw err;
    }
  };

  const toggleCommentHelpful = async (expId: string, comment: AppComment) => {
    if (!user) return;
    const expRef = doc(db, "experiences", expId);
    const expDoc = experiences.find(e => e.id === expId);
    if (!expDoc) return;

    const isHelpful = comment.helpfulBy?.includes(user.uid);
    let newHelpfulBy = comment.helpfulBy || [];

    if (isHelpful) { newHelpfulBy = newHelpfulBy.filter(uid => uid !== user.uid); } 
    else { newHelpfulBy = [...newHelpfulBy, user.uid]; }

    const updatedComments = expDoc.comments?.map(c => c.id === comment.id ? { ...c, helpfulBy: newHelpfulBy } : c);

    try {
      const batch = writeBatch(db); 
      batch.update(expRef, { comments: updatedComments });

      if (comment.authorUid !== user.uid) {
          if (isHelpful) {
              const notifQuery = query(
                  collection(db, "notifications"),
                  where("fromUid", "==", user.uid),
                  where("type", "==", "help"),
                  where("expId", "==", expId),
                  where("toUid", "==", comment.authorUid) 
              );
              const notifSnap = await getDocs(notifQuery);
              notifSnap.forEach((d) => { batch.delete(d.ref); });
          } else {
              const notifRef = doc(collection(db, "notifications"));
              batch.set(notifRef, {
                  toUid: comment.authorUid, fromUid: user.uid, type: 'help',
                  text: comment.text.substring(0, 50), expId: expId, commentId: comment.id,
                  read: false, createdAt: serverTimestamp() 
              });
          }
      }
      await batch.commit();
    } catch (err) { console.error("Error toggling helpful:", err); }
  };

  const deleteExperience = async (expId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "experiences", expId));
      setExperiences(prev => prev.filter(exp => exp.id !== expId));
    } catch (err) { console.error(err); alert("Error deleting"); }
  };

  const markAsRead = async (notifId: string) => { try { await updateDoc(doc(db, "notifications", notifId), { read: true }); } catch (e) {} };
  const refreshNotifications = () => { console.log("Refresh"); };
  const markAllAsRead = async () => {
    const batch = writeBatch(db);
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    unread.forEach(n => { batch.update(doc(db, "notifications", n.id), { read: true }); });
    await batch.commit();
  };

  return (
    <DataContext.Provider value={{ 
      experiences, addExperience, addComment, deleteComment, deleteExperience, 
      isLoading, error, loadMore, hasMore, notifications, unreadCount, 
      markAsRead, markAllAsRead, refreshNotifications, toggleCommentHelpful,
      // ✅ Περνάμε τις τιμές στο Provider
      homeScrollPos, setHomeScrollPos, savedPostIds, toggleSavePost, getSavedExperiences
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData required");
  return context;
};