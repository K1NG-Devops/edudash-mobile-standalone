import { IconSymbol } from '@/components/ui/IconSymbol';
import { createOnboardingRequest } from '@/lib/services/onboardingService';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignUp() {
    const params = useLocalSearchParams();
    const presetType = (params?.type as string) || '';
    const presetRole = (params?.role as string) || '';

    const isSchoolFlow = presetType === 'school' || presetRole === 'principal' || presetRole === 'admin';

    const [schoolName, setSchoolName] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [numStudents, setNumStudents] = useState('');
    const [numTeachers, setNumTeachers] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (isSchoolFlow) {
            if (!schoolName.trim() || !adminName.trim() || !adminEmail.trim()) {
                Alert.alert('Missing info', 'Please complete School, Admin Name and Admin Email.');
                return;
            }
            try {
                setSubmitting(true);
                await createOnboardingRequest({
                    preschoolName: schoolName.trim(),
                    adminName: adminName.trim(),
                    adminEmail: adminEmail.trim(),
                    phone: phone.trim() || undefined,
                    address: address.trim() || undefined,
                    numberOfStudents: numStudents.trim() || undefined,
                    numberOfTeachers: numTeachers.trim() || undefined,
                    message: message.trim() || undefined,
                });
                Alert.alert('Submitted', 'Your school registration request was sent for approval.');
                router.replace('/(auth)/sign-in');
            } catch (e: any) {
                Alert.alert('Error', e?.message || 'Failed to submit.');
            } finally {
                setSubmitting(false);
            }
            return;
        }

        // Generic account creation (future). For now route to sign-in.
        router.push('/(auth)/sign-in');
    };

    return (
        <>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#1e3c72', '#2a5298']} style={styles.container}>
                <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <SafeAreaView style={styles.flex}>
                        <View style={styles.header}>
                            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                                <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                            <Text style={styles.title}>{isSchoolFlow ? 'Register Your School' : 'Create Account'}</Text>
                        </View>

                        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                            {isSchoolFlow && (
                                <>
                                    <Text style={styles.subtitle}>Submit your school for Super Admin approval</Text>
                                    <View style={styles.inputContainer}>
                                        <IconSymbol name="building.2" size={20} color="#FFFFFF80" style={styles.inputIcon} />
                                        <TextInput style={styles.input} placeholder="School Name" placeholderTextColor="#FFFFFF80" value={schoolName} onChangeText={setSchoolName} />
                                    </View>
                                    <View style={styles.inputContainer}>
                                        <IconSymbol name="person.fill" size={20} color="#FFFFFF80" style={styles.inputIcon} />
                                        <TextInput style={styles.input} placeholder="Admin Full Name" placeholderTextColor="#FFFFFF80" value={adminName} onChangeText={setAdminName} />
                                    </View>
                                    <View style={styles.inputContainer}>
                                        <IconSymbol name="envelope.fill" size={20} color="#FFFFFF80" style={styles.inputIcon} />
                                        <TextInput style={styles.input} placeholder="Admin Email" placeholderTextColor="#FFFFFF80" value={adminEmail} onChangeText={setAdminEmail} autoCapitalize="none" keyboardType="email-address" />
                                    </View>
                                    <View style={styles.inputContainer}>
                                        <IconSymbol name="phone.fill" size={20} color="#FFFFFF80" style={styles.inputIcon} />
                                        <TextInput style={styles.input} placeholder="Phone (optional)" placeholderTextColor="#FFFFFF80" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                                    </View>
                                    <View style={styles.inputContainer}>
                                        <IconSymbol name="location.fill" size={20} color="#FFFFFF80" style={styles.inputIcon} />
                                        <TextInput style={styles.input} placeholder="Address (optional)" placeholderTextColor="#FFFFFF80" value={address} onChangeText={setAddress} />
                                    </View>
                                    <View style={styles.rowInputs}>
                                        <View style={[styles.inputContainer, styles.rowItem]}>
                                            <IconSymbol name="graduationcap.fill" size={20} color="#FFFFFF80" style={styles.inputIcon} />
                                            <TextInput style={styles.input} placeholder="# Students" placeholderTextColor="#FFFFFF80" value={numStudents} onChangeText={setNumStudents} keyboardType="number-pad" />
                                        </View>
                                        <View style={[styles.inputContainer, styles.rowItem]}>
                                            <IconSymbol name="person.3" size={20} color="#FFFFFF80" style={styles.inputIcon} />
                                            <TextInput style={styles.input} placeholder="# Teachers" placeholderTextColor="#FFFFFF80" value={numTeachers} onChangeText={setNumTeachers} keyboardType="number-pad" />
                                        </View>
                                    </View>
                                    <View style={styles.inputContainer}>
                                        <IconSymbol name="doc.text.fill" size={20} color="#FFFFFF80" style={styles.inputIcon} />
                                        <TextInput style={styles.input} placeholder="Message (optional)" placeholderTextColor="#FFFFFF80" value={message} onChangeText={setMessage} />
                                    </View>
                                </>
                            )}

                            <TouchableOpacity style={[styles.button, submitting && styles.buttonDisabled]} onPress={handleSubmit} disabled={submitting} activeOpacity={0.8}>
                                <Text style={styles.buttonText}>{isSchoolFlow ? 'Submit for Approval' : 'Create Account'}</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </SafeAreaView>
                </KeyboardAvoidingView>
            </LinearGradient>
        </>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1 },
    header: { paddingTop: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    backButton: { position: 'absolute', left: 20, top: 20, padding: 8 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
    content: { padding: 24 },
    subtitle: { fontSize: 14, color: '#FFFFFFA0', textAlign: 'center', marginBottom: 16 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF20', borderRadius: 12, marginBottom: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#FFFFFF30' },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, height: 48, color: '#FFFFFF', fontSize: 16 },
    rowInputs: { flexDirection: 'row', gap: 10 },
    rowItem: { flex: 1 },
    button: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 10 },
    buttonDisabled: { backgroundColor: '#FFFFFF90' },
    buttonText: { color: '#1e3c72', fontSize: 16, fontWeight: 'bold' },
});










