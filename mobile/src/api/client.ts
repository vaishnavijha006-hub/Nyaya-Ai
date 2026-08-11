import axios from 'axios';
import { Platform } from 'react-native';

// Use local network IP. Replace '192.168.1.X' with your actual computer's IP
// when running on a physical device. For Android Emulator, use 10.0.2.2.
// For iOS Simulator, localhost (127.0.0.1) works.
const DEV_IP = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
const BASE_URL = `http://${DEV_IP}:8000`;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});
