// MongoDB initialization script for AquaWatch Satellite Service
// Creates the satellite_db database and collections

// Switch to satellite_db (using root credentials from env)
db = db.getSiblingDB('satellite_db');

// Create collections with indexes
db.createCollection('satellite_images');
db.createCollection('indices_history');

// Create indexes for better query performance
db.satellite_images.createIndex({ "timestamp": -1 });
db.satellite_images.createIndex({ "zone.latitude": 1, "zone.longitude": 1 });
db.satellite_images.createIndex({ "processed": 1 });
db.satellite_images.createIndex({ "image_id": 1 }, { unique: true });

db.indices_history.createIndex({ "timestamp": -1 });
db.indices_history.createIndex({ "location": "2dsphere" });

// Insert sample data for testing
db.satellite_images.insertMany([
    {
        image_id: "SENT2_20251201_CASA_001",
        zone: {
            name: "Casablanca",
            latitude: 33.5731,
            longitude: -7.5898
        },
        indices: {
            ndwi: 0.35,
            chlorophyll: 0.22,
            turbidity: 0.18
        },
        processed: true,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        source: "Sentinel-2"
    },
    {
        image_id: "SENT2_20251202_CASA_002",
        zone: {
            name: "Casablanca",
            latitude: 33.5731,
            longitude: -7.5898
        },
        indices: {
            ndwi: 0.38,
            chlorophyll: 0.25,
            turbidity: 0.20
        },
        processed: true,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        source: "Sentinel-2"
    },
    {
        image_id: "SENT2_20251201_RABAT_001",
        zone: {
            name: "Rabat",
            latitude: 34.0209,
            longitude: -6.8416
        },
        indices: {
            ndwi: 0.42,
            chlorophyll: 0.28,
            turbidity: 0.15
        },
        processed: true,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        source: "Sentinel-2"
    }
]);

print("✅ MongoDB initialization complete!");
print("📊 Created collections: satellite_images, indices_history");
print("📍 Inserted 3 sample satellite images");
