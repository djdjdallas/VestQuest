-- Create administrators table
CREATE TABLE IF NOT EXISTS public.administrators (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_administrators_user_id ON public.administrators(user_id);
