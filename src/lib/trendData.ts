export type Category = "Fashion" | "Beauty" | "Luxury" | "Art & Design" | "Culture" | "Business";
export type Urgency = "Breaking" | "Emerging" | "Slow-Burn";
export type GeoRelevance = "Africa" | "Diaspora" | "Global";

export interface Trend {
  id: string;
  headline: string;
  culturalSignificance: string;
  geoRelevance: GeoRelevance;
  urgency: Urgency;
  category: Category;
  timestamp: string;
  imageHint?: string;
}

export const trends: Trend[] = [
  {
    id: "1",
    headline: "Lagos Fashion Week Signals a New Era of Pan-African Luxury",
    culturalSignificance: "Nigerian designers are redefining luxury on their own terms, blending traditional weaving techniques with contemporary silhouettes. This shift positions Lagos as a serious contender alongside Paris and Milan, challenging Eurocentric fashion hierarchies.",
    geoRelevance: "Africa",
    urgency: "Breaking",
    category: "Fashion",
    timestamp: "2026-02-10",
  },
  {
    id: "2",
    headline: "The Rise of Melanin-First Beauty Tech Across the Diaspora",
    culturalSignificance: "AI-powered shade-matching tools built by Black founders are finally solving the persistent problem of inclusive beauty. These technologies center darker skin tones as the default, not an afterthought, reshaping how the global beauty industry approaches product development.",
    geoRelevance: "Diaspora",
    urgency: "Emerging",
    category: "Beauty",
    timestamp: "2026-02-09",
  },
  {
    id: "3",
    headline: "Accra's Art District Is Becoming the World's Next Cultural Capital",
    culturalSignificance: "A constellation of galleries, residencies, and maker spaces in Accra is drawing international collectors and curators. The movement champions a distinctly Ghanaian artistic voice while rejecting the extractive dynamics that have historically defined African art markets.",
    geoRelevance: "Global",
    urgency: "Slow-Burn",
    category: "Art & Design",
    timestamp: "2026-02-08",
  },
  {
    id: "4",
    headline: "Afrobeats Couture: How Music Is Driving a $2B Fashion Economy",
    culturalSignificance: "The symbiosis between Afrobeats artists and African designers has created an entirely new fashion economy. Custom stage looks, music video wardrobes, and artist-led brands are generating billions and establishing new celebrity-fashion paradigms globally.",
    geoRelevance: "Global",
    urgency: "Breaking",
    category: "Culture",
    timestamp: "2026-02-10",
  },
  {
    id: "5",
    headline: "Quiet Luxury Gets a Saharan Makeover: Earth Tones Dominate SS26",
    culturalSignificance: "The global quiet luxury trend is being reinterpreted through an African lens — desert-inspired palettes, handcrafted leather goods, and understated elegance rooted in North African and Sahelian aesthetics are commanding attention at international showrooms.",
    geoRelevance: "Africa",
    urgency: "Emerging",
    category: "Luxury",
    timestamp: "2026-02-07",
  },
  {
    id: "6",
    headline: "Black-Owned Fashion Houses Are Rewriting the Rules of Retail",
    culturalSignificance: "A new generation of Black-owned labels are bypassing traditional wholesale models entirely, building direct-to-consumer empires with community-first strategies. Their success is forcing legacy retailers to rethink diversity beyond tokenistic capsule collections.",
    geoRelevance: "Diaspora",
    urgency: "Slow-Burn",
    category: "Business",
    timestamp: "2026-02-06",
  },
  {
    id: "7",
    headline: "The Braiding Renaissance: Heritage Hair as High Fashion Statement",
    culturalSignificance: "Traditional African braiding techniques are experiencing a global renaissance, moving from cultural practice to runway centerpiece. This reclamation challenges decades of Eurocentric beauty standards and positions Black hair artistry as a legitimate form of design.",
    geoRelevance: "Global",
    urgency: "Emerging",
    category: "Beauty",
    timestamp: "2026-02-09",
  },
  {
    id: "8",
    headline: "Johannesburg's Creative Economy Boom Attracts Global Investment",
    culturalSignificance: "International venture capital is flowing into Johannesburg's creative sector at unprecedented rates. From fashion tech startups to digital art platforms, the city's creative infrastructure is maturing into a robust ecosystem that rivals established global hubs.",
    geoRelevance: "Africa",
    urgency: "Breaking",
    category: "Business",
    timestamp: "2026-02-10",
  },
];

export const categories: Category[] = ["Fashion", "Beauty", "Luxury", "Art & Design", "Culture", "Business"];
export const urgencyLevels: Urgency[] = ["Breaking", "Emerging", "Slow-Burn"];
export const geoOptions: GeoRelevance[] = ["Africa", "Diaspora", "Global"];
