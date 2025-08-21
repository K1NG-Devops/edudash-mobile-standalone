import { IconSymbol } from '@/components/ui/IconSymbol';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { createOnboardingRequest } from '@/lib/services/onboardingService';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Step = 1 | 2 | 3 | 4;

export default function SchoolOnboarding() {
    const [step, setStep] = useState<Step>(1);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Form data
    const [formData, setFormData] = useState({
        // Step 1 - School Information  
        schoolName: '',
        schoolType: 'Preschool',
        expectedStudents: '',
        expectedTeachers: '',
        
        // Step 2 - Administrator Details
        adminName: '',
        adminEmail: '',
        adminPhone: '',
        
        // Step 3 - Location & Additional Info
        schoolAddress: '',
        schoolWebsite: '',
        specialPrograms: '',
        additionalNotes: '',
    });

    const updateFormData = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateStep = (s: Step): boolean => {
        const stepErrors: { [key: string]: string } = {};
        if (s === 1) {
            if (!schoolName.trim()) stepErrors.schoolName = 'School name is required';
            if (!schoolType.trim()) stepErrors.schoolType = 'School type is required';
            if (!expectedStudents.trim()) stepErrors.expectedStudents = 'Expected students is required';
            if (expectedStudents && isNaN(Number(expectedStudents))) stepErrors.expectedStudents = 'Enter a valid number';
        } else if (s === 2) {
            if (!adminName.trim()) stepErrors.adminName = 'Admin name is required';
            if (!adminEmail.trim()) stepErrors.adminEmail = 'Admin email is required';
            const emailOk = /.+@.+\..+/.test(adminEmail.trim());
            if (adminEmail && !emailOk) stepErrors.adminEmail = 'Enter a valid email';
        }
        setErrors(stepErrors);
        return Object.keys(stepErrors).length === 0;
    };

    const next = () => {
        if (validateStep(step)) {
            setStep((s) => (Math.min(3, (s + 1) as Step)) as Step);
        }
    };
    const back = () => setStep((s) => (Math.max(1, (s - 1) as Step)) as Step);

    const submit = async () => {
        // Validate critical fields again before submit
        if (!validateStep(1) || !validateStep(2)) {
            Alert.alert('Missing info', 'Please complete the required fields.');
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
                numberOfStudents: expectedStudents.trim() || undefined,
                numberOfTeachers: undefined,
                message: notes.trim() || undefined,
            });
            Alert.alert('Submitted', 'Your school registration request was sent for approval.');
            router.replace('/(auth)/sign-in');
        } catch (e: any) {
            Alert.alert('Error', e?.message || 'Failed to submit.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#1e3c72', '#2a5298']} style={styles.container}>
                <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <SafeAreaView style={styles.flex}>
                        <View style={styles.header}>
                            <TouchableOpacity style={styles.backButton} onPress={() => (step === 1 ? router.back() : back())}>
                                <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                            <Text style={styles.title}>Register Your School</Text>
                        </View>

                        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                            <View style={styles.stepper}>
                                {[1, 2, 3].map((i) => (
                                    <View key={i} style={[styles.stepDot, i <= step ? styles.stepDotActive : undefined]} />
                                ))}
                            </View>

                            {step === 1 && (
                                <View>
                                    <Text style={styles.subtitle}>School Details</Text>
                                    <View style={[styles.inputContainer, errors.schoolName && styles.inputError]}>
                                        <IconSymbol name="building.2" size={20} color="#FFFFFF80" style={styles.inputIcon} />
                                        <TextInput style={styles.input} placeholder="School Name" placeholderTextColor="#FFFFFF80" value={schoolName} onChangeText={setSchoolName} />
                                    </View>
                                    {errors.schoolName ? <Text style={styles.errorText}>{errors.schoolName}</Text> : null}
                                    <View style={[styles.inputContainer, errors.schoolType && styles.inputError]}>
                                        <IconSymbol name="doc.text.fill" size={20} color="#FFFFFF80" style={styles.inputIcon} />
                                        <TextInput style={styles.input} placeholder="School Type (e.g., Preschool)" placeholderTextColor="#FFFFFF80" value={schoolType} onChangeText={setSchoolType} />
                                    </View>
                                    {errors.schoolType ? <Text style={styles.errorText}>{errors.schoolType}</Text> : null}
                                    <View style={[styles.inputContainer, errors.expectedStudents && styles.inputError]}>
                                        <IconSymbol name="graduationcap.fill" size={20} color="#FFFFFF80" style={styles.inputIcon} />
                                        <TextInput style={styles.input} placeholder="Expected Students" placeholderTextColor="#FFFFFF80" value={expectedStudents} onChangeText={setExpectedStudents} keyboardType="number-pad" />
                                    </View>
                                    {errors.expectedStudents ? <Text style={styles.errorText}>{errors.expectedStudents}</Text> : null}
                                </View>
                            )}

                            {step === 2 && (
                                <View>
                                    <Text style={styles.subtitle}>Administrator Details</Text>
                                    <View style={[styles.inputContainer, errors.adminName && styles.inputError]}>
                                        <IconSymbol name="person.fill" size={20} color="#FFFFFF80" style={styles.inputIcon} />
                                        <TextInput style={styles.input} placeholder="Admin Full Name" placeholderTextColor="#FFFFFF80" value={adminName} onChangeText={setAdminName} />
                                    </View>
                                    {errors.adminName ? <Text style={styles.errorText}>{errors.adminName}</Text> : null}
                                    <View style={[styles.inputContainer, errors.adminEmail && styles.inputError]}>
                                        <IconSymbol name="envelope.fill" size={20} color="#FFFFFF80" style={styles.inputIcon} />
                                        <TextInput style={styles.input} placeholder="Admin Email" placeholderTextColor="#FFFFFF80" value={adminEmail} onChangeText={setAdminEmail} autoCapitalize="none" keyboardType="email-address" />
                                    </View>
                                    {errors.adminEmail ? <Text style={styles.errorText}>{errors.adminEmail}</Text> : null}
                                    <View style={styles.inputContainer}>
                                        <IconSymbol name="phone.fill" size={20} color="#FFFFFF80" style={styles.inputIcon} />
                                        <TextInput style={styles.input} placeholder="Phone (optional)" placeholderTextColor="#FFFFFF80" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                                    </View>
                                </View>
                            )}

                            {step === 3 && (
                                <View>
                                    <Text style={styles.subtitle}>Address & Notes</Text>
                                    <View style={styles.inputContainer}>
                                        <IconSymbol name="location.fill" size={20} color="#FFFFFF80" style={styles.inputIcon} />
                                        <TextInput style={styles.input} placeholder="Address" placeholderTextColor="#FFFFFF80" value={address} onChangeText={setAddress} />
                                    </View>
                                    <View style={styles.inputContainer}>
                                        <IconSymbol name="doc.text.fill" size={20} color="#FFFFFF80" style={styles.inputIcon} />
                                        <TextInput style={styles.input} placeholder="Notes (optional)" placeholderTextColor="#FFFFFF80" value={notes} onChangeText={setNotes} />
                                    </View>
                                </View>
                            )}

                            <View style={styles.actions}>
                                {step < 3 ? (
                                    <TouchableOpacity style={styles.primaryButton} onPress={next}>
                                        <Text style={styles.primaryButtonText}>Next</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity style={[styles.primaryButton, submitting && styles.buttonDisabled]} onPress={submit} disabled={submitting}>
                                        <Text style={styles.primaryButtonText}>Submit for Approval</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
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
    stepper: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
    stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF40' },
    stepDotActive: { backgroundColor: '#FFFFFF' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF20', borderRadius: 12, marginBottom: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#FFFFFF30' },
    inputError: { borderColor: '#FCA5A5', backgroundColor: '#FFFFFF10' },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, height: 48, color: '#FFFFFF', fontSize: 16 },
    errorText: { color: '#FFE4E6', fontSize: 12, marginTop: -8, marginBottom: 8 },
    actions: { marginTop: 8 },
    primaryButton: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, alignItems: 'center' },
    primaryButtonText: { color: '#1e3c72', fontSize: 16, fontWeight: 'bold' },
    buttonDisabled: { backgroundColor: '#FFFFFF90' },
});


