
import { getProductPageData } from '@/services/productService';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { trackProductView } from '@/lib/analytics';
import ProductDetailClient from './client-page';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getProductPageData(slug);

  if (!data) {
    return notFound();
  }

  // Track product view analytics (non-blocking, fire-and-forget)
  const session = await auth();
  if (data.product && data.category) {
    trackProductView(
      String(data.product.id),
      session?.user?.id ? parseInt(session.user.id) : null,
      {
        slug,
        category: data.category.name || 'uncategorized',
        price: data.product.price,
      }
    ).catch(() => {
      // Silently ignore analytics errors
    });
  }

  return <ProductDetailClient {...data} />;
}
