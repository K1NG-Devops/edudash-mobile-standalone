import { supabase } from '@/lib/supabase';

export const studentService = {
  createStudent: async (studentData) => {
    const { data, error } = await supabase
      .from('students')
      .insert(studentData as any);
    if (error) throw error;
    return data;
  },

  fetchStudents: async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*');
    if (error) throw error;
    return data;
  },

  updateStudent: async (id, updatedData) => {
    const { data, error } = await supabase
      .from('students')
      .update(updatedData as any)
      .eq('id', id);
    if (error) throw error;
    return data;
  },

  deleteStudent: async (id) => {
    const { data, error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return data;
  },
};
