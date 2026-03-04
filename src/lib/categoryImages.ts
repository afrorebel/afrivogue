import fashionImg from "@/assets/category-fashion.jpg";
import beautyImg from "@/assets/category-beauty.jpg";
import luxuryImg from "@/assets/category-luxury.jpg";
import artImg from "@/assets/category-art.jpg";
import cultureImg from "@/assets/category-culture.jpg";
import businessImg from "@/assets/category-business.jpg";

const categoryImages: Record<string, string> = {
  Fashion: fashionImg,
  Beauty: beautyImg,
  Luxury: luxuryImg,
  "Art & Design": artImg,
  Culture: cultureImg,
  Business: businessImg,
};

export function getCategoryImage(category: string): string {
  return categoryImages[category] || fashionImg;
}
