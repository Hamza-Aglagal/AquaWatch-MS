const mqtt = require('mqtt');

const broker = process.env.MQTT_BROKER_URL || 'mqtt://test.mosquitto.org:1883';
const topicBase = process.env.MQTT_TOPIC_BASE || 'aquawatch/capteur';
const capteurId = process.env.CAPTEUR_ID || 'CAP001';
const topic = `${topicBase}/${capteurId}/data`;

const payload = {
  time: new Date().toISOString(),
  gps: { lat: 33.5731, lon: -7.5898 },
  mesures: {
    ph: 7.2,
    temperature: 22.5,
    turbidity: 12.3,
    oxygene: 8.1,
    conductivite: 500
  }
};

console.log(`Publishing to ${broker} -> ${topic}`);
const client = mqtt.connect(broker, { connectTimeout: 15000, reconnectPeriod: 5000 });

client.on('connect', () => {
  client.publish(topic, JSON.stringify(payload), { qos: 0, retain: false }, (err) => {
    if (err) {
      console.error('Publish error:', err);
      process.exit(1);
    }
    console.log('Published payload:', payload);
    client.end(false, () => process.exit(0));
  });
});

client.on('error', (err) => {
  console.error('MQTT client error:', err);
  process.exit(2);
});
