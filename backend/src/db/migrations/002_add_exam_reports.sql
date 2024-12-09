-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add grades_optimized table for storing student grades
CREATE TABLE IF NOT EXISTS grades_optimized (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id),
    student_id UUID REFERENCES students(id),
    subject_scores JSONB,
    academic_year INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(exam_id, student_id)
) PARTITION BY RANGE (academic_year);

-- Create partition for current year
CREATE TABLE grades_optimized_2024 
    PARTITION OF grades_optimized 
    FOR VALUES FROM (2024) TO (2025);

-- Add indexes for grades_optimized
CREATE INDEX idx_grades_exam_student ON grades_optimized(exam_id, student_id);
CREATE INDEX idx_grades_student_year ON grades_optimized(student_id, academic_year);
CREATE INDEX idx_grades_jsonb ON grades_optimized USING gin (subject_scores);

-- Add exam_reports materialized view for storing exam statistics
CREATE MATERIALIZED VIEW exam_reports_mv AS
WITH exam_stats AS (
    SELECT 
        g.exam_id,
        g.student_id,
        e.class_id,
        (SELECT SUM(value::integer) 
         FROM jsonb_each_text(g.subject_scores)) as total_marks,
        (SELECT AVG(value::numeric) 
         FROM jsonb_each_text(g.subject_scores)) as average_score
    FROM grades_optimized g
    JOIN exams e ON e.id = g.exam_id
),
rankings AS (
    SELECT 
        *,
        RANK() OVER (
            PARTITION BY exam_id 
            ORDER BY average_score DESC
        ) as rank,
        COUNT(*) OVER (
            PARTITION BY exam_id
        ) as total_students
    FROM exam_stats
)
SELECT * FROM rankings;

-- Add indices for exam_reports_mv
CREATE UNIQUE INDEX idx_exam_reports_exam_student ON exam_reports_mv (exam_id, student_id);
CREATE INDEX idx_exam_reports_student ON exam_reports_mv (student_id);
CREATE INDEX idx_exam_reports_class ON exam_reports_mv (class_id);

-- Create view for term reports (using averages)
CREATE OR REPLACE VIEW term_reports AS
WITH term_stats AS (
    SELECT 
        er.student_id,
        er.class_id,
        e.term,
        e.year,
        ROUND(AVG(er.average_score), 2) as term_average,
        ROUND(AVG(er.total_marks), 2) as avg_term_marks,
        COUNT(DISTINCT e.id) as exams_count,
        ROUND(AVG(er.rank), 0) as average_rank
    FROM exam_reports_mv er
    JOIN exams e ON e.id = er.exam_id
    GROUP BY er.student_id, er.class_id, e.term, e.year
),
class_averages AS (
    SELECT
        class_id,
        term,
        year,
        ROUND(AVG(term_average), 2) as class_average
    FROM term_stats
    GROUP BY class_id, term, year
),
term_rankings AS (
    SELECT 
        ts.*,
        ca.class_average,
        RANK() OVER (
            PARTITION BY ts.class_id, ts.term, ts.year 
            ORDER BY ts.term_average DESC
        ) as term_rank
    FROM term_stats ts
    JOIN class_averages ca ON ca.class_id = ts.class_id 
        AND ca.term = ts.term 
        AND ca.year = ts.year
)
SELECT * FROM term_rankings;

-- Create view for yearly reports
CREATE OR REPLACE VIEW yearly_reports AS
WITH year_stats AS (
    SELECT 
        student_id,
        class_id,
        year,
        ROUND(AVG(term_average), 2) as year_average,
        ROUND(AVG(avg_term_marks), 2) as avg_year_marks,
        SUM(exams_count) as total_exams,
        ROUND(AVG(average_rank), 0) as average_rank
    FROM term_reports
    GROUP BY student_id, class_id, year
),
class_year_averages AS (
    SELECT
        class_id,
        year,
        ROUND(AVG(year_average), 2) as class_average
    FROM year_stats
    GROUP BY class_id, year
),
year_rankings AS (
    SELECT 
        ys.*,
        cya.class_average,
        RANK() OVER (
            PARTITION BY ys.class_id, ys.year 
            ORDER BY ys.year_average DESC
        ) as year_rank
    FROM year_stats ys
    JOIN class_year_averages cya ON cya.class_id = ys.class_id 
        AND cya.year = ys.year
)
SELECT 
    yr.*,
    s.name as student_name,
    s.admission_number,
    c.name as class_name,
    c.grade
FROM year_rankings yr
JOIN students s ON s.id = yr.student_id
JOIN classes c ON c.id = yr.class_id;

-- Function to refresh exam reports for specific exam
CREATE OR REPLACE FUNCTION refresh_exam_report(exam_id UUID)
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY exam_reports_mv;
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Trigger to refresh exam reports when grades are submitted
CREATE OR REPLACE TRIGGER refresh_exam_report_trigger
    AFTER INSERT OR UPDATE ON grades_optimized
    FOR EACH ROW
    EXECUTE FUNCTION refresh_exam_report(NEW.exam_id);

-- Add comments
COMMENT ON MATERIALIZED VIEW exam_reports_mv IS 'Stores exam-level statistics and rankings';
COMMENT ON VIEW term_reports IS 'Shows term-level performance using averages for consistent comparison';
COMMENT ON VIEW yearly_reports IS 'Shows year-level performance using averages from terms';

-- Add helpful comments
COMMENT ON TABLE grades_optimized IS 'Stores student grades with subject scores in JSONB format';
COMMENT ON COLUMN grades_optimized.subject_scores IS 'JSONB containing subject_id: score pairs';
