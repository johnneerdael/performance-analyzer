#!/usr/bin/env node
import { run } from '../cli';

// Run the CLI application
run().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});