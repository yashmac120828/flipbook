const express = require('express');
const Document = require('./models/Document');
const View = require('./models/View');
const mongoose = require('mongoose');

async function fixLocations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all views without location info
    const views = await View.find({
      'geo.city': { $exists: false }
    });

    console.log(`Found ${views.length} views without location info`);

    let updated = 0;
    let skipped = 0;

    for (const view of views) {
      // Get real IP address, looking for forwarded headers
      let realIP = view.ipAddress;

      // Check if it's behind a proxy (common with Cloudflare, etc)
      if (realIP.startsWith('::ffff:')) {
        realIP = realIP.substring(7);
      }

      // Skip local/private IPs
      if (realIP === '127.0.0.1' || realIP === 'localhost' || realIP.startsWith('192.168.') || realIP.startsWith('10.') || realIP === '::1') {
        skipped++;
        continue;
      }

      const geoip = require('geoip-lite');
      const geo = geoip.lookup(realIP);

      if (geo) {
        view.geo = {
          country: geo.country,
          region: geo.region,
          city: geo.city,
          timezone: geo.timezone,
          coordinates: {
            lat: geo.ll[0],
            lon: geo.ll[1]
          }
        };
        await view.save();
        console.log(`Updated location for view ${view._id} - ${geo.city}, ${geo.country}`);
        updated++;
      } else {
        skipped++;
      }
    }

    console.log('\nLocation fix complete:');
    console.log(`- Total views processed: ${views.length}`);
    console.log(`- Views updated: ${updated}`);
    console.log(`- Views skipped: ${skipped}`);

  } catch (error) {
    console.error('Location fix error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

fixLocations();