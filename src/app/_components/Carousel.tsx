"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useI18n } from "../i18n";

interface CarouselSlide {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  buttonText1: string;
  buttonLink1: string;
  buttonText2?: string;
  buttonLink2?: string;
}

export default function Carousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { t } = useI18n();

  const slides: CarouselSlide[] = [
    {
      title: t("carousel_title_1"),
      subtitle: t("carousel_subtitle_1"),
      description: t("carousel_desc_1"),
      image: "/images/business-slide1.jpg",
      buttonText1: t("carousel_btn1_1"),
      buttonLink1: "/about",
      buttonText2: t("carousel_btn2_1"),
      buttonLink2: "/quote",
    },
    {
      title: t("carousel_title_2"),
      subtitle: t("carousel_subtitle_2"),
      description: t("carousel_desc_2"),
      image: "/images/business-slide2.jpg",
      buttonText1: t("carousel_btn1_2"),
      buttonLink1: "/services",
      buttonText2: t("carousel_btn2_2"),
      buttonLink2: "/contact",
    },
    {
      title: t("carousel_title_3"),
      subtitle: t("carousel_subtitle_3"),
      description: t("carousel_desc_3"),
      image: "/images/business-slide3.jpg",
      buttonText1: t("carousel_btn1_3"),
      buttonLink1: "/services",
      buttonText2: t("carousel_btn2_3"),
      buttonLink2: "/contact",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 3000); // Change slide every 3 seconds
    return () => clearInterval(interval);
  }, [slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  const goToSlide = (index: number) => setCurrentSlide(index);

  return (
    <div className="relative w-full h-[600px] overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute top-0 left-0 w-full h-full transition-opacity duration-1000 ${
            currentSlide === index ? "opacity-100 z-10" : "opacity-0 pointer-events-none"
          }`}
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            style={{ objectFit: "cover", objectPosition: "center" }}
            priority={index === 0}
          />
          <div className="absolute inset-0 bg-black/60 z-10" />
          <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-4">
            <h3 className="text-lg md:text-xl font-bold text-white mb-2 tracking-wide uppercase">{slide.title}</h3>
            <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight drop-shadow-lg">
              {slide.subtitle}
            </h2>
            <p className="text-white text-lg md:text-2xl max-w-2xl mb-8 drop-shadow-lg">
              {slide.description}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href={slide.buttonLink1} className="bg-[#B47B3A] hover:bg-[#a06b2e] text-white font-semibold py-3 px-8 rounded transition duration-300">
                {slide.buttonText1}
              </Link>
              {slide.buttonText2 && slide.buttonLink2 && (
                <Link href={slide.buttonLink2} className="bg-white hover:bg-gray-100 text-[#B47B3A] font-semibold py-3 px-8 rounded border border-white transition duration-300">
                  {slide.buttonText2}
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}
      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute bottom-8 left-[40%] z-30 bg-black/40 hover:bg-black/70 text-white p-2 rounded transition duration-300 border border-white"
        aria-label="Previous slide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className="absolute bottom-8 right-[40%] z-30 bg-black/40 hover:bg-black/70 text-white p-2 rounded transition duration-300 border border-white"
        aria-label="Next slide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {/* Indicators/Dots */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full border border-white transition-all duration-300 ${
              currentSlide === index ? "bg-[#B47B3A]" : "bg-white/70 hover:bg-[#B47B3A]/80"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          ></button>
        ))}
      </div>
    </div>
  );
}