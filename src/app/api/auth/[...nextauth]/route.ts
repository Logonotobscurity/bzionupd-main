import { handlers } from '~/auth';

// Prevent this route from being statically exported during build
export const dynamic = 'force-dynamic';

// Export handlers from NextAuth configuration
export const { GET, POST } = handlers;
