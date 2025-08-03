import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';

import './global.css';

import { Slot } from 'expo-router';

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <Slot />
    </>
  );
}

registerRootComponent(App);
