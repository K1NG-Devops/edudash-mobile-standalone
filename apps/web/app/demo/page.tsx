import { Hello } from '@edudash/ui';

export default function Page() {
  return (
    <div style={{ padding: 24 }}>
      <h1>EduDash Pro Web</h1>
      <p>Shared UI package demo:</p>
      {/* Render RN component via react-native-web */}
      <Hello name="Web" />
    </div>
  );
}

