-- Add new columns to learning_paths table for restart functionality
ALTER TABLE public.learning_paths 
ADD COLUMN IF NOT EXISTS completion_requirements jsonb DEFAULT '{"min_lessons_completed": 1, "min_quiz_score": 70}',
ADD COLUMN IF NOT EXISTS restart_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS last_updated_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;

-- Add columns to user_education_progress table to track reset history
ALTER TABLE public.user_education_progress
ADD COLUMN IF NOT EXISTS reset_history jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS last_reset_at timestamp with time zone;

-- Update existing learning paths to enable restart functionality
UPDATE public.learning_paths
SET restart_enabled = true,
    completion_requirements = '{"min_lessons_completed": 6, "min_quiz_score": 70}'
WHERE id IS NOT NULL;

-- Create function to track path resets
CREATE OR REPLACE FUNCTION track_learning_path_reset()
RETURNS TRIGGER AS $$
BEGIN
    -- If learning_paths field has changed
    IF OLD.learning_paths IS DISTINCT FROM NEW.learning_paths THEN
        -- Check for reset operations by looking for learning paths with completed=false after being true
        FOR path_id IN 
            SELECT key FROM jsonb_object_keys(NEW.learning_paths) t(key)
        LOOP
            -- If the path was completed before but now is not
            IF (OLD.learning_paths -> path_id ->> 'completed')::boolean = true AND 
               (NEW.learning_paths -> path_id ->> 'completed')::boolean = false THEN
                
                -- Add reset record to history
                NEW.reset_history = coalesce(NEW.reset_history, '[]'::jsonb) || 
                    jsonb_build_object(
                        'path_id', path_id,
                        'reset_at', now(),
                        'previous_state', OLD.learning_paths -> path_id
                    );
                    
                -- Update last reset timestamp
                NEW.last_reset_at = now();
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to track learning path resets
DROP TRIGGER IF EXISTS track_learning_path_reset_trigger ON public.user_education_progress;
CREATE TRIGGER track_learning_path_reset_trigger
BEFORE UPDATE ON public.user_education_progress
FOR EACH ROW
EXECUTE FUNCTION track_learning_path_reset();

-- Add a comment to the restart_enabled column
COMMENT ON COLUMN public.learning_paths.restart_enabled IS 'Indicates whether users can restart this learning path';

-- Add a comment to the reset_history column
COMMENT ON COLUMN public.user_education_progress.reset_history IS 'History of learning path resets, including previous state and reset time';