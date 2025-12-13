import { redirect } from 'next/navigation';

interface RouteParams {
  slug: string;
}

/**
 * This route handles redirects from /products/brands/[slug]
 * to /products/brand/[slug] for unified routing
 */
export async function GET(
  _: Request,
  { params }: { params: Promise<RouteParams> }
) {
  const { slug } = await params;
  
  // Redirect /products/brands/[slug] to /products/brand/[slug]
  redirect(`/products/brand/${slug}`);
}

/**
 * Optional: Set revalidate for dynamic routing
 */
export const revalidate = 3600; // 1 hour
