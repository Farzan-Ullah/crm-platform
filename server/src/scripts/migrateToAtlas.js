import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const LOCAL_URI = process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/crm_platform';
const ATLAS_URI = process.env.ATLAS_MONGO_URI || process.env.MONGO_URI;

if (!ATLAS_URI || !ATLAS_URI.startsWith('mongodb')) {
  console.error('Error: ATLAS_MONGO_URI or MONGO_URI must be provided in server/.env');
  process.exit(1);
}

const migrate = async () => {
  console.log('===========================================================');
  console.log('  STARTING DATABASE MIGRATION (LOCAL -> ATLAS)');
  console.log('===========================================================');
  console.log(`Source (Local):  ${LOCAL_URI}`);
  console.log(`Target (Atlas):  ${ATLAS_URI.replace(/:([^:@]+)@/, ':****@')}`);
  console.log('-----------------------------------------------------------');

  let localConn = null;
  let atlasConn = null;

  try {
    console.log('Connecting to Local MongoDB...');
    localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('Connected to Local MongoDB.');

    console.log('Connecting to MongoDB Atlas...');
    atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
    console.log('Connected to MongoDB Atlas.');

    const localDb = localConn.db;
    const atlasDb = atlasConn.db;

    const collections = await localDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections to migrate.\n`);

    const summary = [];

    for (const col of collections) {
      const colName = col.name;

      // Skip internal system collections
      if (colName.startsWith('system.')) continue;

      const localCol = localDb.collection(colName);
      const atlasCol = atlasDb.collection(colName);

      const docs = await localCol.find({}).toArray();
      const count = docs.length;

      if (count > 0) {
        // Drop existing target collection to prevent duplicate key conflicts
        try {
          await atlasCol.drop();
        } catch (err) {
          // If collection did not exist yet, ignore drop error
        }

        // Insert documents into Atlas
        await atlasCol.insertMany(docs, { ordered: false });

        // Copy custom indexes (skip standard _id_ index)
        try {
          const rawIndexes = await localCol.indexes();
          const customIndexes = rawIndexes
            .filter((idx) => idx.name !== '_id_' && !idx.key._fts)
            .map((idx) => ({
              key: idx.key,
              name: idx.name,
              unique: !!idx.unique,
              sparse: !!idx.sparse,
              background: true,
            }));

          if (customIndexes.length > 0) {
            await atlasCol.createIndexes(customIndexes);
          }
        } catch (idxErr) {
          console.warn(`  Warning: Index creation warning on '${colName}':`, idxErr.message);
        }
      }

      summary.push({ collection: colName, documents: count });
      console.log(`  Migrated [${colName}]: ${count} records`);
    }

    console.log('\n===========================================================');
    console.log('  MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('===========================================================');
    console.table(summary);

    const totalDocs = summary.reduce((acc, curr) => acc + curr.documents, 0);
    console.log(`Total Documents Migrated: ${totalDocs}`);
    console.log('===========================================================');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    if (localConn) await localConn.close();
    if (atlasConn) await atlasConn.close();
    process.exit(0);
  }
};

migrate();
