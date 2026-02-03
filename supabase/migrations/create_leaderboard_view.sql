-- Create a view for the leaderboard
-- This view calculates the total XP and average score for each student
-- XP is calculated based on the number of attempts and their scores

CREATE OR REPLACE VIEW leaderboard AS
SELECT 
    p.id AS user_id,
    p.full_name,
    p.email,
    COUNT(t.id) AS total_attempts,
    COALESCE(SUM(t.percentage), 0) AS total_score,
    COALESCE(AVG(t.percentage), 0) AS avg_score,
    -- Rank based on total score (or you can use avg_score)
    RANK() OVER (ORDER BY SUM(t.percentage) DESC) as rank
FROM 
    profiles p
LEFT JOIN 
    test_attempts t ON p.id = t.student_id
GROUP BY 
    p.id, p.full_name, p.email
ORDER BY 
    total_score DESC;

-- Add comment to the view
COMMENT ON VIEW leaderboard IS 'Calculates student rankings based on test performance.';

-- Add RLS or Grant permissions (Supabase manages views differently, usually public if not restricted)
GRANT SELECT ON leaderboard TO authenticated;
