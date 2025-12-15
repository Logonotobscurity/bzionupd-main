/**
 * Database Diagnostics Endpoint
 * GET /api/diagnostics/database
 * 
 * Provides detailed information about database connection status,
 * configuration, and troubleshooting tips.
 */

import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/db';

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL ? 'SET (hidden for security)' : 'NOT SET',
    useDatabase: process.env.USE_DATABASE,
    checks: {
      databaseConnection: false as boolean,
      connectionDetails: null as Record<string, unknown> | null,
      error: null as string | null,
    },
  };

  try {
    // Test database connection
    const isConnected = await checkDatabaseConnection();
    diagnostics.checks.databaseConnection = isConnected;

    if (isConnected) {
      diagnostics.checks.connectionDetails = {
        status: 'connected',
        testQuery: 'SELECT 1 (successful)',
        responseTime: 'fast',
      };
    } else {
      diagnostics.checks.error = 'Database connection returned false';
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    diagnostics.checks.databaseConnection = false;
    diagnostics.checks.error = errorMessage;

    // Extract connection details from error
    if (errorMessage.includes('ECONNREFUSED')) {
      diagnostics.checks.connectionDetails = {
        status: 'connection_refused',
        message: 'Database server is not accepting connections',
        possibleCauses: [
          'Database server is down',
          'Incorrect host or port',
          'Firewall blocking connection',
          'Database credentials are invalid',
        ],
        solutions: [
          'Check if database server is running',
          'Verify DATABASE_URL environment variable',
          'Check firewall/network rules',
          'Verify credentials and permissions',
        ],
      };
    } else if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
      diagnostics.checks.connectionDetails = {
        status: 'dns_resolution_failed',
        message: 'Cannot resolve database hostname',
        possibleCauses: [
          'Database host is incorrect',
          'DNS is not resolving',
          'Network connectivity issue',
        ],
        solutions: [
          'Check DATABASE_URL host is correct',
          'Verify network connectivity',
          'Check DNS resolution',
        ],
      };
    } else if (errorMessage.includes('FATAL') || errorMessage.includes('authentication')) {
      diagnostics.checks.connectionDetails = {
        status: 'authentication_failed',
        message: 'Database rejected credentials',
        possibleCauses: [
          'Invalid username/password',
          'Insufficient permissions',
          'User account disabled',
        ],
        solutions: [
          'Verify DATABASE_URL credentials',
          'Check database user permissions',
          'Reset database password if needed',
        ],
      };
    } else {
      diagnostics.checks.connectionDetails = {
        status: 'connection_error',
        message: errorMessage,
        suggestion: 'Check server logs for more details',
      };
    }
  }

  const statusCode = diagnostics.checks.databaseConnection ? 200 : 503;

  return NextResponse.json(diagnostics, { status: statusCode });
}
