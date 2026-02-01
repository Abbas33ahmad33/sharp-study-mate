-- Create user_sessions table to track active sessions
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  device_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own session
CREATE POLICY "Users can view own session"
  ON public.user_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own session
CREATE POLICY "Users can insert own session"
  ON public.user_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own session
CREATE POLICY "Users can update own session"
  ON public.user_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own session
CREATE POLICY "Users can delete own session"
  ON public.user_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime for session changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_sessions;