'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AnimatedDiv } from '@/components/animated-div';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export type Slide = {
  image: string;
  title: string;
  description: string;
  cta: string;
  href: string;
};

type HeroCarouselProps = {
  slides: Slide[];
};

const HomeCarousel = ({ slides }: HeroCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ playOnInit: true, delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true }),
  ]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([]);

  const scrollPrev = React.useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = React.useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = React.useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  React.useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };
    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  return (
    <section
      className="relative w-full h-full overflow-hidden group"
      ref={emblaRef}
      role="region"
      aria-roledescription="carousel"
    >
      <div className="flex h-full w-full">
        {slides.map((slide, index) => (
          <div
            key={index}
            className="relative flex-[0_0_100%] h-full"
            role="group"
            aria-label={`Slide ${index + 1} of ${slides.length}`}
          >
            <Image
                src={slide.image}
                alt={slide.title}
                fill
                priority={index === 0}
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 100vw"
                quality={80}
            />
            {/* Enhanced gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/70 to-primary/60" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            
            {/* Animated background elements */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-secondary/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000" />
            </div>

            <div className="container-constrained relative z-10 flex flex-col items-center justify-center h-full text-center text-white py-section-md sm:py-section-lg md:py-section-xl">
              <AnimatedDiv className="w-full max-w-4xl space-y-4 sm:space-y-6 md:space-y-8 lg:space-y-10 px-4 sm:px-6">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-tight drop-shadow-lg">
                  {slide.title}
                </h1>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-100 max-w-2xl mx-auto drop-shadow-md leading-relaxed">
                  {slide.description}
                </p>
                <div className="pt-2 sm:pt-4 md:pt-6 lg:pt-8">
                  <Button 
                    asChild 
                    size="lg" 
                    variant="secondary"
                    className="hover:shadow-2xl hover:shadow-secondary/50 transform hover:scale-105 transition-all duration-300 font-semibold text-sm sm:text-base"
                  >
                    <Link href={slide.href}>{slide.cta}</Link>
                  </Button>
                </div>
              </AnimatedDiv>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <div className="absolute top-1/2 -translate-y-1/2 left-2 right-2 sm:left-3 sm:right-3 md:left-4 md:right-4 flex justify-between text-white z-20">
        <button
          onClick={scrollPrev}
          className="hidden md:flex h-10 w-10 md:h-12 md:w-12 p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 border border-white/30 items-center justify-center"
          aria-label="Previous slide"
        >
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <button
          onClick={scrollNext}
          className="hidden md:flex h-10 w-10 md:h-12 md:w-12 p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 border border-white/30 items-center justify-center"
          aria-label="Next slide"
        >
          <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>

      {/* Dot Indicators */}
      <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 sm:gap-2 md:gap-3 bg-white/10 backdrop-blur-md px-2 sm:px-3 md:px-4 py-2 rounded-full border border-white/20">
        {scrollSnaps.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={cn(
              'rounded-full transition-all duration-300 hover:scale-110',
              index === selectedIndex 
                ? 'w-7 h-2.5 sm:w-8 sm:h-3 bg-white shadow-lg shadow-white/50' 
                : 'w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-white/40 hover:bg-white/70'
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HomeCarousel;
