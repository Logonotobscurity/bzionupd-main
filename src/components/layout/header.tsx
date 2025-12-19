'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/search-bar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import React from "react";
import { QuoteListIcon } from "./quote-list-icon";
import { getCategories, getBrands } from "@/services/productService";
import { QuoteDrawer } from "./quote-drawer";

const scrollToSection = (href: string) => {
  if (typeof window === 'undefined') return;
  
  const [path, hash] = href.split('#');
  if (!hash) {
    window.location.href = href;
    return;
  }

  if (path && window.location.pathname !== path) {
    window.location.href = href;
    return;
  }

  const element = document.getElementById(hash);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const aboutLinks = [
  { title: "Our Story", href: "/about" },
  { title: "Mission & Vision", href: "/about#mission-vision" },
  { title: "Leadership", href: "/about#leadership" },
];

const customerTypes = [
  { title: "For Retail & Supermarkets", href: "/customers#customer-retail" },
  { title: "For Bulk Buyers & Wholesalers", href: "/customers#customer-wholesalers" },
  { title: "For Schools & Institutions", href: "/customers#customer-institutions" },
  { title: "For Events & Celebrations", href: "/customers#customer-events" },
  { title: "For Export & International Orders", href: "/customers#customer-export" },
  { title: "For Healthcare & Hospitality", href: "/customers#customer-hospitality" },
];

const supplierLinks = [
  { title: "Our Company Partners", href: "/companies" },
  { title: "Become a Supplier", href: "/contact" },
];

const resourceLinks = [
  { title: "Our Locations", href: "/contact" },
  { title: "Customer Care", href: "/contact" },
  { title: "FAQ", href: "/faq" },
  { title: "Resources", href: "/resources" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [productCategories, setProductCategories] = useState<{ title: string, href: string }[]>([]);
  const [productBrands, setProductBrands] = useState<{ title: string, href: string }[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const { data: session } = useSession();

  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect((): (() => void) | undefined => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
      const handleEscapeKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsMenuOpen(false);
        }
      };
      document.addEventListener("keydown", handleEscapeKey);
      return () => document.removeEventListener("keydown", handleEscapeKey);
    }
    document.body.style.overflow = "";
    return undefined;
  }, [isMenuOpen]);

  useEffect(() => {
    const fetchData = async () => {
      const categoriesData = await getCategories();
      setProductCategories(categoriesData.map(c => ({ title: c.name, href: `/products/category/${c.slug}` })));
      
      const brandsData = await getBrands();
      setProductBrands(brandsData.filter(b => b.isFeatured).map(b => ({ title: b.name, href: `/products/brand/${b.slug}` })));
    };

    fetchData();
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const toggleExpandMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const navLinks = [
    {
      href: "/about",
      label: "About",
      dropdown: aboutLinks,
    },
    {
      href: "/products",
      label: "Products",
      subMenus: [
        {
          label: "Shop by Category",
          items: productCategories,
          allLink: { title: "All Categories", href: "/products/categories" }
        },
        {
          label: "Shop by Brand",
          items: productBrands,
          allLink: { title: "All Brands", href: "/products" }
        },
      ],
    },
    {
      href: "/customers",
      label: "Customers",
      dropdown: customerTypes,
    },
    {
      href: "/suppliers",
      label: "Suppliers",
      dropdown: supplierLinks,
    },
    { href: "/careers", label: "Careers" },
    { href: "/contact", label: "Contact", dropdown: resourceLinks },
  ];
  
  if (!isClient) {
    return (
      <header className="sticky top-0 z-40 w-full bg-white shadow-sm">
        <div className="container-constrained flex items-center justify-between h-[60px] md:h-[80px]">
          <Logo className="w-[120px] md:w-[162px]" />
        </div>
      </header>
    );
  }

  return (
    <>
      <header className={cn("sticky top-0 left-0 right-0 z-[100] w-full bg-white shadow-sm transition-all duration-300", "will-change-transform")}>
        <div className="w-full px-fluid py-nav-padding-block flex items-center justify-between gap-fluid-md">
          <div className="flex items-center gap-fluid-sm min-w-0">
            <Logo className="w-28 sm:w-32 md:w-36 lg:w-40 flex-shrink-0" />
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <React.Fragment key={link.label}>
                  {link.dropdown || link.subMenus ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger className={cn("flex items-center text-sm font-semibold transition-colors hover:text-primary !bg-transparent px-2 py-1.5 outline-none whitespace-nowrap", pathname.startsWith(link.href) ? "text-primary" : "text-foreground")}>
                        {link.label}
                        <ChevronDown className="relative top-[1px] ml-1 h-3 w-3 transition duration-200" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {link.subMenus ? (
                          <>
                            {link.subMenus.map(subMenu => (
                              <DropdownMenuSub key={subMenu.label}>
                                <DropdownMenuSubTrigger>
                                  <span>{subMenu.label}</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  {subMenu.items.map(item => (
                                    <DropdownMenuItem key={item.title} asChild>
                                      <Link href={item.href}>{item.title}</Link>
                                    </DropdownMenuItem>
                                  ))}
                                  {subMenu.allLink && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem asChild>
                                        <Link href={subMenu.allLink.href}>{subMenu.allLink.title}</Link>
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                            ))}
                          </>
                        ) : link.dropdown ? (
                          link.dropdown.map((item) => (
                            <DropdownMenuItem key={item.title} asChild>
                              <button onClick={() => scrollToSection(item.href)} className="w-full text-left text-sm font-medium">
                                {item.title}
                              </button>
                            </DropdownMenuItem>
                          ))
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Link href={link.href} className={cn("text-sm font-semibold transition-colors hover:text-primary px-2 py-1.5 inline-flex items-center whitespace-nowrap", pathname === link.href ? 'text-primary' : 'text-foreground')}>
                      {link.label}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            <SearchBar />
            <QuoteListIcon />
            <Button asChild size="sm" className="font-semibold">
              <Link href="/products">Shop now</Link>
            </Button>
            {session?.user ? (
              <Button asChild variant="outline" size="sm" className="font-semibold">
                <Link href="/account">
                  Welcome back: {session.user.firstName || session.user.email}
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm" className="font-semibold">
                <Link href="/login">Become a Customer</Link>
              </Button>
            )}
          </div>
          <div className="md:hidden flex items-center gap-1.5">
            <QuoteListIcon />
            <button onClick={toggleMenu} aria-label="Toggle menu" className="min-w-11 min-h-11 flex flex-col justify-center items-center gap-1 p-2">
              <span className={cn("block w-5 h-0.5 bg-foreground transition-transform duration-300 ease-in-out", isMenuOpen ? "rotate-45 translate-y-[3px]" : "")}></span>
              <span className={cn("block w-5 h-0.5 bg-foreground transition-opacity duration-300 ease-in-out", isMenuOpen ? "opacity-0" : "")}></span>
              <span className={cn("block w-5 h-0.5 bg-foreground transition-transform duration-300 ease-in-out", isMenuOpen ? "-rotate-45 -translate-y-[3px]" : "")}></span>
            </button>
          </div>
        </div>
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetContent side="left" className="flex flex-col w-[85vw] max-w-sm p-0 md:hidden">
            <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
            <div className="flex-shrink-0 px-4 py-4 border-b border-slate-200">
              <div className="flex justify-between items-center">
                <Logo className="w-28" />
                <button onClick={toggleMenu} aria-label="Close menu" className="min-w-11 min-h-11 flex justify-center items-center p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="flex-shrink-0 px-4 py-3 border-b border-slate-200">
              <SearchBar />
            </div>
            <nav className="overflow-y-auto flex-1 px-4 py-4">
              <div className="flex flex-col space-y-1">
                {navLinks.map((link) => (
                  <React.Fragment key={link.label}>
                    {(link.dropdown || link.subMenus) ? (
                      <div className="flex flex-col space-y-0">
                        <button onClick={() => toggleExpandMenu(link.label)} className="flex items-center justify-between w-full rounded-md min-h-11 px-4 py-3 text-base font-bold text-muted-foreground hover:bg-slate-100 hover:text-foreground transition-colors">
                          <span>{link.label}</span>
                          <ChevronDown className={cn("w-5 h-5 transition-transform duration-300", expandedMenus.includes(link.label) ? "rotate-180" : "")} />
                        </button>
                        {expandedMenus.includes(link.label) && (
                          <div className="flex flex-col space-y-0 bg-slate-50 rounded-lg mt-1 ml-2 overflow-hidden border border-slate-200">
                            {link.subMenus ? (
                              <>
                                {link.subMenus.map((subMenu) => (
                                  <div key={subMenu.label} className="flex flex-col space-y-0">
                                    <div className="px-4 py-3 text-sm font-semibold text-muted-foreground bg-slate-100">
                                      {subMenu.label}
                                    </div>
                                    {subMenu.items.map((item) => (
                                      <Link key={item.title} href={item.href} onClick={toggleMenu} className="w-full px-4 py-2.5 text-sm text-muted-foreground hover:bg-slate-200 hover:text-foreground transition-colors flex items-center">
                                        {item.title}
                                      </Link>
                                    ))}
                                    {subMenu.allLink && (
                                      <>
                                        <div className="h-px bg-slate-200" />
                                        <Link href={subMenu.allLink.href} onClick={toggleMenu} className="w-full px-4 py-2.5 text-sm font-semibold text-primary hover:bg-slate-200 transition-colors flex items-center">
                                          {subMenu.allLink.title}
                                        </Link>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </>
                            ) : link.dropdown ? (
                              link.dropdown.map((item) => (
                                <button key={item.title} onClick={() => { scrollToSection(item.href); toggleMenu(); }} className="w-full px-4 py-2.5 text-sm text-muted-foreground hover:bg-slate-200 hover:text-foreground transition-colors flex items-center text-left">
                                  {item.title}
                                </button>
                              ))
                            ) : null}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link href={link.href} onClick={toggleMenu} className="block w-full rounded-md min-h-11 px-4 py-3 text-base font-bold text-muted-foreground hover:bg-slate-100 hover:text-foreground transition-colors flex items-center">
                        {link.label}
                      </Link>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </nav>
            <div className="flex-shrink-0 space-y-3 border-t border-slate-200 p-4 bg-slate-50">
              <Button asChild size="lg" className="w-full">
                <Link href="/products" onClick={toggleMenu}>
                  Shop now
                </Link>
              </Button>
              {session?.user ? (
                <Button asChild variant="outline" size="lg" className="w-full">
                  <Link href="/account" onClick={toggleMenu}>
                    Welcome back: {session.user.firstName || session.user.email}
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="outline" size="lg" className="w-full">
                  <Link href="/login" onClick={toggleMenu}>
                    Become a Customer
                  </Link>
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </header>
      <QuoteDrawer />
    </>
  );
}
