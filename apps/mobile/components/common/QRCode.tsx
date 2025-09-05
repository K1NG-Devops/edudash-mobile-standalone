import { Platform } from 'react-native';
import QRCodeWeb from './QRCode.web';
import QRCodeNative from './QRCode.native';

// Simple platform bridge so TypeScript can resolve the module in both web and native
const QRCode = Platform.OS === 'web' ? QRCodeWeb : QRCodeNative;
export default QRCode;
