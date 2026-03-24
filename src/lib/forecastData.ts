export type ForecastHorizon = "6 Months" | "1–2 Years" | "3–5 Years";
export type ForecastDomain = "Fashion" | "Beauty" | "Luxury" | "Art & Design" | "Culture" | "Digital" | "Commerce" | "Entertainment" | "Lifestyle";
export type ForecastSignalStrength = "Definitive" | "High Confidence" | "Early Signal";

export interface CulturalForecast {
  id: string;
  title: string;
  projection: string;
  evidence: string;
  implications: string;
  domain: ForecastDomain;
  horizon: ForecastHorizon;
  signalStrength: ForecastSignalStrength;
  region: "Africa" | "Diaspora" | "Global";
  publishedDate: string;
}

export const forecasts: CulturalForecast[] = [
  {
    id: "f1",
    title: "The Sovereignty Economy",
    projection:
      "African luxury houses will bypass traditional wholesale entirely, building vertically integrated empires where provenance, narrative, and distribution remain under creator control. The wholesale intermediary becomes obsolete for premium African brands within eighteen months.",
    evidence:
      "Direct-to-consumer revenue among leading Lagos and Accra-based labels has increased 340% year-over-year. Three major houses have already terminated department store agreements in favour of owned retail and curated digital experiences.",
    implications:
      "Legacy European retailers will scramble for consignment partnerships. The cultural capital of 'where you buy' will matter as much as 'what you buy.' African-owned flagships in global capitals become inevitabilities.",
    domain: "Commerce",
    horizon: "6 Months",
    signalStrength: "Definitive",
    region: "Africa",
    publishedDate: "2026-02-10",
  },
  {
    id: "f2",
    title: "Algorithmic Ancestry",
    projection:
      "AI-driven genealogical textiles — garments whose patterns are generated from the wearer's heritage data — will emerge as the defining luxury proposition of the next decade. Cloth becomes autobiography.",
    evidence:
      "Three Nairobi-based tech-fashion studios have filed patents for heritage-encoded textile algorithms. Early prototypes were presented at private showings during Dakar Fashion Week to unanimous critical praise. Demand from Diaspora collectors has already exceeded production capacity.",
    implications:
      "The concept of 'personalisation' in luxury shifts from monogramming to molecular identity. Fast fashion cannot replicate what is genetically unique. This creates an unassailable moat for artisan-tech hybrid houses.",
    domain: "Fashion",
    horizon: "1–2 Years",
    signalStrength: "High Confidence",
    region: "Global",
  publishedDate: "2026-02-09",
  },
  {
    id: "f3",
    title: "The Shea Belt Renaissance",
    projection:
      "West Africa's shea-producing corridor will be rebranded as a luxury beauty terroir — akin to Champagne or Burgundy — commanding origin-premium pricing and reshaping the $13 billion global skincare market.",
    evidence:
      "Ghana and Burkina Faso cooperatives have registered geographic indication applications. Two Parisian fragrance houses have signed exclusivity agreements for single-origin shea. Social media engagement around 'beauty terroir' content has grown 780% in twelve months.",
    implications:
      "Commodity pricing collapses for premium-grade shea as terroir narrative takes hold. West African women's cooperatives gain unprecedented bargaining power. The beauty industry's supply chain ethics face overdue scrutiny.",
    domain: "Beauty",
    horizon: "1–2 Years",
    signalStrength: "High Confidence",
    region: "Africa",
    publishedDate: "2026-02-08",
  },
  {
    id: "f4",
    title: "Digital Griots",
    projection:
      "A generation of African creators will establish a new content archetype — the Digital Griot — merging oral storytelling traditions with immersive media to build cultural platforms that rival Western social networks in engagement depth.",
    evidence:
      "Audio-first platforms originating in Lagos and Nairobi are reporting average session durations three times longer than global competitors. Venture capital into African creator-economy infrastructure exceeded $400 million in Q4 2025. The narrative-podcast hybrid format pioneered by Ghanaian creators is now being licensed by European media groups.",
    implications:
      "Attention economics shifts from volume to depth. Western platforms must acquire or partner with African narrative technologists. The 'creator economy' redefines itself around cultural custodianship rather than influencer metrics.",
    domain: "Digital",
    horizon: "6 Months",
    signalStrength: "Definitive",
    region: "Diaspora",
    publishedDate: "2026-02-10",
  },
  {
    id: "f5",
    title: "Quiet Power Dressing",
    projection:
      "The global appetite for stealth wealth will undergo an African reinterpretation — one that privileges handcraft legibility over logo absence. Knowing the weave, not the brand, becomes the ultimate signifier of cultural literacy.",
    evidence:
      "Sales of hand-loomed aso-oke in neutral palettes have increased 200% among Diaspora professionals aged 28–45. Savile Row tailors report growing client demand for West African textile integration. The phrase 'craft-coded' has entered fashion editorial vocabulary across four major publications.",
    implications:
      "The stealth-wealth conversation broadens beyond minimalism to include material intelligence. African artisanal textiles gain a secondary market akin to vintage couture. Fashion education curricula must expand to include African textile literacy.",
    domain: "Luxury",
    horizon: "6 Months",
    signalStrength: "Definitive",
    region: "Global",
    publishedDate: "2026-02-07",
  },
  {
    id: "f6",
    title: "The Continental Aesthetic Union",
    projection:
      "By 2029, a Pan-African design language — neither Western-derivative nor nostalgically traditional — will crystallise into a coherent aesthetic movement with its own critical vocabulary, institutional infrastructure, and global collector base.",
    evidence:
      "Cross-border design residencies between Johannesburg, Lagos, Nairobi, and Casablanca have tripled since 2024. The first Pan-African Design Biennial is confirmed for Kigali in 2027. International auction houses report a 460% increase in contemporary African design lots.",
    implications:
      "The global design canon undergoes its most significant expansion since the Bauhaus. African design schools become destination institutions. The power to define 'good design' is permanently redistributed.",
    domain: "Art & Design",
    horizon: "3–5 Years",
    signalStrength: "High Confidence",
    region: "Africa",
    publishedDate: "2026-02-06",
  },
  {
    id: "f7",
    title: "The Nollywood Wardrobe Effect",
    projection:
      "Nollywood's influence on global fashion will surpass Bollywood's within three years, as streaming platforms accelerate the visibility of Nigerian costume design and audiences demand the silhouettes they see on screen.",
    evidence:
      "Costume-search queries linked to Nigerian streaming content have increased 520% on global fashion platforms. Three Nollywood costume designers have been signed by international fashion houses as creative consultants. Netflix's most-watched African originals consistently generate measurable fashion-search spikes within 48 hours of release.",
    implications:
      "Screen-to-wardrobe pipelines become standard for Nigerian productions. Lagos emerges as a costume-design capital rivalling Los Angeles. The global understanding of 'screen style' expands permanently beyond Western reference points.",
    domain: "Culture",
    horizon: "1–2 Years",
    signalStrength: "High Confidence",
    region: "Global",
    publishedDate: "2026-02-09",
  },
  {
    id: "f8",
    title: "Gen-Z Heritage Maximalism",
    projection:
      "Young Africans and Diaspora creatives will reject the minimalism of their predecessors in favour of a disciplined maximalism — layered, referential, and unapologetically rooted in specific cultural geographies.",
    evidence:
      "The hashtag #HeritageMaximalism has accumulated 2.1 billion views across platforms. Emerging designers under 25 in Lagos, London, and Brooklyn are showing collections with 40% more textile variety per look than the industry average. Youth-oriented African fashion media consistently outperforms minimalist content in engagement metrics.",
    implications:
      "The minimalism-maximalism binary collapses. 'More' is redefined as 'more meaningful' rather than 'more excessive.' The fashion industry must develop new critical frameworks for evaluating density of cultural reference.",
    domain: "Fashion",
    horizon: "6 Months",
    signalStrength: "Definitive",
    region: "Diaspora",
    publishedDate: "2026-02-10",
  },
];

export const forecastDomains: ForecastDomain[] = [
  "Fashion",
  "Beauty",
  "Luxury",
  "Art & Design",
  "Culture",
  "Entertainment",
  "Lifestyle",
  "Digital",
  "Commerce",
];

export const forecastHorizons: ForecastHorizon[] = [
  "6 Months",
  "1–2 Years",
  "3–5 Years",
];

export const signalStrengths: ForecastSignalStrength[] = [
  "Definitive",
  "High Confidence",
  "Early Signal",
];
