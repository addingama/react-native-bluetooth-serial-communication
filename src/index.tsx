import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-bluetooth-serial-communication' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

export const BluetoothSerialCommunication =
  NativeModules.BluetoothSerialCommunication
    ? NativeModules.BluetoothSerialCommunication
    : new Proxy(
        {},
        {
          get() {
            throw new Error(LINKING_ERROR);
          },
        }
      );

export function configure(): Promise<any> {
  return BluetoothSerialCommunication.configure();
}

export function getPairedDevices(): Promise<BluetoothDevice[]> {
  return BluetoothSerialCommunication.getPairedDevices();
}

export function connectDevice(mac: string, onSuccess: Function): Promise<any> {
  return BluetoothSerialCommunication.connectDevice(mac, onSuccess);
}

export function closeDevice(mac: string): Promise<any> {
  return BluetoothSerialCommunication.closeDevice(mac);
}

export function sendMessage(message: string): Promise<any> {
  return BluetoothSerialCommunication.sendMessage(message);
}

export type BluetoothDevice = {
  name: string;
  address: string;
  alias?: string;
  bond_state: BOND_STATE;
  type: BLUETOOTH_TYPE;
};

export enum BOND_STATE {
  BONDED = 12,
  BONDING = 11,
  NONE = 10,
}

export enum BLUETOOTH_TYPE {
  CLASSIC = 1,
  DUAL = 3,
  LE = 2,
  UNKNOWN = 0,
}

export enum EVENT_TYPE {
  DATA_RECEIVED = 'dataReceived',
  DATA_SENT = 'dataSend',
  CONNECTED = 'connected',
}
