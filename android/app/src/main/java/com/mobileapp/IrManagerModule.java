package com.mobileapp;

import android.hardware.ConsumerIrManager;
import android.content.Context;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.Promise;

public class IrManagerModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public IrManagerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "IrManager";
    }

    @ReactMethod
    public void hasIrEmitter(Promise promise) {
        ConsumerIrManager irManager = (ConsumerIrManager) reactContext.getSystemService(Context.CONSUMER_IR_SERVICE);
        if (irManager != null) {
            promise.resolve(irManager.hasIrEmitter());
        } else {
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void transmit(int carrierFrequency, ReadableArray pattern, Promise promise) {
        ConsumerIrManager irManager = (ConsumerIrManager) reactContext.getSystemService(Context.CONSUMER_IR_SERVICE);
        if (irManager == null || !irManager.hasIrEmitter()) {
            promise.reject("NO_IR", "Device does not have an IR emitter");
            return;
        }

        int[] irPattern = new int[pattern.size()];
        for (int i = 0; i < pattern.size(); i++) {
            irPattern[i] = pattern.getInt(i);
        }

        irManager.transmit(carrierFrequency, irPattern);
        promise.resolve(true);
    }
}
