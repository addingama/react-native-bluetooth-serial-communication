import * as React from 'react';

import {
  StyleSheet,
  View,
  Text,
  Platform,
  FlatList,
  TouchableOpacity,
  TextInput,
  Button,
  NativeEventEmitter,
} from 'react-native';
import {
  BluetoothSerialCommunication,
  BluetoothDevice,
  BLUETOOTH_TYPE,
  BOND_STATE,
  configure,
  getPairedDevices,
  connectDevice,
  sendMessage,
  EVENT_TYPE,
  closeDevice,
} from 'react-native-bluetooth-serial-communication';
import { requestMultiple, PERMISSIONS } from 'react-native-permissions';
import Modal from 'react-native-modal';

export default function App() {
  const [data, setData] = React.useState<BluetoothDevice[]>([]);
  const [device, setDevice] = React.useState<BluetoothDevice>();
  const [showModal, setShowModal] = React.useState(false);
  const [message, setMessage] = React.useState('j');
  React.useEffect(() => {
    configure();

    const eventEmitter = new NativeEventEmitter(BluetoothSerialCommunication);
    const connectedListener = eventEmitter.addListener(
      EVENT_TYPE.CONNECTED,
      (event) => {
        console.log('connected', JSON.stringify(event));
      }
    );
    const dataReceivedListener = eventEmitter.addListener(
      EVENT_TYPE.DATA_RECEIVED,
      (event) => {
        console.log('data received', JSON.stringify(event));
      }
    );
    const dataSentListener = eventEmitter.addListener(
      EVENT_TYPE.DATA_SENT,
      (event) => {
        console.log('data sent', JSON.stringify(event));
      }
    );

    return () => {
      dataReceivedListener.remove();
      dataSentListener.remove();
      connectedListener.remove();
    };
  }, []);

  const getPermission = async () => {
    try {
      const result = await requestMultiple(
        Platform.OS === 'android'
          ? [
              PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
              PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
              PERMISSIONS.ANDROID.BLUETOOTH_ADVERTISE,
            ]
          : []
      );
      console.log(result);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const configureBluetooth = async () => {
    const granted = await getPermission();
    if (granted) {
      getPairedDevices().then(setData).catch(console.log);
    } else {
      console.log('not granted');
    }
  };

  const getBluetoothType = (type: BLUETOOTH_TYPE) => {
    if (type === BLUETOOTH_TYPE.CLASSIC) {
      return 'Classic';
    } else if (type === BLUETOOTH_TYPE.DUAL) {
      return 'Dual';
    } else if (type === BLUETOOTH_TYPE.LE) {
      return 'Low Energy';
    } else {
      return 'Unknown';
    }
  };

  const getBondState = (state: BOND_STATE) => {
    if (state === BOND_STATE.BONDED) {
      return 'Bonded';
    } else if (state === BOND_STATE.BONDING) {
      return 'Bonding';
    } else {
      return 'None';
    }
  };

  const closeModal = () => {
    setShowModal(false);
    closeDevice(device?.address ?? '');
    setDevice(undefined);
  };

  const handleSelect = (item: BluetoothDevice) => {
    setDevice(item);
    connectDevice(item.address, (s: string) => console.log('success', s));
    setShowModal(true);
  };

  const handleSendMessage = async () => {
    const result = await sendMessage(message);
    console.log(result);
  };

  const renderItem = ({ item }: { item: BluetoothDevice }) => {
    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => handleSelect(item)}
      >
        <View>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text>MAC: {item.address}</Text>
          <Text>Bond State: {getBondState(item.bond_state)}</Text>
          <Text>Type: {getBluetoothType(item.type)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={configureBluetooth} style={styles.button}>
        <Text style={styles.buttonText}>Configure</Text>
      </TouchableOpacity>

      <FlatList
        contentContainerStyle={styles.listContainer}
        data={data}
        keyExtractor={(item) => item.address}
        renderItem={renderItem}
      />
      <Modal
        isVisible={showModal}
        onBackdropPress={closeModal}
        onBackButtonPress={closeModal}
      >
        <View style={{ backgroundColor: 'white', padding: 16 }}>
          <Text>Connected to: {device?.name}</Text>
          <Text style={{ marginTop: 16 }}>Send message:</Text>
          <TextInput
            placeholder="Type message"
            value={message}
            onChangeText={setMessage}
            style={{ borderWidth: 1, marginVertical: 12 }}
          />
          <Button title="Send" onPress={handleSendMessage} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'lightgray',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#6200EE',

    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    textTransform: 'uppercase',
  },
  itemContainer: { marginBottom: 4, backgroundColor: 'white', padding: 16 },
  listContainer: {
    paddingHorizontal: 16,
  },
  itemName: { fontWeight: 'bold', fontSize: 16 },
});
