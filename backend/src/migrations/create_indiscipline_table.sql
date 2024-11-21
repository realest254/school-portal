CREATE TABLE IF NOT EXISTS indiscipline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id),
  reported_by UUID NOT NULL REFERENCES teachers(id),
  incident_date TIMESTAMP NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(10) NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe')),
  status VARCHAR(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'deleted')),
  action_taken TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_indiscipline_student ON indiscipline(student_id);
CREATE INDEX IF NOT EXISTS idx_indiscipline_reporter ON indiscipline(reported_by);
CREATE INDEX IF NOT EXISTS idx_indiscipline_status ON indiscipline(status);
