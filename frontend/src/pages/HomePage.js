import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Shield, RefreshCw, Award, Truck, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 4000 })]);
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setFeaturedProducts(response.data.slice(0, 6)); // Get first 6 products
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
  const scrollNext = () => emblaApi && emblaApi.scrollNext();
  const collections = [
    {
      name: "Gold Collection",
      image: "https://images.unsplash.com/photo-1728646995777-6dbb354691e3",
      link: "/products?subcategory=gold",
    },
    {
      name: "Diamond Collection",
      image: "https://images.unsplash.com/photo-1696774665695-2f237304c3b0",
      link: "/products?subcategory=diamond",
    },
    {
      name: "Silver Collection",
      image: "https://images.unsplash.com/photo-1583791030450-950c8e4a2a8e",
      link: "/products?subcategory=silver",
    },
  ];

  const trustFeatures = [
    {
      icon: Shield,
      title: "Certified Jewellery",
      description: "100% Hallmark certified gold and diamonds",
    },
    {
      icon: RefreshCw,
      title: "Lifetime Exchange",
      description: "Exchange your old jewellery anytime",
    },
    {
      icon: Award,
      title: "Best Quality",
      description: "Premium craftsmanship & purity guaranteed",
    },
    {
      icon: Truck,
      title: "Secure Delivery",
      description: "Insured shipping to your doorstep",
    },
  ];

  return (
    <div className="bg-white" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1522001947148-8b4dfe064edc"
          alt="Luxury Jewellery"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center">
          <div className="max-w-2xl space-y-4 md:space-y-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif tracking-tight text-white font-medium leading-tight" data-testid="hero-title">
              Timeless Elegance
              <br />
              <span className="text-[#D4AF37]">Crafted for You</span>
            </h1>
            <p className="text-sm md:text-base lg:text-lg font-sans leading-relaxed text-white/90">
              Discover our exclusive collection of handcrafted jewellery, where tradition meets luxury.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4">
              <Link to="/products">
                <Button
                  className="w-full sm:w-auto bg-[#D4AF37] text-white hover:bg-[#C5A059] rounded-full px-6 md:px-8 py-5 md:py-6 transition-all duration-300 shadow-md hover:shadow-lg uppercase tracking-widest text-xs font-bold"
                  data-testid="explore-collection-button"
                >
                  Explore Collection
                </Button>
              </Link>
              <Link to="/sell">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto bg-transparent border-2 border-white text-white hover:bg-white hover:text-[#1A1A1A] rounded-full px-6 md:px-8 py-5 md:py-6 transition-all duration-300 uppercase tracking-widest text-xs font-bold"
                  data-testid="sell-jewellery-button"
                >
                  Sell Your Jewellery
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 md:py-16 lg:py-24 bg-[#F9F9F7]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {trustFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 md:p-8 rounded-sm text-center hover:shadow-lg transition-all duration-300"
                data-testid={`trust-feature-${index}`}
              >
                <feature.icon className="h-8 w-8 md:h-10 md:w-10 text-[#D4AF37] mx-auto mb-3 md:mb-4" strokeWidth={1.5} />
                <h3 className="text-lg md:text-xl font-serif text-[#1A1A1A] mb-2">{feature.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Collections Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-sans tracking-wide uppercase text-muted-foreground mb-2">Explore</p>
            <h2 className="text-4xl md:text-5xl font-serif tracking-tight text-[#1A1A1A]" data-testid="collections-title">
              Our Collections
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {collections.map((collection, index) => (
              <Link
                key={index}
                to={collection.link}
                className="group relative overflow-hidden rounded-sm h-[350px] md:h-[400px] shadow-md hover:shadow-xl transition-all duration-300"
                data-testid={`collection-${index}`}
              >\n                <img
                  src={collection.image}
                  alt={collection.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl font-serif text-white mb-2">{collection.name}</h3>
                  <span className="text-[#D4AF37] text-sm uppercase tracking-widest font-bold group-hover:underline">
                    Explore Now →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Carousel */}
      {featuredProducts.length > 0 && (
        <section className="py-16 md:py-24 bg-[#F9F9F7]">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <p className="text-sm font-sans tracking-wide uppercase text-muted-foreground mb-2">Featured</p>
              <h2 className="text-4xl md:text-5xl font-serif tracking-tight text-[#1A1A1A]">
                Handpicked for You
              </h2>
            </div>

            <div className="relative">
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex">
                  {featuredProducts.map((product) => (
                    <div key={product.id} className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] lg:flex-[0_0_33.333%] px-3">
                      <Link to={`/products/${product.id}`} className="block">
                        <div className="bg-white rounded-sm overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                          <div className="relative overflow-hidden">
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-64 md:h-80 object-cover hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                          <div className="p-4 md:p-6">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                              {product.subcategory} • {product.category}
                            </p>
                            <h3 className="text-lg md:text-xl font-serif text-[#1A1A1A] mb-3 line-clamp-2">
                              {product.name}
                            </h3>
                            <div className="flex items-center justify-between">
                              <span className="text-xl md:text-2xl font-bold text-[#D4AF37]">
                                ₹{product.total_price.toLocaleString()}
                              </span>
                              <span className="text-xs text-muted-foreground">{product.purity}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Buttons */}
              <button
                onClick={scrollPrev}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white/90 backdrop-blur-sm hover:bg-[#D4AF37] text-[#1A1A1A] hover:text-white p-3 rounded-full shadow-lg transition-all duration-300 z-10"
                data-testid="carousel-prev"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={scrollNext}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white/90 backdrop-blur-sm hover:bg-[#D4AF37] text-[#1A1A1A] hover:text-white p-3 rounded-full shadow-lg transition-all duration-300 z-10"
                data-testid="carousel-next"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-12 md:py-16 lg:py-24 bg-[#F9F9F7]">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif tracking-tight text-[#1A1A1A] mb-4 md:mb-6" data-testid="cta-title">
            Have Old Jewellery?
          </h2>
          <p className="text-sm md:text-base lg:text-lg text-muted-foreground mb-6 md:mb-8">
            Get the best value for your precious jewellery. Our experts provide fair and transparent valuations.
          </p>
          <Link to="/sell">
            <Button
              className="bg-[#D4AF37] text-white hover:bg-[#C5A059] rounded-full px-6 md:px-8 py-5 md:py-6 transition-all duration-300 shadow-md hover:shadow-lg uppercase tracking-widest text-xs font-bold"
              data-testid="sell-now-button"
            >
              Sell Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;