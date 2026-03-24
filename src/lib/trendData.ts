export type Category = "Fashion" | "Beauty" | "Luxury" | "Art & Design" | "Culture" | "Business" | "Entertainment" | "Lifestyle";
export type Urgency = "Breaking" | "Emerging" | "Slow-Burn";
export type GeoRelevance = "Africa" | "Diaspora" | "Global";
export type ContentTier = "Daily Brief" | "Editorial Feature" | "Premium Long-Form" | "Cultural Forecast" | "Story Mode";

export interface Trend {
  id: string;
  headline: string;
  culturalSignificance: string;
  geoRelevance: GeoRelevance;
  urgency: Urgency;
  category: Category;
  contentTier: ContentTier;
  timestamp: string;
  imageHint?: string;
}

export const trends: Trend[] = [
  {
    id: "1",
    headline: "Lagos Fashion Week Heralds the Dawn of Pan-African Haute Couture",
    culturalSignificance: "A quiet revolution is unfolding on the runways of Lagos, where a generation of visionary designers is weaving ancestral textile traditions into silhouettes that command international reverence. This is not imitation — it is invention. Lagos now stands shoulder to shoulder with Paris and Milan, not as a challenger but as an equal, rewriting the very grammar of global luxury.",
    geoRelevance: "Africa",
    urgency: "Breaking",
    category: "Fashion",
    contentTier: "Editorial Feature",
    timestamp: "2026-02-10",
  },
  {
    id: "2",
    headline: "The Melanin-First Movement Reshaping the Architecture of Beauty",
    culturalSignificance: "Across the Diaspora, Black founders are engineering beauty technologies that centre darker skin tones not as an afterthought but as the origin point. These AI-powered shade-matching tools represent something far more profound than product innovation — they are an act of cultural correction, dismantling decades of exclusion and establishing a new standard of beauty intelligence.",
    geoRelevance: "Diaspora",
    urgency: "Emerging",
    category: "Beauty",
    contentTier: "Cultural Forecast",
    timestamp: "2026-02-09",
  },
  {
    id: "3",
    headline: "Accra's Ascent: The Making of the World's Next Great Cultural Capital",
    culturalSignificance: "In the galleries, residencies, and maker spaces of Accra, a distinctly Ghanaian artistic consciousness is taking form — one that captivates international collectors while refusing the extractive dynamics that have long defined African art markets. This is not a trend; it is a homecoming, a reclamation of narrative sovereignty that positions Accra at the centre of the global creative conversation.",
    geoRelevance: "Global",
    urgency: "Slow-Burn",
    category: "Art & Design",
    contentTier: "Premium Long-Form",
    timestamp: "2026-02-08",
  },
  {
    id: "4",
    headline: "Afrobeats Couture: The Two-Billion-Dollar Symphony of Sound and Style",
    culturalSignificance: "The alliance between Afrobeats and African fashion has birthed an entirely new creative economy — one measured in billions and defined by an aesthetic language that belongs to no other culture. Custom stage wardrobes, artist-led labels, and music video fashion have forged a paradigm where melody and silhouette are inseparable, reshaping celebrity culture on a global stage.",
    geoRelevance: "Global",
    urgency: "Breaking",
    category: "Culture",
    contentTier: "Story Mode",
    timestamp: "2026-02-10",
  },
  {
    id: "5",
    headline: "Saharan Minimalism: Quiet Luxury Finds Its Truest Expression",
    culturalSignificance: "The global appetite for understated elegance has discovered its most authentic voice in the earth-toned palettes and handcrafted leather goods of North African and Sahelian artisans. Here, quiet luxury is not a borrowed concept — it is indigenous, born of desert light and centuries of refined craftsmanship. The world is finally paying attention to what the Sahara has always known about restraint and beauty.",
    geoRelevance: "Africa",
    urgency: "Emerging",
    category: "Luxury",
    contentTier: "Editorial Feature",
    timestamp: "2026-02-07",
  },
  {
    id: "6",
    headline: "A New Order in Retail: Black-Owned Houses Build Empires on Their Own Terms",
    culturalSignificance: "Bypassing the gatekeepers of traditional wholesale, a new generation of Black-owned fashion houses is constructing direct-to-consumer empires rooted in community, conviction, and cultural intimacy. Their success is not merely commercial — it is philosophical, compelling legacy retailers to confront the hollow gestures of tokenistic inclusion and reckon with the future of fashion commerce.",
    geoRelevance: "Diaspora",
    urgency: "Slow-Burn",
    category: "Business",
    contentTier: "Premium Long-Form",
    timestamp: "2026-02-06",
  },
  {
    id: "7",
    headline: "The Braiding Renaissance: When Heritage Becomes High Art",
    culturalSignificance: "Traditional African braiding techniques are experiencing a magnificent reclamation — ascending from cultural practice to runway centrepiece with the authority of centuries behind them. This renaissance challenges the enduring dominance of Eurocentric beauty standards and affirms what Black communities have always understood: that hair artistry is a legitimate, extraordinary form of design.",
    geoRelevance: "Global",
    urgency: "Emerging",
    category: "Beauty",
    contentTier: "Daily Brief",
    timestamp: "2026-02-09",
  },
  {
    id: "8",
    headline: "Johannesburg's Creative Renaissance Draws the World's Capital and Confidence",
    culturalSignificance: "International investment is flowing into Johannesburg's creative sector with a conviction that signals something beyond opportunity — it signals belief. From fashion technology ventures to digital art platforms, the city's creative infrastructure is maturing into a robust ecosystem that rivals established global hubs, affirming South Africa's place at the forefront of the world's cultural economy.",
    geoRelevance: "Africa",
    urgency: "Breaking",
    category: "Business",
    contentTier: "Daily Brief",
    timestamp: "2026-02-10",
  },
  {
    id: "9",
    headline: "The Invisible Loom: How African Textile Philosophy Is Quietly Rewriting Global Fashion's Soul",
    culturalSignificance: "Beneath the surface spectacle of seasonal collections and viral runway moments lies a tectonic shift that few in the Western fashion establishment have fully reckoned with. African textile philosophy — the understanding that cloth carries memory, that weave encodes identity, that pattern is a form of language — is migrating from the margins of 'inspiration' to the structural centre of how the world's most consequential designers think about garment-making. This is not appropriation dressed in reverence. This is absorption, the kind that reshapes an industry's intellectual foundations without asking permission. From the aso-oke revival in Lagos to the kente reinterpretation studios of Kumasi, from the indigo vats of Kano to the bogolan cooperatives of Bamako, a generation of makers is insisting that their craft traditions are not source material for others — they are complete aesthetic systems, self-sufficient and sovereign. The implications extend far beyond fashion. When a Parisian atelier studies the mathematics of Yoruba adire resist-dyeing to inform its approach to surface design, when a Milanese house restructures its supply chain to partner directly with Ghanaian weavers rather than merely photographing their work, the power geometry of global luxury shifts in ways that cannot be reversed. We are witnessing the early chapters of a story that will take decades to fully unfold — one in which the philosophical traditions of African making become inseparable from the future vocabulary of global design.",
    geoRelevance: "Global",
    urgency: "Slow-Burn",
    category: "Fashion",
    contentTier: "Premium Long-Form",
    timestamp: "2026-02-10",
    imageHint: "african textile weaving",
  },
];

export const categories: Category[] = ["Fashion", "Beauty", "Luxury", "Art & Design", "Culture", "Business"];
export const urgencyLevels: Urgency[] = ["Breaking", "Emerging", "Slow-Burn"];
export const geoOptions: GeoRelevance[] = ["Africa", "Diaspora", "Global"];
export const contentTiers: ContentTier[] = ["Daily Brief", "Editorial Feature", "Premium Long-Form", "Cultural Forecast", "Story Mode"];
