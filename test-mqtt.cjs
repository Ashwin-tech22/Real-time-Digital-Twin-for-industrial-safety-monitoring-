const mqtt = require('mqtt');

const client = mqtt.connect('wss://a26acee3ce434054bdad8c7f5d8a9604.s1.eu.hivemq.cloud:8884/mqtt', {
  username: 'Digital',
  password: 'Twin12345',
  clientId: 'testNode_' + Math.random().toString(16).substr(2, 8)
});

client.on('connect', () => {
  console.log('Connected natively via NodeJS Websocket!');
  process.exit(0);
});

client.on('error', (err) => {
  console.error('NATIVE ERROR:', err);
  process.exit(1);
});

client.on('close', () => {
  console.log('NATIVE CLOSE');
});
