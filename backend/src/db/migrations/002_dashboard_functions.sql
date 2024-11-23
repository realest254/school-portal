-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_dashboard_stats(p_user_role text, p_user_id UUID);

-- Create dashboard stats function that handles both admin and teacher roles
CREATE OR REPLACE FUNCTION get_dashboard_stats(
    p_user_role text,
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Admin stats
    IF p_user_role = 'admin' THEN
        WITH student_stats AS (
            SELECT COUNT(*) as total_students
            FROM profiles
            WHERE role = 'student'
        ),
        teacher_stats AS (
            SELECT COUNT(*) as total_teachers
            FROM profiles
            WHERE role = 'teacher'
        ),
        class_stats AS (
            SELECT COUNT(*) as total_classes
            FROM classes
            WHERE is_active = true
        )
        SELECT jsonb_build_object(
            'students', jsonb_build_object('total', total_students),
            'teachers', jsonb_build_object('total', total_teachers),
            'classes', jsonb_build_object('total', total_classes)
        )
        INTO result
        FROM student_stats, teacher_stats, class_stats;

    -- Teacher stats
    ELSIF p_user_role = 'teacher' THEN
        WITH teacher_classes AS (
            -- Get classes where the teacher teaches
            SELECT c.id, c.name, c.code
            FROM classes c
            JOIN class_teachers ct ON c.id = ct.class_id
            WHERE ct.teacher_id = p_user_id
            AND c.is_active = true
        ),
        class_students AS (
            -- Get student counts for each class
            SELECT 
                tc.id as class_id,
                tc.name as class_name,
                tc.code as class_code,
                COUNT(cs.student_id) as student_count
            FROM teacher_classes tc
            LEFT JOIN class_students cs ON tc.id = cs.class_id
            GROUP BY tc.id, tc.name, tc.code
        ),
        total_stats AS (
            -- Calculate total students across all classes
            SELECT 
                COUNT(DISTINCT cs.student_id) as total_students,
                COUNT(DISTINCT tc.id) as total_classes
            FROM teacher_classes tc
            LEFT JOIN class_students cs ON tc.id = cs.class_id
        )
        SELECT jsonb_build_object(
            'students', jsonb_build_object(
                'total', COALESCE((SELECT total_students FROM total_stats), 0),
                'byClass', (
                    SELECT jsonb_object_agg(
                        class_code,
                        jsonb_build_object(
                            'name', class_name,
                            'count', student_count
                        )
                    )
                    FROM class_students
                )
            ),
            'classes', jsonb_build_object(
                'total', COALESCE((SELECT total_classes FROM total_stats), 0)
            )
        )
        INTO result;
    
    -- Invalid role
    ELSE
        result := jsonb_build_object('error', 'Invalid user role');
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql;
