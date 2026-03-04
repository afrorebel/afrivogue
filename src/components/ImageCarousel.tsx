import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageCarouselProps {
  images: string[];
  alt?: string;
}

const ImageCarousel = ({ images, alt = "Article image" }: ImageCarouselProps) => {
  const [[current, direction], setCurrent] = useState([0, 0]);

  if (!images || images.length === 0) return null;

  const paginate = (dir: number) => {
    setCurrent(([prev]) => {
      const next = (prev + dir + images.length) % images.length;
      return [next, dir];
    });
  };

  if (images.length === 1) {
    return (
      <div className="my-8 overflow-hidden rounded-lg">
        <img src={images[0]} alt={alt} className="h-auto w-full object-cover" loading="lazy" />
      </div>
    );
  }

  return (
    <div className="group relative my-8 overflow-hidden rounded-lg bg-card">
      <div className="relative aspect-[16/9]">
        <AnimatePresence custom={direction} mode="wait">
          <motion.img
            key={current}
            src={images[current]}
            alt={`${alt} ${current + 1}`}
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
            transition={{ duration: 0.3 }}
            loading="lazy"
          />
        </AnimatePresence>
      </div>

      {/* Controls */}
      <button
        onClick={() => paginate(-1)}
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/70 p-2 text-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-background"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={() => paginate(1)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/70 p-2 text-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-background"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent([i, i > current ? 1 : -1])}
            className={`h-1.5 rounded-full transition-all ${
              i === current ? "w-4 bg-gold" : "w-1.5 bg-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel;
