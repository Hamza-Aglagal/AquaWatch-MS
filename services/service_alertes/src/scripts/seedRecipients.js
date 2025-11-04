const sequelize = require('../config/database');
const AlertRecipient = require('../models/AlertRecipient');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    // Ensure tables exist
    await sequelize.sync();

    const [recipient, created] = await AlertRecipient.findOrCreate({
      where: { email: 'test@example.com' },
      defaults: {
        email: 'test@example.com',
        phone: null,
        zone_id: 'ZONE_TEST',
        active: true
      }
    });

    console.log('Seed complete:', recipient.toJSON());
    process.exit(0);
  } catch (err) {
    console.error('Seed failed', err);
    process.exit(1);
  }
}

seed();
