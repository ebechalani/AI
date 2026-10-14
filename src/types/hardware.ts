import type { Locale, Localized, MediaRef, Timestamped } from './common';

// Hardware needs are expressed as capabilities, never as a brand or a model.
export const HARDWARE_CAPABILITIES = [
  'drive',
  'camera',
  'distance',
  'line',
  'color',
  'imu',
  'microphone',
  'speaker',
  'gripper',
  'display',
] as const;
export type HardwareCapability = (typeof HARDWARE_CAPABILITIES)[number];

export type HardwareKind = 'robot' | 'microcontroller' | 'sensor_kit' | 'simulator';
export type ProgrammingMode = 'blocks' | 'python' | 'javascript' | 'cpp';
export type HardwareConnectivity = 'usb' | 'bluetooth' | 'wifi' | 'none';

export interface HardwarePlatform extends Timestamped {
  id: string;
  kind: HardwareKind;
  /** Display only; no logic depends on it. */
  vendor: string | null;
  capabilities: HardwareCapability[];
  programmingModes: ProgrammingMode[];
  connectivity: HardwareConnectivity[];
  image: MediaRef | null;
  isActive: boolean;
  order: number;
  defaultLocale: Locale;
  translations: Localized<{ name: string; description: string }>;
}
