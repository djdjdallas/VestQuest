// src/components/education/UserProgressProvider.jsx
"use client";

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback 
} from "react";
import { createClient } from "@/lib/supabase/client";

// Create context
const UserProgressContext = createContext({
  viewedContent: {},
  completedContent: [],
  bookmarkedContent: [],
  quizResults: {},
  learningPaths: {},
  markContentViewed: () => {},
  markContentCompleted: () => {},
  toggleBookmark: () => {},
  saveQuizResult: () => {},
  updateLearningPathProgress: () => {},
  isSaving: false,
  lastSynced: null,
});

export function UserProgressProvider({ children }) {
  // Keep track of user's progress
  const [viewedContent, setViewedContent] = useState({});
  const [completedContent, setCompletedContent] = useState([]);
  const [bookmarkedContent, setBookmarkedContent] = useState([]);
  const [quizResults, setQuizResults] = useState({});
  const [learningPaths, setLearningPaths] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Initialize supabase client
  const supabase = createClient();
  
  // Load progress data on initial mount
  useEffect(() => {
    async function loadUserProgress() {
      try {
        // First try to load from local storage
        const storedViewedContent = localStorage.getItem('viewedContent');
        const storedCompletedContent = localStorage.getItem('completedContent');
        const storedBookmarkedContent = localStorage.getItem('bookmarkedContent');
        const storedQuizResults = localStorage.getItem('quizResults');
        const storedLearningPaths = localStorage.getItem('learningPaths');
        const storedLastSynced = localStorage.getItem('progressLastSynced');
        
        if (storedViewedContent) setViewedContent(JSON.parse(storedViewedContent));
        if (storedCompletedContent) setCompletedContent(JSON.parse(storedCompletedContent));
        if (storedBookmarkedContent) setBookmarkedContent(JSON.parse(storedBookmarkedContent));
        if (storedQuizResults) setQuizResults(JSON.parse(storedQuizResults));
        if (storedLearningPaths) setLearningPaths(JSON.parse(storedLearningPaths));
        if (storedLastSynced) setLastSynced(new Date(storedLastSynced));
        
        // Then try to get user's session
        const { data: { session } } = await supabase.auth.getSession();
        
        // If logged in, fetch from database
        if (session?.user) {
          const { data, error } = await supabase
            .from('user_education_progress')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
            
          if (error && error.code !== 'PGRST116') {
            // PGRST116 is "no rows returned" - not an error for us
          }
          
          if (data) {
            // Make sure to parse JSONB fields if they're returned as strings
            const viewedContentData = typeof data.viewed_content === 'string' ? JSON.parse(data.viewed_content) : (data.viewed_content || {});
            const quizResultsData = typeof data.quiz_results === 'string' ? JSON.parse(data.quiz_results) : (data.quiz_results || {});
            const learningPathsData = typeof data.learning_paths === 'string' ? JSON.parse(data.learning_paths) : (data.learning_paths || {});
            
            // Merge with local data, prioritizing server data
            setViewedContent(viewedContentData);
            setCompletedContent(data.completed_content || []);
            setBookmarkedContent(data.bookmarked_content || []);
            setQuizResults(quizResultsData);
            setLearningPaths(learningPathsData);
            
            // Update local storage with server data
            localStorage.setItem('viewedContent', JSON.stringify(viewedContentData));
            localStorage.setItem('completedContent', JSON.stringify(data.completed_content || []));
            localStorage.setItem('bookmarkedContent', JSON.stringify(data.bookmarked_content || []));
            localStorage.setItem('quizResults', JSON.stringify(quizResultsData));
            localStorage.setItem('learningPaths', JSON.stringify(learningPathsData));
            localStorage.setItem('progressLastSynced', new Date().toISOString());
            setLastSynced(new Date());
          }
        }
      } catch (err) {
        // Failed to initialize user progress
      }
    }
    
    loadUserProgress();
  }, [supabase]);
  
  // Save progress to server and local storage
  const saveProgress = useCallback(async () => {
    if (!hasChanges) return;
    
    setIsSaving(true);
    try {
      // Always save to local storage
      localStorage.setItem('viewedContent', JSON.stringify(viewedContent));
      localStorage.setItem('completedContent', JSON.stringify(completedContent));
      localStorage.setItem('bookmarkedContent', JSON.stringify(bookmarkedContent));
      localStorage.setItem('quizResults', JSON.stringify(quizResults));
      localStorage.setItem('learningPaths', JSON.stringify(learningPaths));
      localStorage.setItem('progressLastSynced', new Date().toISOString());
      
      // Try to get user's session
      const { data: { session } } = await supabase.auth.getSession();
      
      // If logged in, save to database
      if (session?.user) {
        const progressData = {
          user_id: session.user.id,
          viewed_content: viewedContent,
          completed_content: completedContent,
          bookmarked_content: bookmarkedContent,
          quiz_results: quizResults,
          learning_paths: learningPaths,
          updated_at: new Date().toISOString()
        };
        
        // Check if record exists
        const { data, error: checkError } = await supabase
          .from('user_education_progress')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();
          
        if (checkError) {
          // Failed to check user progress
        }
        
        if (data) {
          // Update existing record
          const { error } = await supabase
            .from('user_education_progress')
            .update(progressData)
            .eq('user_id', session.user.id);
            
          if (error) {
            // Failed to update user progress
          }
        } else {
          // Insert new record
          const { error } = await supabase
            .from('user_education_progress')
            .insert(progressData);
            
          if (error) {
            // Failed to insert user progress
          }
        }
      }
      
      setLastSynced(new Date());
      setHasChanges(false);
    } catch (err) {
      // Failed to save user progress
    } finally {
      setIsSaving(false);
    }
  }, [
    hasChanges, 
    viewedContent, 
    completedContent, 
    bookmarkedContent, 
    quizResults, 
    learningPaths, 
    supabase
  ]);
  
  // Auto-save on changes with debounce
  useEffect(() => {
    if (hasChanges) {
      const saveTimer = setTimeout(() => {
        saveProgress();
      }, 3000); // Save after 3 seconds of inactivity
      
      return () => clearTimeout(saveTimer);
    }
  }, [hasChanges, saveProgress]);
  
  // Mark content as viewed
  const markContentViewed = useCallback((contentId) => {
    if (!contentId) return;
    
    setViewedContent(prev => {
      const updatedViews = { ...prev };
      // Increment view count or set to 1 if not viewed before
      updatedViews[contentId] = (updatedViews[contentId] || 0) + 1;
      return updatedViews;
    });
    
    setHasChanges(true);
  }, []);
  
  // Mark content as completed
  const markContentCompleted = useCallback((contentId, isCompleted = true) => {
    if (!contentId) return;
    
    setCompletedContent(prev => {
      if (isCompleted) {
        // Add to completed content if not already there
        return prev.includes(contentId) ? prev : [...prev, contentId];
      } else {
        // Remove from completed content
        return prev.filter(id => id !== contentId);
      }
    });
    
    setHasChanges(true);
  }, []);
  
  // Toggle bookmark status
  const toggleBookmark = useCallback((contentId) => {
    if (!contentId) return;
    
    setBookmarkedContent(prev => {
      if (prev.includes(contentId)) {
        // Remove from bookmarks
        return prev.filter(id => id !== contentId);
      } else {
        // Add to bookmarks
        return [...prev, contentId];
      }
    });
    
    setHasChanges(true);
  }, []);
  
  // Save quiz result
  const saveQuizResult = useCallback((quizId, result) => {
    if (!quizId) return;
    
    setQuizResults(prev => ({
      ...prev,
      [quizId]: {
        ...result,
        timestamp: new Date().toISOString()
      }
    }));
    
    setHasChanges(true);
  }, []);
  
  // Update learning path progress
  const updateLearningPathProgress = useCallback((pathId, progress) => {
    if (!pathId) return;
    
    setLearningPaths(prev => ({
      ...prev,
      [pathId]: {
        ...prev[pathId],
        ...progress,
        last_updated: new Date().toISOString()
      }
    }));
    
    setHasChanges(true);
  }, []);
  
  return (
    <UserProgressContext.Provider
      value={{
        viewedContent,
        completedContent,
        bookmarkedContent,
        quizResults,
        learningPaths,
        markContentViewed,
        markContentCompleted,
        toggleBookmark,
        saveQuizResult,
        updateLearningPathProgress,
        isSaving,
        lastSynced,
        saveProgress
      }}
    >
      {children}
    </UserProgressContext.Provider>
  );
}

// Custom hook for using the context
export const useUserProgress = () => useContext(UserProgressContext);