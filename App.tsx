import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, NativeModules, Button } from 'react-native';
import io from 'socket.io-client';

const { IrManager } = NativeModules;

// Replace with your PC's local IP address on your Wi-Fi network
const PC_SERVER_IP = '10.27.183.84'; 
const SERVER_URL = `http://${PC_SERVER_IP}:3000`;

// A dictionary of known IR codes (you will replace these with the ones you discover via the brute force script)
const IR_CODES = {
  power: "00FF00FF",
  vol_up: "00FF40BF",
  vol_down: "00FF807F",
  prev: "00FF22DD",
  next: "00FF02FD",
  treble_up: "00FF10EF",
  treble_down: "00FF50AF",
  bass_up: "00FF906F",
  bass_down: "00FFD02F",
  mode: "00FF30CF",
  light_mode: "00FF20DF"
};

// Helper function to generate NEC Timing from Hex
const generateNECTiming = (hexCode) => {
  let binary = parseInt(hexCode, 16).toString(2).padStart(32, '0');
  let timing = [9000, 4500];
  
  for (let i = 0; i < binary.length; i++) {
      timing.push(560);
      if (binary[i] === '1') timing.push(1690);
      else timing.push(560);
  }
  timing.push(560);
  return timing;
};

const App = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [hasIrEmitter, setHasIrEmitter] = useState(null);
  const [lastCommand, setLastCommand] = useState('None');

  useEffect(() => {
    // 1. Check for IR Blaster Hardware
    IrManager.hasIrEmitter()
      .then((hasIr) => setHasIrEmitter(hasIr))
      .catch((err) => console.log(err));

    // 2. Connect to PC Server
    const socket = io(SERVER_URL);

    socket.on('connect', () => {
      setIsConnected(true);
      // Register this device as the mobile blaster
      socket.emit('register_client', { type: 'mobile_blaster' });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // 3. Listen for IR Triggers from PC
    socket.on('execute_ir', (commandData) => {
      console.log('Received command from PC:', commandData);
      const action = commandData.action;

      let hexCode = null;
      // If action is a valid 8-character hex code, use it directly!
      if (action && action.length === 8 && /^[0-9A-Fa-f]{8}$/.test(action)) {
        hexCode = action.toUpperCase();
        setLastCommand(`Custom Hex: ${hexCode}`);
      } else {
        hexCode = IR_CODES[action];
        setLastCommand(action);
      }

      if (hexCode) {
        const pattern = generateNECTiming(hexCode);
        // Transmit at 38kHz
        IrManager.transmit(38000, pattern)
          .then(() => console.log(`Transmitted hex ${hexCode}`))
          .catch((err) => console.log(`Failed to transmit:`, err));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Electra Glow Blaster</Text>

        <View style={styles.statusRow}>
          <Text style={styles.label}>IR Hardware Found:</Text>
          <Text style={[styles.value, hasIrEmitter ? styles.success : styles.error]}>
            {hasIrEmitter === null ? 'Checking...' : hasIrEmitter ? 'YES' : 'NO'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.label}>PC Connection:</Text>
          <Text style={[styles.value, isConnected ? styles.success : styles.error]}>
            {isConnected ? 'ONLINE' : 'OFFLINE'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.label}>Last Command Received:</Text>
          <Text style={styles.value}>{lastCommand}</Text>
        </View>

      </View>
      
      {!isConnected && (
        <Text style={styles.instructions}>
          Make sure your PC server is running and you have updated the PC_SERVER_IP in App.js to match your computer's local Wi-Fi IP address.
        </Text>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#BB86FC',
    textAlign: 'center',
    marginBottom: 30,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    paddingBottom: 10,
  },
  label: {
    color: '#AAAAAA',
    fontSize: 16,
  },
  value: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  success: {
    color: '#03DAC6',
  },
  error: {
    color: '#CF6679',
  },
  instructions: {
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 22,
  }
});

export default App;
