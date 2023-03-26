package com.bluetoothserialcommunication;

import android.Manifest;
import android.annotation.SuppressLint;
import android.bluetooth.BluetoothDevice;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.ParcelUuid;
import android.util.Log;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.ActivityCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.harrysoft.androidbluetoothserial.BluetoothManager;
import com.harrysoft.androidbluetoothserial.BluetoothSerialDevice;
import com.harrysoft.androidbluetoothserial.SimpleBluetoothDeviceInterface;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import javax.xml.transform.ErrorListener;

import io.reactivex.android.schedulers.AndroidSchedulers;
import io.reactivex.functions.BiConsumer;
import io.reactivex.schedulers.Schedulers;

@ReactModule(name = BluetoothSerialCommunicationModule.NAME)
public class BluetoothSerialCommunicationModule extends ReactContextBaseJavaModule {
  public static final String NAME = "BluetoothSerialCommunication";
  public static final String TAG = "BSC";
  public BluetoothManager bluetoothManager;
  private SimpleBluetoothDeviceInterface deviceInterface;
  private ReactApplicationContext context;

  private static final String DATA_RECEIVED = "dataReceived";
  private static final String DATA_SENT = "dataSent";
  private static final String CONNECTED = "connected";

  public BluetoothSerialCommunicationModule(ReactApplicationContext reactContext) {
    super(reactContext);
    context = reactContext;
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }

  private void sendEvent(ReactContext reactContext,
                         String eventName,
                         @Nullable WritableMap params) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit(eventName, params);
  }

  @ReactMethod
  public void addListener(String eventName) {

  }

  @ReactMethod
  public void removeListeners(Integer count) {

  }

  @ReactMethod
  public void configure(Promise promise) {
    bluetoothManager = BluetoothManager.getInstance();
    if (bluetoothManager == null) {
      promise.reject(new Throwable("Bluetooth is not available"));
    } else {
      promise.resolve(true);
    }
  }

  @ReactMethod
  public void getPairedDevices(Promise promise) {
    Collection<BluetoothDevice> pairedDevices = bluetoothManager.getPairedDevicesList();
    WritableNativeArray result = new WritableNativeArray();
    for (BluetoothDevice device : pairedDevices) {
      result.pushMap(parseBluetoothDevice(device));
    }
     promise.resolve(result);
  }

  @SuppressLint("CheckResult")
  @ReactMethod
  public void connectDevice(String mac, Callback onSuccess) {
    bluetoothManager.openSerialDevice(mac)
      .subscribeOn(Schedulers.io())
      .observeOn(AndroidSchedulers.mainThread())
      .subscribe((bluetoothSerialDevice, throwable) -> {
        if (bluetoothSerialDevice != null) {
          deviceInterface = bluetoothSerialDevice.toSimpleDeviceInterface();
          deviceInterface.setMessageReceivedListener(s -> {

            WritableMap payload = Arguments.createMap();
            payload.putString("message", s);
            sendEvent(context, DATA_RECEIVED, payload);
            onSuccess.invoke(s);
          });

          deviceInterface.setMessageSentListener(s -> Log.d(TAG, s));
          deviceInterface.setErrorListener(throwable1 -> {
            WritableMap payload = Arguments.createMap();
            payload.putBoolean("error", true);
            payload.putString("message", throwable1.getMessage());
            sendEvent(context, DATA_RECEIVED, payload);
          });

          WritableMap payload = Arguments.createMap();
          payload.putBoolean("connected", true);
          sendEvent(context, CONNECTED, payload);
        }

        if (throwable != null) {
          Log.d(TAG, throwable.getMessage());
          WritableMap payload = Arguments.createMap();
          payload.putBoolean("connected", false);
          payload.putString("message", throwable.getMessage());
          sendEvent(context, CONNECTED, payload);
        }

      });
  }

  @ReactMethod
  public void sendMessage(String message, Promise promise) {
    if (deviceInterface != null) {
      WritableMap payload = Arguments.createMap();
      payload.putString("message", message);
      sendEvent(context, DATA_SENT, payload);
      deviceInterface.sendMessage(message);
      promise.resolve(true);
    } else {
      promise.reject(null, "No connected device");
    }

  }

  @ReactMethod
  public void closeDevice(String mac) {
    bluetoothManager.closeDevice(mac);
    WritableMap payload = Arguments.createMap();
    payload.putBoolean("connected", false);
    sendEvent(context, CONNECTED, payload);
  }

  @SuppressLint("MissingPermission")
  private WritableMap parseBluetoothDevice(BluetoothDevice device) {
    WritableMap map = Arguments.createMap();
    map.putString("name", device.getName());
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      map.putString("alias", device.getAlias());
    }
    map.putString("address", device.getAddress());
    map.putInt("bond_state", device.getBondState());
    map.putInt("type", device.getType());


    return map;
  }
}
