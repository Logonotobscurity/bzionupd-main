/**
 * NextAuth.js wrapper for server-side auth operations
 * Re-exports from root auth.ts to ensure proper module resolution
 */

export { auth, handlers, signIn, signOut } from '~/auth';
