'use client';

import { useState, useEffect } from 'react';
import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/ui/section";
import { CategoryCard } from '@/components/ui/category-card';
import { getCategoryPageData, EnrichedCategoryData } from "@/services/productService";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { CTASection } from '@/components/cta-section';

export default function CategoriesPage() {
    const [allCategories, setAllCategories] = useState<EnrichedCategoryData[]>([]);
    const [filteredCategories, setFilteredCategories] = useState<EnrichedCategoryData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const data = await getCategoryPageData();
            setAllCategories(data);
            setFilteredCategories(data);
        };
        fetchData();
    }, []);

    useEffect(() => {
        const results = allCategories.filter(category =>
            category.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredCategories(results);
    }, [searchTerm, allCategories]);

    const totalProducts = allCategories.reduce((sum, cat) => sum + cat.productCount, 0);
    const totalBrands = [...new Set(allCategories.flatMap(cat => cat.topBrands.map(b => b.name)))].length;
    const categoriesInStock = allCategories.filter(c => c.inStockCount > 0).length;

    return (
        <main className="flex-grow">
            <PageHero 
                preamble="Shop by Category"
                title="Find Exactly What You Need"
                description="Explore our 74 premium food products across 6 categories. From cooking oils to dairy—sourced directly from Nigeria's leading manufacturers. Bulk pricing available."
                stats={[
                  { label: 'Categories', value: allCategories.length },
                  { label: 'Products', value: totalProducts },
                  { label: 'Brands', value: totalBrands },
                  { label: 'In Stock', value: categoriesInStock },
                  { label: 'Bulk Options', value: 100 }
                ]}
                actions={[
                    <div key="search-bar" className="relative w-full max-w-md mx-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input 
                            type="text"
                            placeholder="Search categories..."
                            className="w-full pl-10 pr-4 py-2"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>,
                    <Button key="view-brands" asChild variant="outline" size="lg" className="text-white border-white hover:bg-white hover:text-primary font-bold"><a href="/products/brands">View by Brands</a></Button>,
                ]}
            />
            <Section className="py-8 md:py-12 bg-slate-50">
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredCategories.map(category => (
                        <CategoryCard key={category.id} category={category} />
                    ))}
                </div>
            </Section>
            <Section className="py-12 md:py-16">
              <CTASection 
                title="Ready to Stock Your Shelves?"
                description="BZION is your trusted partner for wholesale and B2B procurement. Access exclusive pricing, bulk discounts, and a seamless ordering process designed for businesses like yours. Let's build a profitable partnership."
                ctaText="Request a B2B Quote"
                ctaHref="/b2b-quote"
                variant="default"
              />
            </Section>
        </main>
      );
}
