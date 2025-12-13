
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SectionTitle } from "@/components/ui/section";

export const FmcgBanner = () => {
  return (
    <section className="bg-zinc-100">
      <div className="container-constrained grid grid-cols-1 md:grid-cols-2">
        <div className="flex items-center justify-center p-8 md:p-12 order-2 md:order-1">
          <div className="max-w-md text-left">
            <SectionTitle className="leading-tight">
              The Foundation of Culinary Excellence: Cooking Oils & Fats
            </SectionTitle>
            <p className="mt-4 text-slate-600">
              From high-stability frying oils to versatile vegetable oils and premium spreads, our curated selection is engineered for consistency, quality, and performance in professional kitchens.
            </p>
            <div className="mt-8">
              <Button asChild variant="secondary" size="lg">
                <Link href="/products">
                  Explore Cooking Oils
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="relative min-h-[300px] md:min-h-[500px] order-1 md:order-2 bg-gradient-to-br from-amber-50 to-amber-100">
          <img
            src="https://i.ibb.co/SDcHPffB/banner3.png"
            alt="A variety of cooking oils"
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://placehold.co/800x600/FEF3C7/92400E?text=Cooking+Oils';
            }}
          />
        </div>
      </div>
    </section>
  );
};
