CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    subjects UUID[] DEFAULT '{}',
    join_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on the subjects array for better performance
CREATE INDEX idx_teachers_subjects ON teachers USING gin (subjects);

-- Add foreign key constraint to ensure subject IDs are valid
ALTER TABLE teachers 
ADD CONSTRAINT fk_teachers_subjects 
CHECK (subjects <@ (SELECT ARRAY_AGG(id) FROM subjects));

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_teachers_updated_at
    BEFORE UPDATE
    ON teachers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
