"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SectionTitle } from "@/components/ui/section";

export const SpicesBanner = () => {
  return (
    <section className="bg-zinc-100">
      <div className="container-constrained grid grid-cols-1 md:grid-cols-2">
        <div className="relative min-h-[300px] md:min-h-[500px] bg-gradient-to-br from-red-50 to-orange-100">
          <img
            src="https://i.ibb.co/hxRNVf7X/banner-2.png"
            alt="A variety of colorful spices"
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://placehold.co/800x600/FEE2E2/991B1B?text=Spices+%26+Seasonings';
            }}
          />
        </div>
        <div className="flex items-center justify-center p-8 md:p-12">
          <div className="max-w-md text-left">
            <SectionTitle className="leading-tight">
              The Art of Flavor: Seasonings & Enhancers
            </SectionTitle>
            <p className="mt-4 text-slate-600">
              Unlock culinary creativity with our comprehensive portfolio of
              seasonings, spices, and flavor enhancers, designed to deliver
              authentic, consistent, and memorable taste profiles for any
              application.
            </p>
            <div className="mt-8">
              <Button asChild variant="secondary" size="lg">
                <Link href="/products/category/seasonings-flavor">
                  Discover Seasonings
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
