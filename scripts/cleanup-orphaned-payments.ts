#!/usr/bin/env npx tsx

/**
 * Script to cleanup orphaned payments (paid but never registered)
 * Run this script periodically to clean up old data
 *
 * Usage:
 * npx tsx scripts/cleanup-orphaned-payments.ts [--dry-run] [--days=90]
 */

import { cleanupOrphanedPayments, getOrphanedPaymentStats } from "../lib/payment-link-utils";

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const daysArg = args.find(arg => arg.startsWith('--days='));

  const days = daysArg ? parseInt(daysArg.split('=')[1]) : 90;

  console.log(`🔍 Checking orphaned payments...`);

  // Get current stats
  const stats = await getOrphanedPaymentStats();
  console.log(`
📊 Current orphaned payments stats:
   Total: ${stats.total}
   Last 7 days: ${stats.last7Days}
   Last 30 days: ${stats.last30Days}
   Older than 30 days: ${stats.olderThan30Days}
   Older than 90 days: ${stats.olderThan90Days}
  `);

  if (stats.total === 0) {
    console.log('✅ No orphaned payments found.');
    return;
  }

  // Show what would be cleaned
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  console.log(`🧹 Cleanup plan (older than ${days} days = ${cutoffDate.toISOString().split('T')[0]}):`);
  console.log(`   Would clean: ${stats.olderThan30Days} payments`);

  if (isDryRun) {
    console.log('🔍 DRY RUN - No changes made.');
    return;
  }

  if (stats.olderThan30Days === 0) {
    console.log('✅ No payments to clean up.');
    return;
  }

  console.log('🧹 Starting cleanup...');

  const result = await cleanupOrphanedPayments(days);

  if (result.errors.length > 0) {
    console.error('❌ Cleanup completed with errors:');
    result.errors.forEach(error => console.error(`   - ${error}`));
  } else {
    console.log(`✅ Cleanup completed successfully!`);
    console.log(`   Cleaned: ${result.cleaned} orphaned payments`);
  }

  // Show updated stats
  const updatedStats = await getOrphanedPaymentStats();
  console.log(`
📊 Updated stats:
   Total: ${updatedStats.total} (was ${stats.total})
   Last 7 days: ${updatedStats.last7Days}
   Last 30 days: ${updatedStats.last30Days}
  `);
}

main().catch(console.error);