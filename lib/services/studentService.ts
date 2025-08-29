import { supabase } from '@/lib/supabase';

export const studentService = {
  createStudent: async (studentData: any) => {
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

  updateStudent: async (id: string, updatedData: any) => {
    const { data, error } = await supabase
      .from('students')
      .update(updatedData as any)
      .eq('id', id);
    if (error) throw error;
    return data;
  },

  deleteStudent: async (id: string) => {
    const { data, error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return data;
  },
};
