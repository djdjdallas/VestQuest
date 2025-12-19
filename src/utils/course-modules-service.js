// src/utils/course-modules-service.js
import { createClient } from "@/lib/supabase/client";

/**
 * Service for interacting with course modules in the database
 */
export class CourseModulesService {
  constructor() {
    this.supabase = createClient();
  }

  /**
   * Get all published course modules
   * @param {Object} options - Query options
   * @param {string} options.level - Filter by level (beginner, intermediate, advanced)
   * @param {Array<string>} options.tags - Filter by tags
   * @returns {Promise<Array>} - Array of course modules
   */
  async getModules({ level, tags } = {}) {
    let query = this.supabase
      .from("course_modules")
      .select("*")
      .eq("published", true)
      .order("title");

    if (level) {
      query = query.eq("level", level);
    }

    if (tags && tags.length > 0) {
      // Filter modules that contain ANY of the specified tags
      query = query.contains("tags", tags);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Get a specific course module by ID with its lessons and quiz questions
   * @param {string} moduleId - The module ID
   * @returns {Promise<Object>} - Module with lessons and quiz questions
   */
  async getModuleWithContent(moduleId) {
    // Get the module
    const { data: moduleData, error: moduleError } = await this.supabase
      .from("course_modules")
      .select("*")
      .eq("id", moduleId)
      .single();

    if (moduleError) {
      throw moduleError;
    }

    if (!moduleData) {
      throw new Error(`Module with ID ${moduleId} not found`);
    }

    // Get the lessons for this module
    const { data: lessonsData, error: lessonsError } = await this.supabase
      .from("course_lessons")
      .select("*")
      .eq("module_id", moduleId)
      .order("order_index");

    if (lessonsError) {
      throw lessonsError;
    }

    // Get quiz questions for each lesson
    const lessons = await Promise.all(
      lessonsData.map(async (lesson) => {
        const { data: quizData, error: quizError } = await this.supabase
          .from("course_quiz_questions")
          .select("*")
          .eq("lesson_id", lesson.id)
          .order("order_index");

        if (quizError) {
          throw quizError;
        }

        return {
          ...lesson,
          quiz: quizData || [],
        };
      })
    );

    // Return the complete module with lessons and quizzes
    return {
      ...moduleData,
      lessons,
    };
  }

  /**
   * Get a specific module by title or slug
   * @param {string} titleOrSlug - Module title or slug
   * @returns {Promise<Object>} - Module with lessons and quiz questions
   */
  async getModuleByTitle(titleOrSlug) {
    // First try exact title match
    let { data: moduleData, error: moduleError } = await this.supabase
      .from("course_modules")
      .select("*")
      .eq("title", titleOrSlug)
      .eq("published", true)
      .single();

    // If not found, try case-insensitive match
    if (!moduleData && !moduleError) {
      const { data: modules, error } = await this.supabase
        .from("course_modules")
        .select("*")
        .ilike("title", `%${titleOrSlug}%`)
        .eq("published", true);

      if (error) {
        throw error;
      }

      if (modules && modules.length > 0) {
        moduleData = modules[0];
      }
    }

    if (!moduleData) {
      throw new Error(`Module with title or slug "${titleOrSlug}" not found`);
    }

    // Get the full module content
    return this.getModuleWithContent(moduleData.id);
  }

  /**
   * Reset a user's progress for a specific module
   * @param {string} moduleId - The module ID to reset
   * @returns {Promise<Object>} - The updated user progress
   */
  async resetModuleProgress(moduleId) {
    try {
      // Get user's current progress
      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error("User must be logged in to reset progress");
      }

      const userId = session.user.id;
      
      // Get current user progress
      const { data: progressData, error: progressError } = await this.supabase
        .from("user_education_progress")
        .select("*")
        .eq("user_id", userId)
        .single();
        
      if (progressError && progressError.code !== 'PGRST116') {
        throw progressError;
      }
      
      // If no progress record exists yet, nothing to reset
      if (!progressData) {
        return { success: true, message: "No progress to reset" };
      }
      
      // Filter out completed content related to this module
      const updatedCompletedContent = progressData.completed_content.filter(
        contentId => !contentId.startsWith(`${moduleId}_`)
      );
      
      // Update learning paths progress
      const learningPaths = { ...progressData.learning_paths };
      
      if (learningPaths[moduleId]) {
        learningPaths[moduleId] = {
          ...learningPaths[moduleId],
          completed: false,
          completedAt: null,
          reset: true,
          resetAt: new Date().toISOString()
        };
      }
      
      // Reset quiz results related to this module
      const quizResults = { ...progressData.quiz_results };
      Object.keys(quizResults).forEach(key => {
        if (key.startsWith(`${moduleId}_`)) {
          quizResults[key] = {
            ...quizResults[key],
            score: 0,
            answers: {},
            reset: true,
            resetAt: new Date().toISOString()
          };
        }
      });
      
      // Update the user's progress
      const { data, error } = await this.supabase
        .from("user_education_progress")
        .update({
          completed_content: updatedCompletedContent,
          learning_paths: learningPaths,
          quiz_results: quizResults,
          last_reset_at: new Date().toISOString()
        })
        .eq("user_id", userId);
        
      if (error) {
        throw error;
      }

      return {
        success: true,
        message: "Module progress has been reset successfully"
      };
    } catch (err) {
      throw err;
    }
  }
}

// Create a singleton instance
const courseModulesService = new CourseModulesService();
export default courseModulesService;