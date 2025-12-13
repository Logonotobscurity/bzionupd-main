
'use client';

import Image from 'next/image';
import { type Product } from '@/lib/schema';
import Link from 'next/link';
import { AddToQuoteButton } from './add-to-quote-button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { getPlaceholderImage } from '@/lib/placeholder-images';
import { Star, Zap } from 'lucide-react';

interface ProductCardProps {
    product: Product;
    priority?: boolean;
    variant?: 'default' | 'compact' | 'featured';
}

const cardStyles = {
    container: "group h-full flex flex-col overflow-hidden rounded-xl sm:rounded-2xl relative bg-white border border-slate-200/50 will-change-transform",
    imageContainer: "relative bg-white overflow-hidden flex items-center justify-center",
    imageWrapper: "relative w-full h-full flex items-center justify-center",
    image: "object-contain",
    contentWrapper: "flex-grow flex flex-col gap-2 p-3 sm:p-3.5 md:p-4",
    brand: "text-xs font-semibold text-secondary/80 uppercase tracking-widest truncate",
    title: "font-bold text-primary text-sm sm:text-base leading-snug line-clamp-2 break-words",
    description: "text-xs text-slate-500 line-clamp-1 mt-0.5",
    badgeContainer: "flex gap-1.5 flex-wrap mt-2",
    badge: "inline-flex items-center gap-1",
    buttonWrapper: "px-3 sm:px-3.5 md:px-4 pb-3 sm:pb-3.5 md:pb-4 pt-2",
    overlayGradient: "absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 pointer-events-none",
};

const variantStyles = {
    default: {
        imageContainerHeight: "h-[180px] sm:h-[200px] md:h-[200px] lg:h-[220px]",
    },
    compact: {
        imageContainerHeight: "h-[140px] sm:h-[160px] md:h-[160px] lg:h-[180px]",
    },
    featured: {
        imageContainerHeight: "h-[240px] sm:h-[260px] md:h-[280px] lg:h-[300px]",
    }
};

export const ProductCard = ({ 
    product, 
    priority = false,
    variant = 'default'
}: ProductCardProps) => {
    const href = product.slug ? `/products/${product.slug}` : '#';
    const fallbackImage = getPlaceholderImage(String(product.id));
    const currentVariant = variantStyles[variant];
    
    const getProductImage = () => {
        if (product.imageUrl && product.imageUrl !== '/images/placeholder.jpg') {
            return product.imageUrl;
        }
        if (Array.isArray(product.images) && product.images.length > 0) {
            return product.images[0];
        }
        return fallbackImage;
    };
    
    const imageUrl = getProductImage();
    const isFeatured = product.isFeatured;
    const isNew = product.createdAt && new Date(product.createdAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000;

    return (
        <Link 
            href={href} 
            className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl sm:rounded-2xl"
            aria-label={`View ${product.name} by ${product.brand}`}
        >
            <Card className={cardStyles.container}>
                
                <div className={`${cardStyles.imageContainer} ${currentVariant.imageContainerHeight}`}>
                    <div className={cardStyles.imageWrapper}>
                        <Image 
                            src={imageUrl}
                            alt={product.name}
                            fill
                            className={cardStyles.image}
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            priority={priority}
                            quality={80}
                            loading={priority ? 'eager' : 'lazy'}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = fallbackImage;
                            }}
                        />
                    </div>
                    <div className={cardStyles.overlayGradient} />
                    
                    {(isFeatured || isNew) && (
                        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10">
                            {isFeatured && (
                                <Badge className={`${cardStyles.badge} bg-amber-50 text-amber-700 border border-amber-200 rounded-full shadow-sm`}>
                                    <Star className="h-3 w-3 fill-amber-700" /> 
                                    <span className="text-xs font-semibold">Featured</span>
                                </Badge>
                            )}
                            {isNew && (
                                <Badge className={`${cardStyles.badge} bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full shadow-sm`}>
                                    <Zap className="h-3 w-3 fill-emerald-700" />
                                    <span className="text-xs font-semibold">New</span>
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
                
                <div className={cardStyles.contentWrapper}>
                    <div>
                        <p className={cardStyles.brand}>{product.brand}</p>
                        <h3 className={cardStyles.title}>{product.name}</h3>
                    </div>
                </div>
                
                <div className={cardStyles.buttonWrapper}>
                    <AddToQuoteButton product={product} />
                </div>
            </Card>
        </Link>
    );
}
