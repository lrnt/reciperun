import { sql } from "drizzle-orm";
import { db } from "./client";

/**
 * Script to clear all tables in the database
 * Disables constraints temporarily to clear tables in any order
 */
async function clearDatabase() {
  console.log("Starting database clearing process...");

  try {
    // Get a list of all tables in the public schema
    const tablesResult = await db.execute(sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    
    const tables = tablesResult.rows.map(row => row.tablename as string);
    
    if (tables.length === 0) {
      console.log("No tables found in the database.");
      return;
    }
    
    console.log(`Found ${tables.length} tables: ${tables.join(', ')}`);
    
    // Start a transaction
    await db.transaction(async (tx) => {
      // Truncate each table individually
      for (const table of tables) {
        await tx.execute(sql`TRUNCATE TABLE ${sql.identifier(table)} CASCADE;`);
        console.log(`Cleared table: ${table}`);
      }
    });
    
    console.log("Successfully cleared all tables in the database.");
  } catch (error) {
    console.error("Error clearing database:", error);
    throw error;
  }
}

// Execute the clearing function
console.log("Starting database clearing...");
await clearDatabase()
  .then(() => {
    console.log("Database successfully cleared!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to clear database:", error);
    process.exit(1);
  });