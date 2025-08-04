-- Function to increment class enrollment count
CREATE OR REPLACE FUNCTION increment_class_enrollment(class_id_param UUID) 
RETURNS void AS $$
BEGIN
    UPDATE classes 
    SET current_enrollment = current_enrollment + 1 
    WHERE id = class_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement class enrollment count
CREATE OR REPLACE FUNCTION decrement_class_enrollment(class_id_param UUID) 
RETURNS void AS $$
BEGIN
    UPDATE classes 
    SET current_enrollment = GREATEST(current_enrollment - 1, 0)
    WHERE id = class_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate class enrollment (useful for data integrity)
CREATE OR REPLACE FUNCTION recalculate_class_enrollment(class_id_param UUID) 
RETURNS void AS $$
BEGIN
    UPDATE classes 
    SET current_enrollment = (
        SELECT COUNT(*) 
        FROM students 
        WHERE class_id = class_id_param AND is_active = true
    )
    WHERE id = class_id_param;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to automatically update class enrollment when students are added/removed
CREATE OR REPLACE FUNCTION update_class_enrollment_trigger() 
RETURNS trigger AS $$
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        IF NEW.class_id IS NOT NULL AND NEW.is_active = true THEN
            PERFORM increment_class_enrollment(NEW.class_id);
        END IF;
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE
    IF TG_OP = 'UPDATE' THEN
        -- Student moved from one class to another
        IF OLD.class_id != NEW.class_id THEN
            -- Decrement old class
            IF OLD.class_id IS NOT NULL AND OLD.is_active = true THEN
                PERFORM decrement_class_enrollment(OLD.class_id);
            END IF;
            -- Increment new class
            IF NEW.class_id IS NOT NULL AND NEW.is_active = true THEN
                PERFORM increment_class_enrollment(NEW.class_id);
            END IF;
        -- Student status changed (active/inactive)
        ELSIF OLD.is_active != NEW.is_active AND NEW.class_id IS NOT NULL THEN
            IF NEW.is_active = true THEN
                PERFORM increment_class_enrollment(NEW.class_id);
            ELSE
                PERFORM decrement_class_enrollment(NEW.class_id);
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        IF OLD.class_id IS NOT NULL AND OLD.is_active = true THEN
            PERFORM decrement_class_enrollment(OLD.class_id);
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for students table
DROP TRIGGER IF EXISTS students_enrollment_trigger ON students;
CREATE TRIGGER students_enrollment_trigger
    AFTER INSERT OR UPDATE OR DELETE ON students
    FOR EACH ROW EXECUTE FUNCTION update_class_enrollment_trigger();
