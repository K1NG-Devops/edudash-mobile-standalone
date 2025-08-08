import React from 'react';
import { View, Text, Button, TextInput, StyleSheet } from 'react-native';
import { studentService } from '@/lib/services/studentService';

export default function StudentProfileScreen() {
  const [student, setStudent] = React.useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
  });

  const handleCreateStudent = async () => {
    try {
      await studentService.createStudent(student);
      alert('Student created successfully!');
    } catch (error) {
      console.error('Error creating student:', error);
      alert('Failed to create student.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>First Name:</Text>
      <TextInput
        style={styles.input}
        value={student.first_name}
        onChangeText={(text) => setStudent({ ...student, first_name: text })}
      />
      <Text style={styles.label}>Last Name:</Text>
      <TextInput
        style={styles.input}
        value={student.last_name}
        onChangeText={(text) => setStudent({ ...student, last_name: text })}
      />
      <Text style={styles.label}>Date of Birth:</Text>
      <TextInput
        style={styles.input}
        value={student.date_of_birth}
        onChangeText={(text) => setStudent({ ...student, date_of_birth: text })}
      />
      <Text style={styles.label}>Gender:</Text>
      <TextInput
        style={styles.input}
        value={student.gender}
        onChangeText={(text) => setStudent({ ...student, gender: text })}
      />
      <Button title="Create Student" onPress={handleCreateStudent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    fontSize: 16,
    marginBottom: 20,
    borderRadius: 5,
  },
});

