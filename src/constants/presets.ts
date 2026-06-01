import type { ImageSourcePropType } from 'react-native';

export type PresetOption = {
  id: string;
  label: string;
  blurb: string;
  iconName: string;
  selectedBackground: string;
  selectedDark: boolean;
  promptFragment: string;
};

export type PresetOptionItem = {
  key: string;
  label: string;
};

export const NICHES: PresetOption[] = [
  {
    id: 'fashion',
    label: 'Fashion',
    blurb: 'Apparel, streetwear, designer',
    iconName: 'shopping-bag',
    selectedBackground: '#261E1A',
    selectedDark: true,
    promptFragment:
      'Category: fashion / apparel. Editorial lookbook feel, confident silhouette, textured fabric detail.',
  },
  {
    id: 'beauty',
    label: 'Beauty',
    blurb: 'Cosmetics, skincare, fragrance',
    iconName: 'star',
    selectedBackground: '#F5E6E8',
    selectedDark: false,
    promptFragment:
      'Category: beauty / skincare. Soft glow, hero product, clean surfaces, subtle ingredient cues.',
  },
  {
    id: 'food',
    label: 'Food & Drink',
    blurb: 'Packaged, RTD, CPG',
    iconName: 'coffee',
    selectedBackground: '#F5EBD8',
    selectedDark: false,
    promptFragment:
      'Category: food & beverage. Appetizing styling, natural props, fresh set, mouth-watering hero.',
  },
  {
    id: 'tech',
    label: 'Tech',
    blurb: 'Hardware, accessories, devices',
    iconName: 'smartphone',
    selectedBackground: '#1E2430',
    selectedDark: true,
    promptFragment:
      'Category: tech / gadgets. Precise studio lighting, crisp reflections, modern prop ecosystem.',
  },
  {
    id: 'home',
    label: 'Home',
    blurb: 'Furniture, decor, kitchen',
    iconName: 'home',
    selectedBackground: '#EDE4D8',
    selectedDark: false,
    promptFragment:
      'Category: home & living. Lived-in interior, natural daylight, warm timber and textiles.',
  },
  {
    id: 'fitness',
    label: 'Fitness',
    blurb: 'Activewear, supplements, gear',
    iconName: 'activity',
    selectedBackground: '#E5F2EB',
    selectedDark: false,
    promptFragment:
      'Category: fitness / wellness. Energetic but clean, athletic context, crisp daylight.',
  },
  {
    id: 'accessories',
    label: 'Accessories',
    blurb: 'Bags, watches, jewelry',
    iconName: 'gift',
    selectedBackground: '#F3E8E4',
    selectedDark: false,
    promptFragment:
      'Category: accessories / jewelry. Macro detail, luxe surfaces, controlled rim light.',
  },
  {
    id: 'services',
    label: 'Services',
    blurb: 'Apps, SaaS, digital',
    iconName: 'cloud',
    selectedBackground: '#2A2520',
    selectedDark: true,
    promptFragment:
      'Category: digital product. Typographic composition, modern color block, confident poster feel.',
  },
];

export const VIBES: PresetOption[] = [
  {
    id: 'luxury',
    label: 'Luxury',
    blurb: 'Restrained, elevated, rich',
    iconName: 'award',
    selectedBackground: '#3D3428',
    selectedDark: true,
    promptFragment:
      'Vibe: luxury. Deep neutrals, refined lighting, generous negative space, gold/bronze accent.',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    blurb: 'Clean, typographic, spacious',
    iconName: 'circle',
    selectedBackground: '#F5F5F5',
    selectedDark: false,
    promptFragment:
      'Vibe: minimal. White background, product centered, soft diffuse shadow, restrained palette.',
  },
  {
    id: 'bold',
    label: 'Bold',
    blurb: 'Loud color, high contrast',
    iconName: 'zap',
    selectedBackground: '#E8754A',
    selectedDark: false,
    promptFragment:
      'Vibe: bold. Saturated single-color backdrop, high contrast, chunky composition.',
  },
  {
    id: 'warm',
    label: 'Warm',
    blurb: 'Earthy, organic, daylight',
    iconName: 'sun',
    selectedBackground: '#F0DCC4',
    selectedDark: false,
    promptFragment:
      'Vibe: warm & natural. Sun-drenched daylight, linen textures, timber surfaces, earth palette.',
  },
  {
    id: 'editorial',
    label: 'Editorial',
    blurb: 'Magazine-cover considered',
    iconName: 'book',
    selectedBackground: '#E8E0D8',
    selectedDark: false,
    promptFragment:
      'Vibe: editorial. Magazine-cover framing, muted palette, subtle film grain, slight asymmetry.',
  },
  {
    id: 'playful',
    label: 'Playful',
    blurb: 'Bright, soft, friendly',
    iconName: 'smile',
    selectedBackground: '#F5E0F0',
    selectedDark: false,
    promptFragment:
      'Vibe: playful. Pastel palette, soft shapes, floating props, cheerful feel.',
  },
  {
    id: 'retro',
    label: 'Retro',
    blurb: 'Warm grain, vintage',
    iconName: 'rotate-ccw',
    selectedBackground: '#F0DBA8',
    selectedDark: false,
    promptFragment:
      'Vibe: retro. 70s/80s print aesthetic, vintage color block, grainy finish.',
  },
  {
    id: 'cinematic',
    label: 'Cinematic',
    blurb: 'Moody, filmic contrast',
    iconName: 'film',
    selectedBackground: '#1A1F2E',
    selectedDark: true,
    promptFragment:
      'Vibe: cinematic. Moody key-and-fill lighting, filmic grade, volumetric atmosphere.',
  },
];


export type ProductShootSubCategory =
  | 'studio'
  | 'editorial'
  | 'lifestyle'
  | 'story&energy';

export type ProductShootPreset = {
  id: string;
  name: string;
  blurb: string;
  subCategory: ProductShootSubCategory;
  categoryPrompt: string;
  previewImage?: ImageSourcePropType;
};

export const PRODUCT_SHOOT_SUB_CATEGORIES: Array<{
  id: ProductShootSubCategory;
  label: string;
}> = [
  { id: 'studio', label: 'Studio' },
  { id: 'editorial', label: 'Editorial' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'story&energy', label: 'Story & Energy' },
];

export const PRODUCT_SHOOT_PRESETS: ProductShootPreset[] = [
  {
    id: 'minimal_studio',
    name: 'Minimal Studio',
    subCategory: 'studio',
    blurb: 'Clean, modern, product-first with strong negative space',
    previewImage: require('../assets/minimal_studio.png'),
    categoryPrompt: `A clean, minimal studio still-life. The product is the entire frame's reason to exist; everything else recedes.

Camera & lens: 85mm at f/5.6 on a medium-format body. Eye-level or 5° tilt. Subject occupies 45–55% of the frame with generous, intentional negative space.
Lighting: one large overhead softbox feathered toward the front, plus a low white fill card. Soft, slow falloff. A single quiet contact shadow on the surface — never floating.
Surface & background: seamless matte paper or unpainted plaster in off-white, warm gray, or a single desaturated tone that flatters the product. No props.
Composition: centered or rule-of-thirds. Strong negative space. Sharp edges, true colors, optional subtle reflection only if the surface naturally produces one.
Mood: calm, premium, intentional. Should read like the cover of a brand book.

Avoid: lifestyle context, props, atmosphere, gradients with mood, abstract decorative elements, dramatic shadows.`,
  },
  {
    id: 'premium_editorial',
    name: 'Premium Editorial',
    subCategory: 'editorial',
    blurb: 'Magazine-style with refined textures and elegant styling',
    previewImage: require('../assets/premium_editorial.png'),
    categoryPrompt: `A high-end editorial photograph — magazine campaign / luxury brand shoot. Still-life energy with painterly light.

Camera & lens: 80mm at f/5.6 on a medium-format body (Phase One / Hasselblad look). Slight downward angle for product authority. Compression flatters the subject; texture micro-detail is critical.
Lighting: hard-edged single-source key (one window, one Fresnel, or one beauty dish with grid) from camera-left or camera-right. Deep falloff into rich, controlled shadow. Optional soft fill at 1:8 ratio.
Surface & background: choose ONE refined material that matches the product identity — honed marble, brushed steel, hand-thrown ceramic, raw travertine, fluted glass, washi paper, oiled wood, plaster, or limestone. Single material, not a mix.
Composition: rule-of-thirds or strong off-center placement. Tasteful negative space. Two props maximum; both must serve the product story (e.g. fabric drape, raw ingredient, vessel).
Mood: gallery print. Slow. Considered. Reads as $300+ retail price perception.

Avoid: bright catalog lighting, busy props, mass-market energy, mall-store feel, multiple competing surfaces.`,
  },
  {
    id: 'bold_brand_color',
    name: 'Bold Brand Color',
    subCategory: 'studio',
    blurb: 'Strong brand-color driven image with graphic composition',
    previewImage: require('../assets/bold_brand_color.png'),
    categoryPrompt: `A graphic, color-blocked product shot. Treat the brand color the way a poster designer would — flat, confident, Pantone-driven.

Camera & lens: 50mm at f/8 on full-frame. Dead-on or slight 3/4 angle. Subject pops crisp against the field of color.
Lighting: two flat, even softboxes (45° each side) for clean even illumination across the product face. No hard shadow drama; the COLOR carries the energy, not the light.
Surface & background: seamless paper in the product's dominant brand color, OR a two-tone color-blocked backdrop using the product's primary + accent. Optional single graphic prop in a complementary saturated tone.
Composition: bold geometric layout — circles, halves, diagonals. Product placed off-center with intentional flat negative space. Hard edges, no atmospheric haze.
Mood: confident, modern, scroll-stopping. Reads as a billboard or supermarket-aisle hero — but considered, not loud.

Avoid: muted neutrals, marble/stone, soft moody lighting, lifestyle context, gradient mush, more than 3 colors competing.`,
  },
  {
    id: 'creative_concept',
    name: 'Creative Concept',
    subCategory: 'editorial',
    blurb: 'Campaign visual built on one strong artistic idea',
    previewImage: require('../assets/creative_concept.png'),
    categoryPrompt: `A campaign visual built on ONE strong artistic idea — sculptural, symbolic, controlled. Picture a print ad in Vogue or a launch hero for a perfume house.

Camera & lens: 100mm at f/2.8 macro for tight intimate frames, OR 35mm at f/4 wide-angle for surreal scale and theatre. Choose whichever serves the concept; don't mix.
Lighting: dramatic side-key with deep shadow, often colored gel on the rim or back light. Optional faint atmospheric haze. Light is part of the idea, not just illumination.
Surface & background: sculptural — floating in colored void, suspended in mist, partially submerged in liquid, framed by abstract architectural shapes, or set inside a single symbolic prop (a giant petal, a stone niche, a rippled surface).
Composition: ONE clear concept, executed precisely. Avoid the chaos of multiple metaphors. The product remains hero; the concept supports it.
Mood: creative, considered, campaign-ready. Reads as art-directed, not AI-generated.

Avoid: random fantasy elements, multiple competing metaphors, cluttered prop fields, plain studio look (use Minimal Studio for that), realistic lifestyle setting (use Lifestyle for that).`,
  },
  {
    id: 'lifestyle_minimal',
    name: 'Lifestyle Minimal',
    subCategory: 'lifestyle',
    blurb: 'Real-world setting with minimal props and negative space',
    previewImage: require('../assets/lifestyle_minimal.png'),
    categoryPrompt: `A minimal lifestyle still — the product placed naturally in a believable real-world moment. Quiet, intentional, lived-in.

Camera & lens: 50mm at f/2.8 on full-frame, eye-level. Slight shallow DOF — the environment present but not competing.
Lighting: large window or skylight light (single soft diffused daylight source). Natural shadows, gentle color cast appropriate to time of day.
Setting: choose ONE believable usage moment that matches the product — skincare on a stone bathroom ledge with one folded linen towel; fragrance on a wood bedside table with one open paperback; headphones on a clean walnut desk with one ceramic mug; food packaging on a marble kitchen counter with two raw ingredients nearby.
Composition: product hero, environment supporting. Background softly blurred so the product stays sharp. Maximum 2–3 supporting elements; never a styled-flat-lay maximalism.
Mood: morning routine, slow ritual, considered home. Reads as a real customer's life, edited.

Avoid: studio cyclorama (use Minimal Studio for that), bold brand color blocking, dramatic cinematic key light (use Cinematic for that), maximalist props, retail-shelf staging.`,
  },
  {
    id: 'outdoor_lifestyle',
    name: 'Outdoor Lifestyle',
    subCategory: 'lifestyle',
    blurb: 'Natural or outdoor setting that fits the product identity',
    previewImage: require('../assets/outdoor_lifestyle.png'),
    categoryPrompt: `An outdoor lifestyle photograph — the product belongs to the natural world it's set in. Travel-editorial, in-the-wild, atmospheric depth.

Camera & lens: 35mm at f/4 on full-frame, slight low angle to give the product hero scale against the landscape. Sharp on product, gradual background falloff.
Lighting: golden-hour direct sun (45–60 minutes after sunrise or before sunset). Warm hard rim from camera-back, soft sky fill from camera-front. Visible long shadow.
Setting: choose ONE outdoor environment that matches the product DNA — beach + driftwood + smooth wet sand for ocean-coded skincare; pine forest + moss + dappled light for wellness; sun-bleached rooftop + city haze for performance gear; alpine boulder + clear sky for adventure goods; coastal terrace + linen for fragrance.
Composition: product hero, environment depth. Real atmosphere — air, distance, scale. Optional one natural prop (a stone, a leaf, fabric, water drops) to anchor the product physically in the scene.
Mood: aspirational but believable. Travel magazine, brand expedition, real-world authority.

Avoid: studio-shot product comped onto a flat outdoor backdrop, indoor lifestyle (use Lifestyle Minimal for that), motion/splash energy (use Motion & Energy for that), staged urban photoshoot feel.`,
  },
  {
    id: 'cinematic_mood',
    name: 'Cinematic Mood',
    subCategory: 'editorial',
    blurb: 'Film-like lighting, drama, emotional atmosphere',
    previewImage: require('../assets/cinematic_mood.png'),
    categoryPrompt: `A cinematic frame — film-like lighting, emotional atmosphere, the energy of a 30-second luxury commercial paused on the hero shot.

Camera & lens: 85mm at f/2 cine prime on full-frame. Shallow depth, painterly bokeh. Optional anamorphic-style horizontal flare and 2.39:1 framing instinct (even when the actual aspect ratio is 1:1 or 4:5 — preserve the cinematic eye).
Lighting: ONE hard key (Fresnel, par can, or single window) with deep falloff. Optional rim/back light to separate product from background. Color contrast — warm key against cool ambient, or cool blue key against warm tungsten ambient. Strong shadow, intentional darkness.
Surface & background: textured, atmospheric — concrete with patina, dark walnut, charcoal velvet, weathered stone, frosted glass. Optional subtle haze, mist, or dust in the air for light beams.
Composition: rule-of-thirds with low-key lighting. Product reads as protagonist. Color graded — teal/orange, cool steel, warm amber, or sodium-vapor.
Mood: powerful, slow, emotional. Reads as a frame from a Wong Kar-wai or Ridley Scott commercial.

Avoid: bright catalog lighting (use E-commerce Hero Plus), evenly-lit color blocking (use Bold Brand Color), bright outdoor daylight (use Outdoor Lifestyle), splashy motion (use Motion & Energy).`,
  },
  {
    id: 'ingredient_feature_story',
    name: 'Ingredient / Feature Story',
    subCategory: 'story&energy',
    blurb: 'Ingredients, materials, benefits, features told visually',
    previewImage: require('../assets/ingredient_feature_story.png'),
    categoryPrompt: `An editorial composition that visually narrates what's INSIDE the product — its ingredients, materials, or core feature. The product surrounded by the things that make it work.

Camera & lens: choose ONE — 100mm macro at f/4 for tight intimate ingredient detail and shallow DOF, OR 50mm at f/8 overhead flat-lay for a top-down knolling layout. Don't mix.
Lighting: focused beauty dish or large softbox key + thin gridded back-light to lift edges and separate elements. Texture-revealing side light for ingredient surfaces. Even shadow control across the whole layout.
Composition: choose ingredients/materials that LITERALLY appear in or define the product — don't generalize. For consumables: fresh-cut fruit, dripping oil, scattered herb leaves, water beads, ground spices. For wearables/tech: sectioned material swatch, exposed mechanism, raw material slab, exploded-component layout.
Density: 3–6 supporting elements maximum, intentionally placed. The product remains visual hero; the ingredients are storytellers, not crowd.
Mood: editorial, fresh, informative. Reads like a magazine spread or premium brand storytelling page.

Avoid: random kitchen-shelf props that have nothing to do with the product, plain studio shot (use Minimal Studio), aspirational lifestyle moment (use Lifestyle Minimal), abstract conceptual scene (use Creative Concept).`,
  },
  {
    id: 'motion_energy',
    name: 'Motion & Energy',
    subCategory: 'story&energy',
    blurb: 'Splash, mist, particles, movement — dynamic and ad-ready',
    previewImage: require('../assets/motion_energy.png'),
    categoryPrompt: `A high-speed frame freezing motion around the product — splash, mist, particles, fabric, smoke. Crisp, dynamic, ad-ready.

Camera & lens: 100mm at f/8 on full-frame at 1/8000s shutter (visual reference — communicates frozen-instant clarity). Medium-close framing with the product hero-sized in frame.
Lighting: high-speed strobes — one key softbox + one back/rim strobe for particle separation. Crisp edges on every droplet and particle. No motion blur on the product itself; the product stays pin-sharp while the motion swirls around it.
Motion type: choose ONE based on product DNA — water splash for beverages and skincare; coloured powder cloud for cosmetics and supplements; mist veil for fragrance; flying silk for fashion accessories; light streaks or sparks for tech; flour/sugar dust for food packaging; smoke ribbons for premium tech.
Composition: the motion frames the product without covering the label or front face. Negative space behind motion for breathing room. Backdrop: clean dark or saturated color for max contrast.
Mood: athletic, energetic, advertising-loud. Reads as a commercial frame, not a lab accident.

Avoid: messy chaotic spray that hides the product, stationary still-life look (use Bold Brand Color or Minimal Studio), warm soft window light (use Lifestyle), motion blur ON the product itself.`,
  },
  {
    id: 'ecommerce_hero_plus',
    name: 'E-commerce Hero Plus',
    subCategory: 'studio',
    blurb: 'Clean listing-ready, slightly premium',
    previewImage: require('../assets/ecommerce_hero_plus.png'),
    categoryPrompt: `An e-commerce listing hero — accurate, trustworthy, slightly elevated above a plain white background. Built for Shopify / Amazon / PDP hero modules.

Camera & lens: 50mm at f/8 on full-frame, dead-on or 5° tilt to suggest dimension while staying catalog-honest. Subject occupies 55–70% of the frame.
Lighting: two large softboxes at 45° each side for clean even fill across the entire product face — every label readable, every color accurate, no harsh shadow swallowing detail. Optional small kicker for edge separation.
Surface & background: pure white, very-light gray, soft brand-tinted gradient, OR a single low-contrast color wash. Subtle ground shadow directly under the product (anchor it — never floating). Optional faint surface reflection if material allows.
Composition: centered, symmetrical or near-symmetrical, hero-front. No props. No environment. No styled context. Product label clearly visible and legible.
Mood: trustworthy, accurate, professionally retouched. Reads as an Apple PDP or DTC brand product page.

Avoid: dramatic shadow direction (use Cinematic), atmospheric mood, props, lifestyle context, marble/stone editorial surfaces (use Premium Editorial), color-blocking energy (use Bold Brand Color).`,
  },
];

export type SocialPostGoal =
  | 'awareness'
  | 'conversion'
  | 'education'
  | 'trust'
  | 'engagement';

export type SocialPostSubCategory =
  | 'show_product'
  | 'drive_action'
  | 'build_trust'
  | 'educate&engage';

export type SocialPostTextLevel = 'level_1_or_2' | 'level_2' | 'level_3';

export type SocialPostPreset = {
  id: string;
  name: string;
  blurb: string;
  subCategory: SocialPostSubCategory;
  goal: SocialPostGoal;
  defaultTextLevel: SocialPostTextLevel;
  categoryPrompt: string;
  previewImage?: ImageSourcePropType;
};

export const SOCIAL_POST_SUB_CATEGORIES: Array<{
  id: SocialPostSubCategory;
  label: string;
}> = [
  { id: 'show_product', label: 'Show product' },
  { id: 'drive_action', label: 'Drive action' },
  { id: 'build_trust', label: 'Build trust' },
  { id: 'educate&engage', label: 'Educate & engage' },
];

export const SOCIAL_POST_PRESETS: SocialPostPreset[] = [
  {
    id: 'product_highlight',
    name: 'Product Highlight',
    previewImage: require('../assets/product_highlight.png'),
    subCategory: 'show_product',
    blurb: 'Show the product clearly with a strong visual and short hook',
    goal: 'awareness',
    defaultTextLevel: 'level_2',
    categoryPrompt: `A product-highlight social post — pure recognition. The product is the hook; everything else serves it. Should stop the thumb in 0.4 seconds.

Visual direction:
- Hero product front-and-center or at strong rule-of-thirds anchor, sized confidently in frame.
- Background: solid brand-aligned color, soft gradient in product palette, or one tasteful textured surface. No competing scene.
- Lighting: clean studio energy — soft key with subtle shadow. Premium products get gentler light; energetic categories get punchier contrast.
- Maximum 1–2 supporting elements (a leaf, a swatch, a drop) IF they reinforce identity. Otherwise none.

Text style:
- ONE short headline (3–6 words). Confident, benefit-led, not generic.
- Optional tiny subline (1 short phrase) only if the product is functional, not premium.
- Headline uses sans-serif at 8–12% of frame height. Strong contrast against background.

Examples of headline register: "Built for precision." / "Calm, in a bottle." / "Skin, restored." / "Tasty. Smarter. Lighter."

Avoid: split-screen comparison framing (use Comparison), step-by-step layout (use How-To), review/quote treatment (use Testimonial), launch reveal language ("Introducing…" — use Product Launch).`,
  },
  {
    id: 'product_launch',
    name: 'Product Launch',
    previewImage: require('../assets/product_launch.png'),
    subCategory: 'show_product',
    blurb: 'Announce a new product, collection, drop, or feature',
    goal: 'awareness',
    defaultTextLevel: 'level_2',
    categoryPrompt: `A product-launch social post — reveal energy. Something is NEW; the post has to telegraph that immediately.

Visual direction:
- Reveal-style framing: product emerging from shadow, lit by a single dramatic key light, on a slightly elevated pedestal or against a clean ceremonial backdrop.
- Premium launches = cinematic restraint (deep blacks, single light source, generous negative space). Mass-market launches = brighter, more energetic (saturated brand color, bold typography, optional small "NEW" tag).
- Optional small "NEW" / "JUST DROPPED" tag in a corner — ONLY if the brand register is mass-market. Skip for luxury.
- Composition: product placed off-center with intentional empty space for the launch headline.

Text style:
- Launch headline (e.g. "Introducing [Product]" / "Meet [Product]" / "New. Now.") at 10–14% of frame height, set in a confident sans-serif or refined serif depending on brand tier.
- ONE supporting line (4–8 words) describing what makes it new.
- No bullets, no benefits list — that's a different category.

Headline register: "Introducing [name]." / "Meet your new ritual." / "New drop. Same obsession." / "A new expression of [category]."

Avoid: comparison framing (use Comparison), pre-existing benefit emphasis (use Benefits Breakdown), customer review framing (use Testimonial), how-to steps (use How-To), generic "shop now" sale energy (use Offer/Sale).`,
  },
  {
    id: 'offer_sale_post',
    name: 'Offer / Sale Post',
    previewImage: require('../assets/offer_sale_post.png'),
    subCategory: 'drive_action',
    blurb: 'Promote a discount, bundle, flash sale, or limited-time deal',
    goal: 'conversion',
    defaultTextLevel: 'level_3',
    categoryPrompt: `An offer/sale social post — designed to drive clicks. Clear hierarchy, retail energy, but NOT cheap.

Visual direction:
- Strong typographic hierarchy: the offer number/amount is the LARGEST element in frame (e.g. "20% OFF" or "BUY 1 GET 1" set at 18–28% of frame height).
- Product clearly visible at 35–50% of frame, supporting the offer copy. Product NEVER hidden behind sale typography.
- Background: brand color OR a single tasteful surface (NOT generic red-yellow sale paper unless brand is mass-market discount).
- Optional clean "limited time" / countdown tag, promo code chip, or CTA pill — only if data was provided in the brief.
- For luxury products: smaller offer typography, restrained palette (e.g. cream + charcoal, not red + yellow), serif numerals — premium discount energy, not bargain-bin.

Text style (only if data provided):
- Offer line (largest): "20% OFF" / "BUY 1 GET 1" / "FREE SHIPPING".
- Subline: "Limited time." / "Ends Sunday." / "Use code SAVE20".
- CTA pill: "SHOP NOW" / "GET OFFER".

If NO offer was provided in the brief: do NOT invent a discount. Pivot to a benefit-led conversion hook ("Yours, today.") and skip the offer-amount typography entirely.

Avoid: cluttered starburst stickers (unless explicitly mass-market), product hidden behind text, fake discount percentages, fake "limited time" if no time was provided, premium products styled with bargain-bin red-yellow.`,
  },
  {
    id: 'problem_solution',
    name: 'Problem → Solution',
    previewImage: require('../assets/problem_solution.png'),
    subCategory: 'drive_action',
    blurb: 'Turn a customer pain point into a product solution post',
    goal: 'conversion',
    defaultTextLevel: 'level_2',
    categoryPrompt: `A problem→solution social post — name the pain, present the product as the relief. Empathy first, then resolution.

Visual direction:
- TWO-PART composition: left/top half visualizes the PROBLEM (muted desaturated tones, looser composition, or an empty/lacking moment); right/bottom half shows the PRODUCT as resolution (full brand color, sharper light, clean composition). OR a single frame with the product positioned as the "answer" against a tonally tense background.
- For premium products: keep the problem half subtle and emotional (mood lighting) rather than literal. For functional products (cleaning, tech, supplements): the problem half can be more literal (clutter, dullness, fatigue cue).
- Light: muted/cool on problem, warm/clean on solution. The shift in light reinforces the narrative arc.

Text style:
- Problem hook FIRST (5–8 words, often a question): "Dry skin in winter?" / "Tired of slow apps?" / "Bland snacks again?"
- Solution line SECOND (4–6 words, leading with the product/brand): "Restored. Daily." / "Faster. Cleaner. Yours." / "Smarter snacking, finally."
- Optional small CTA pill at bottom.

Avoid: pure benefit-list framing (use Benefits Breakdown), comparison vs a named competitor (use Comparison), launch-reveal language (use Product Launch), pure mood without a problem hook (use Lifestyle Story).`,
  },
  {
    id: 'benefits_feature_breakdown',
    name: 'Benefits / Feature Breakdown',
    previewImage: require('../assets/benefits_feature_breakdown.png'),
    subCategory: 'build_trust',
    blurb: 'Explain the top benefits or features in a clean layout',
    goal: 'education',
    defaultTextLevel: 'level_3',
    categoryPrompt: `A benefits/feature breakdown post — informational, scannable, designed to make the value list legible at thumbnail size.

Visual direction:
- Product as central anchor (40–55% of frame), with 3–5 benefit chips arranged in a clean grid AROUND it (radial callouts) OR in a single column on one side (panel layout).
- Each benefit gets its own line; do NOT cram them into prose.
- Optional small minimalist icon next to each benefit (line-style, single-stroke, monochrome — never illustrated emoji-style icons).
- Background: clean off-white, light gray, or soft brand tint. Never busy.
- Connecting lines or dotted leaders between benefits and product are allowed if they feel infographic-like, not childish.

Text style:
- Headline (top, optional): one short framing line ("Why it works." / "Built for ___.") at 7–10% of frame height.
- 3–5 benefit phrases, each 2–4 words: "Natural ingredients" / "12-hour wear" / "Ergonomic grip" / "Vegan + cruelty-free".
- All benefits use parallel structure (all noun-led, OR all verb-led — pick one).

Avoid: long descriptive sentences (this is not Lifestyle Story), step-by-step framing (use How-To), comparison framing (use Comparison), more than 5 benefits (cluttered), emoji-style icons (use minimal line icons or none).`,
  },
  {
    id: 'how_to_usage_guide',
    name: 'How-To / Usage Guide',
    previewImage: require('../assets/how_to_usage_guide.png'),
    subCategory: 'educate&engage',
    blurb: 'Show how to use the product in simple steps',
    goal: 'education',
    defaultTextLevel: 'level_3',
    categoryPrompt: `A how-to / usage-guide social post — teach the viewer how to use the product in 3 short steps.

Visual direction:
- 3-PANEL layout: vertical stack OR horizontal split into 3 equal sections, each showing one step. Steps numbered "01 / 02 / 03" or "1. / 2. / 3." with consistent typographic treatment.
- Each panel shows the relevant moment: panel 1 = product/preparation, panel 2 = product in active use (often with a hand or partial body for human context), panel 3 = result/outcome.
- For premium brands: minimal layout, restrained typography, single-color palette, optional thin divider lines between panels.
- For functional brands: brighter, more illustrative, clearer arrows/numbers, optional line-icons.

Text style:
- Title (top): "How to use." / "In 3 steps." / "Daily ritual." (5–8% of frame height).
- Step labels: "01 Apply" / "02 Massage" / "03 Absorb" — each verb 1–2 words, action-led, parallel structure.
- Optional one-line description under each step (3–6 words).

Avoid: 4+ steps (carousel territory — keep ≤3), benefit-list framing (use Benefits Breakdown), comparison framing (use Comparison), pure aspirational mood without instruction (use Lifestyle Story).`,
  },
  {
    id: 'comparison_post',
    name: 'Comparison Post',
    previewImage: require('../assets/comparison_post.png'),
    subCategory: 'drive_action',
    blurb: 'Compare against alternatives, old ways, or before/after',
    goal: 'conversion',
    defaultTextLevel: 'level_3',
    categoryPrompt: `A comparison social post — help the viewer choose. The product wins clearly but fairly.

Visual direction:
- SPLIT-SCREEN layout: vertical 50/50 OR horizontal 50/50 OR before/after diagonal split. Left/top half = the alternative (muted, desaturated, generic-looking); right/bottom half = the product (full color, sharper, intentional styling).
- Centerline marked clearly — vertical/horizontal divider line OR a "VS" badge in the middle.
- The "alternative" side stays generic (no named competitor, no fake brand) unless the brief explicitly names one.
- Optional 3–4 comparison rows of short text pairs aligned across the centerline.
- For premium products: cleaner palette, less hostile contrast (cream vs charcoal). For functional products: stronger visual contrast (gray vs full-brand-color).

Text style:
- Title (top): "Compare." / "Why switch." / "The difference." (6–9% of frame height).
- 3–4 paired comparison points, each side 2–4 words, parallel: "Generic care | Targeted care" / "High sugar | Smart snacking" / "Plastic feel | Aluminum body".
- Optional CTA at bottom.

Avoid: messy tables, more than 4 comparison rows, naming a real competitor brand unless explicitly provided, hostile/aggressive copy ("crushes the competition"), problem-only framing without a clear contrast (use Problem→Solution).`,
  },
  {
    id: 'testimonial_review',
    name: 'Testimonial / Review',
    previewImage: require('../assets/testimonial_review.png'),
    subCategory: 'build_trust',
    blurb: 'Use review-style copy to build trust and credibility',
    goal: 'trust',
    defaultTextLevel: 'level_2',
    categoryPrompt: `A testimonial / review social post — social proof. Make the praise feel believable and earned, not corporate.

Visual direction:
- Product clearly visible at 35–55% of frame, with a clean review/quote treatment as a visual element on the layout. Review treatment options:
  • Card style — soft white card, subtle drop-shadow, contains the quote + author line + optional star row.
  • Quote-mark style — large open quotation mark glyph (serif), the quote set in italic underneath.
  • Speech-bubble style — rounded bubble pointing toward the product (only for casual/youthful brands).
- Optional star rating row (★★★★★) — render only if the brief provided a star count. Never invent.
- For premium products: serif typography, single-quote style, no star row, restrained palette.
- For functional/mass-market: card style with star row, friendlier palette.

Text style:
- ONE short quote in quotation marks (6–14 words): "My signature scent." / "Edge I didn't know I needed." / "Skin feels soft all day."
- Author/handle line below quote: "— @sarah_k" / "— Verified buyer" — only render if the brief actually provided one.
- Optional category framing line at top: "What customers say." / "Real reviews." (small, supporting).

Important: never invent review counts, star ratings, customer numbers, or named reviewers. If the brief didn't provide them, omit them entirely.

Avoid: long multi-sentence reviews (1 quote only), faked star counts, faked reviewer names, mass-market sale energy (use Offer/Sale), launch-reveal language (use Product Launch).`,
  },
  {
    id: 'ugc_creator_style',
    name: 'UGC / Creator Style',
    previewImage: require('../assets/ugc_creator_style.png'),
    subCategory: 'build_trust',
    blurb: 'Native creator-style content that feels personal',
    goal: 'trust',
    defaultTextLevel: 'level_2',
    categoryPrompt: `A UGC / creator-style social post — looks like a real person posted it from their phone. NOT a polished ad.

Visual direction:
- Phone-camera energy: 24–28mm equivalent, f/1.8 (slightly soft DOF), held at arm's length or on a counter. Slightly imperfect framing — off-center, slightly tilted, partial in-frame body parts (hand holding the product, knee, corner of a sweater) are fine.
- Lighting: real-world ambient — bedroom morning light, kitchen window, café table, bathroom counter, car passenger seat. Mixed temperature warmth (some warm tungsten / some cool window light) for authenticity.
- Setting: lived-in, slightly cluttered but tasteful. A half-drunk coffee, an open book, a folded scarf in the background. Real surfaces, real props.
- For premium products: keep the "casual" feel but with cleaner styling (better surfaces, less clutter). For mass-market: lean into messy-real.

Text style:
- Casual handwritten or sticker-style overlay (NOT polished sans-serif). Optional emoji in the actual style of an Instagram Story sticker (only if the brand allows it).
- ONE short caption: "my new go-to ✨" / "didn't expect to love this" / "this is the one" / "girlies. it's good."
- Optional small mock UI element — Story poll sticker, "swipe up", or rating slider (only if format is 9:16 vertical).

Avoid: studio lighting (use Product Highlight), pristine flat-lay (use Lifestyle Story), polished agency typography, polished review-card layouts (use Testimonial), product front-and-center hero framing (use Product Highlight).`,
  },
  {
    id: 'lifestyle_story',
    name: 'Lifestyle Story',
    previewImage: require('../assets/lifestyle_story.png'),
    subCategory: 'show_product',
    blurb: 'Place the product inside an aspirational moment',
    goal: 'awareness',
    defaultTextLevel: 'level_1_or_2',
    categoryPrompt: `A lifestyle-story social post — sell a FEELING, not a feature. Place the product inside an aspirational moment that the buyer wants to inhabit.

Visual direction:
- Cinematic editorial style — 35mm or 50mm, shallow depth, real-world setting that aligns with the product's identity.
- Choose ONE moment: morning coffee on a sunlit kitchen counter / linen-bedded slow Sunday / golden-hour balcony / desk-lamp focus session / pre-workout dawn / candlelit evening ritual.
- Product is present and sharp but not the LARGEST element — the moment is. The product earns its place by belonging in the frame.
- Atmosphere: warm tungsten + cool window light, soft haze, visible texture (linen, wood grain, ceramic, paper). Background supports the mood, never competes.

Text style:
- ONE evocative line, often 3–6 words, atmospheric register: "Made for slow mornings." / "Your world. Your rules." / "Pause. Then begin." / "Quiet luxury, daily."
- Set in elegant typography — light-weight sans-serif or modest serif. Small, not loud (5–8% of frame height).
- Optional brand wordmark in a corner if the brief allows (small, restrained).

Avoid: explicit benefit listing (use Benefits Breakdown), problem framing (use Problem→Solution), retail-loud sale energy (use Offer/Sale), studio cyclorama (use Product Highlight), creator-phone feel (use UGC).`,
  },
  {
    id: 'educational_value_post',
    name: 'Educational / Value Post',
    previewImage: require('../assets/educational_value_post.png'),
    blurb: 'Helpful tips, facts, myths, or checklists',
    subCategory: 'educate&engage',
    goal: 'education',
    defaultTextLevel: 'level_3',
    categoryPrompt: `An educational / value post — earn the save by teaching something genuinely useful. Information design, not advertising.

Visual direction:
- Clean editorial layout — strong title block at the top, 3–5 numbered list items underneath, product included naturally as a visual anchor (often bottom-right or as a partial border element). NEVER the hero.
- Background: off-white, warm cream, or soft brand-tinted neutral. Generous margins. Reads like a magazine page or a LinkedIn-style infographic.
- Typography: editorial-grade. A confident display weight for the title, a clean readable body weight for the tips. Numbered "01 / 02 / 03" markers in a contrasting accent color.
- Optional minimal line icons (one stroke, monochrome) ONLY if they directly illustrate the tip.

Text style:
- Title (largest, top): "3 ways to ___" / "5 facts about ___" / "What nobody tells you about ___" / "___ explained" — set at 10–15% of frame height.
- 3–5 tips, each one short line (4–8 words). Parallel structure across all tips. Plain, factual register — not salesy.
- Optional small "save this post 🔖" line at bottom (only if brand register allows emoji).

Avoid: salesy benefit framing ("Buy now!"), vague platitudes ("be your best self"), more than 5 tips (use a carousel format instead — but this is one slide), launch-reveal copy (use Product Launch).`,
  },
  {
    id: 'trend_meme_engagement',
    name: 'Trend / Meme / Engagement',
    previewImage: require('../assets/trend_meme_engagement.png'),
    blurb: 'Relatable, shareable, native content',
    subCategory: 'educate&engage',
    goal: 'engagement',
    defaultTextLevel: 'level_2',
    categoryPrompt: `A trend / meme / engagement social post — designed to generate comments, shares, and saves. Native to the platform's current visual idioms.

Visual direction:
- Lean into platform-native conventions — text overlays styled like Instagram Story stickers / TikTok captions / Twitter quote screenshots / iOS Notes-app screenshots. Use the visual furniture of the platform itself as part of the composition.
- The product is naturally included (held in a hand, sitting on a surface, mid-action) but NOT pristine-hero. Slightly imperfect, very real.
- Hook framing options: POV-style ("POV: you ___"), comment-prompt ("Tag someone who ___"), green-flag/red-flag side-by-side, "When the ___ hits different" caption, trending audio caption with timestamp.
- For premium products: keep the meme energy but with cleaner styling so the brand doesn't look cheap (matte palette, sharper photography, restrained sticker overlays).

Text style:
- ONE bold hook (5–10 words) in the platform's idiomatic register. Casual punctuation, lowercase often okay.
- Examples: "POV: You found your signature scent." / "tag a friend who NEEDS this 👀" / "girl math says I had to" / "when the routine actually works".
- Optional small comment-prompt line ("comments are open ⬇️").

Avoid: corporate ad copy ("Premium quality, since 2014"), launch-reveal language (use Product Launch), polished editorial layouts (use Lifestyle Story), problem-solution framing (use Problem→Solution).`,
  },
];

export type AdsCreativeTextDensity = 'low' | 'medium' | 'high';

export type AdsCreativeSubCategory =
  | 'awareness'
  | 'persuade'
  | 'drive_action'
  | 'native&tech';

export type AdsCreativePreset = {
  id: string;
  name: string;
  subCategory: AdsCreativeSubCategory;
  blurb: string;
  defaultTextDensity: AdsCreativeTextDensity;
  categoryPrompt: string;
  previewImage?: ImageSourcePropType;
};

export const ADS_CREATIVE_SUB_CATEGORIES: Array<{
  id: AdsCreativeSubCategory;
  label: string;
}> = [
  { id: 'awareness', label: 'Awareness' },
  { id: 'persuade', label: 'Persuade' },
  { id: 'drive_action', label: 'Drive action' },
  { id: 'native&tech', label: 'Native & tech' },
];

export const ADS_CREATIVE_PRESETS: AdsCreativePreset[] = [
  {
    id: 'brand_awareness',
    name: 'Brand Awareness',
    subCategory: 'awareness',
    blurb: 'Make people remember the product',
    previewImage: require('../assets/brand_awareness.png'),
    defaultTextDensity: 'low',
    categoryPrompt: `A brand-awareness paid ad — purpose is RECALL, not click-through. The viewer should remember the product after the scroll, even if they don't tap.

Creative direction:
- Hero product front-and-center, lit cleanly, brand color dominant in the frame.
- ONE bold visual idea — a striking color block, a strong silhouette, an iconic product moment. The brand identity (palette, mark, type) is the message.
- Restrained typography: the headline is emotional or identity-led, not feature-led. Set in the brand's display register, large but not loud.
- Composition optimized for thumb-stop in feed: high contrast, hero shape readable at 200×200px.
- For premium brands: cinematic mood, deep negative space, restrained palette. For mass-market: bold flat color, larger logo presence, more energy.

Text style:
- ONE strong headline (4–8 words) that captures brand promise: "Calm, in a bottle." / "Built for the long run." / "Made for the modern routine."
- Optional 3–5 word subline.
- NO offer, NO bullet list, NO testimonial. This ad isn't trying to convert — it's trying to be remembered.

Best on: Meta Feed, Instagram Story, YouTube bumper, Pinterest Pin.

Avoid: feature lists (use Product Benefit), discount typography (use Offer/Promotion), star ratings or review quotes (use Social Proof), problem framing (use Problem→Solution), comparison framing (use Comparison/Switch).`,
  },
  {
    id: 'product_benefit',
    name: 'Product Benefit',
    subCategory: 'awareness',
    blurb: 'Show the main reason to buy',
    previewImage: require('../assets/product_benefit.png'),
    defaultTextDensity: 'medium',
    categoryPrompt: `A product-benefit paid ad — single clearest reason-to-buy, presented with a direct CTA. The viewer should understand what they GET in 1 second.

Creative direction:
- Product clearly visible at 35–50% of frame, sharp and lit cleanly. Hero placement on left or right depending on copy side.
- ONE main benefit headline carries the ad. Optional 1–3 supporting benefit chips beneath it (small, parallel, scannable).
- Clean hierarchy: headline (largest) → product → supporting points → CTA pill.
- CTA is mandatory: small rounded pill in the brand or accent color, set in clear sans-serif. Use the platform's CTA register ("Shop Now" / "Learn More" / "Get Yours").
- Background: solid brand color, soft brand-tinted gradient, or a clean editorial surface. NEVER busy.

Text style:
- Main headline (12–18% of frame height): one main benefit. "12-hour hydration." / "Charge in 30 min." / "Half the sugar. All the flavor." / "Skin that feels yours."
- 0–3 supporting bullets, each 2–4 words: "Vegan" / "Lightweight" / "Made in EU".
- CTA: 1–3 words, action verb.

Best on: Meta Feed, Google Display, Pinterest, LinkedIn.

Avoid: discount typography (use Offer/Promotion), step-by-step instruction (use Demo/How-It-Works), review quotes (use Social Proof), brand-mood-only framing without a benefit (use Brand Awareness), comparison split (use Comparison/Switch).`,
  },
  {
    id: 'problem_solution',
    name: 'Problem → Solution',
    subCategory: 'persuade',
    blurb: 'Pain point + product as answer',
    previewImage: require('../assets/problem_solution.png'),
    defaultTextDensity: 'medium',
    categoryPrompt: `A problem→solution paid ad — name the pain in the headline, present the product as the answer in the visual. Direct conversion psychology.

Creative direction:
- TWO-ZONE composition: problem zone (top or left) shown in muted/desaturated tones with a tense headline; solution zone (bottom or right) shown in clean brand-color treatment with the product hero. OR a single frame where the headline captures the problem and the product fills the rest of the frame as the resolution.
- Light shifts across the divide: cool/dim on the problem side, warm/clean on the solution side.
- Optional small supporting line under the product describing the mechanism ("with [hero ingredient/feature]").
- CTA pill at the bottom — direct and benefit-led.

Text style:
- Problem hook (top or first read, often a question): "Tired of dry winter skin?" / "Slow workflow killing your day?" / "Bland snacks. Again?" — set at 11–16% of frame height.
- Solution line (paired with product): "Restored. Daily." / "Faster, finally." / "Crunch with intention."
- CTA: "Shop Now" / "Try It" / "Learn More".

Best on: Meta Feed, Instagram Story (vertical zones), Google Display, TikTok in-feed.

Avoid: pure mood without a problem hook (use Brand Awareness), benefit listing (use Product Benefit), comparison vs a competitor (use Comparison/Switch), retail discount energy (use Offer/Promotion).`,
  },
  {
    id: 'offer_promotion',
    name: 'Offer / Promotion',
    subCategory: 'drive_action',
    blurb: 'Drive immediate action',
    previewImage: require('../assets/offer_promotion.png'),
    defaultTextDensity: 'medium',
    categoryPrompt: `An offer/promotion paid ad — designed to convert NOW. The discount is the headline; everything serves it.

Creative direction:
- Offer typography is the LARGEST element in frame (18–32% of frame height). "20% OFF" / "BUY 1 GET 1" / "FROM $19" — set in the brand's strongest weight, placed off-center for breathing room.
- Product clearly visible at 30–45% of frame, supporting the offer copy. Product never hidden by typography.
- Optional urgency element: "Ends Sunday." / "48 hours only." / "While stocks last." — small, in an accent color, only if the brief provided a real time limit.
- CTA pill at the bottom — direct: "SHOP NOW" / "GET OFFER" / "USE CODE [X]".
- Mass-market brands: bold flat brand color, larger typography, optional starburst or burst behind the offer (tasteful, not garish).
- Premium brands: smaller offer numerals in serif, restrained palette (cream + charcoal + accent), minimal CTA — premium-discount energy.

Text style:
- Offer line (largest): clear discount or deal.
- Subline (medium): scope or condition. "Sitewide." / "Use code SAVE20." / "Limited time."
- CTA pill: 1–3 words.

CRITICAL: if the brief did NOT provide an actual offer/discount, do NOT invent one. Pivot to a benefit-led conversion hook ("Yours, today.") and skip the offer-amount typography entirely. Never fabricate a percentage or price.

Best on: Meta Feed, Google Display, Email banner, Website hero.

Avoid: fake percentages, fake urgency, premium products styled with garish bargain palettes, brand-mood ads (use Brand Awareness), feature-explainer ads (use Demo/How-It-Works).`,
  },
  {
    id: 'social_proof',
    name: 'Social Proof',
    subCategory: 'persuade',
    blurb: 'Review, rating, or customer proof',
    previewImage: require('../assets/social_proof.png'),
    defaultTextDensity: 'medium',
    categoryPrompt: `A social-proof paid ad — reduce buying hesitation by surfacing what other customers said. Trust over hype.

Creative direction:
- Product visible at 35–50% of frame, with a clean review/proof element occupying the remaining space. Proof element options:
  • Quote-treatment — large opening serif quotation mark, the customer quote in italic.
  • Card-treatment — clean white card with a soft shadow, contains the quote + author + optional star row.
  • Ratings-strip — large star row with a numeric rating ("4.9★") and total review count, ONLY if the brief provided real numbers.
- Optional small "as seen in" / "trusted by" trust-signal row at the bottom — ONLY if the brief listed real publications/partners.
- For premium brands: serif typography, single italic quote, minimal stars, restrained palette.
- For mass-market: card with stars + rating count + CTA, brighter palette.

Text style:
- ONE customer quote (6–14 words): "My signature scent." / "Cut my prep time in half." / "Finally, sleep that lasts."
- Author or qualifier: "— Verified buyer" / "— @sarah_k" — only if real.
- Optional CTA: "Shop the favorite." / "Join 10,000 customers." (only if review counts/customer numbers were provided).

CRITICAL: do NOT invent review counts, star ratings, customer numbers, awards, or publication names. If the brief didn't provide them, render the quote alone — no stars, no count, no logos.

Best on: Meta Feed, Google Display, Retargeting placements.

Avoid: fake stars, fake ratings, fake "as seen in" logos, brand-mood hero (use Brand Awareness), discount typography (use Offer/Promotion), problem-hook framing (use Problem→Solution).`,
  },
  {
    id: 'ugc_native',
    name: 'UGC / Native',
    subCategory: 'native&tech',
    blurb: 'Real user/creator content feel',
    previewImage: require('../assets/ugc_native.png'),
    defaultTextDensity: 'low',
    categoryPrompt: `A UGC / native paid ad — looks like a creator/user posted it, not an ad team made it. The platform's algorithm + the audience both reward this register.

Creative direction:
- Phone-camera energy: 24–28mm equivalent, f/1.8 (slightly soft DOF), held at arm's length. Slight imperfections — off-center framing, partial in-frame body parts (hand holding the product, knee, corner of a sweater) are right.
- Ambient real-world lighting — bedroom morning, kitchen window, café table, bathroom counter, car passenger seat. Authentic mixed warmth.
- Setting: lived-in, slightly cluttered but intentional. Real surfaces, real props (half-drunk coffee, open notebook, folded sweater).
- Product shown in actual use or being held naturally. Never pristine-hero on cyclorama.
- Text overlay styled like a TikTok caption / Instagram Story sticker / Reel sub-caption — handwritten or platform-native sans-serif, NOT polished agency typography.

Text style:
- ONE casual hook (5–10 words), lowercase often okay, casual punctuation: "okay this is genuinely good" / "POV: you found it" / "didn't think i'd be posting this but" / "omg you guys".
- Optional second line as a sticker-style endorsement: "10/10" / "ride or die" / "must-have ✨".
- Optional small mock UI element on vertical formats — Story poll, swipe-up, sticker (only if 9:16).

Best on: TikTok in-feed, Instagram Reels, Stories, Snap.

Avoid: studio cyclorama (use Product Benefit), polished agency typography, polished review-card layout (use Social Proof), feature lists (use Demo/How-It-Works), brand mood hero (use Brand Awareness).`,
  },
  {
    id: 'comparison_switch',
    name: 'Comparison / Switch',
    subCategory: 'awareness',
    blurb: 'Why this beats the alternative',
    previewImage: require('../assets/comparison_switch.png'),
    defaultTextDensity: 'high',
    categoryPrompt: `A comparison / switch paid ad — make the product win clearly against an alternative or "the old way." Fair, not aggressive.

Creative direction:
- SPLIT-SCREEN layout: vertical 50/50 OR horizontal 50/50 OR before/after diagonal. Left/top = the alternative (muted, desaturated, generic-looking, sometimes labeled "Before" / "Old way" / "Ordinary"); right/bottom = the product (full color, sharper, brand-treatment, labeled "Now" / "New" / brand name).
- Centerline divider with optional "VS" badge, an arrow ("→"), or a clean vertical rule.
- The "alternative" side stays generic — never name a real competitor or use their colors/marks unless explicitly provided.
- 3–4 paired comparison rows of short text aligned across the centerline.
- Light shifts across the divide: cool/dim on the alternative side, warm/clean on the product side.
- CTA pill at the bottom — usually "Switch Today" / "See Why" / "Try It".

Text style:
- Title (top): "Why switch." / "Compare." / "The difference." / "From [old] to [new]."
- 3–4 paired rows, parallel structure: "Plastic feel | Aluminum body" / "60% sugar | 0g sugar" / "20-min boot | Instant on" / "Generic care | Targeted formula".
- CTA: 1–3 words, action-led.

CRITICAL: never name a real competitor brand unless the brief explicitly named one. Never make unsupported quantitative claims (no "3× better" without provided data).

Best on: Meta Feed, Google Display, Retargeting, LinkedIn.

Avoid: hostile/aggressive copy ("crushes the competition"), fake competitor names, brand-mood-only ads (use Brand Awareness), pure problem-solution hook (use Problem→Solution), discount-led layouts (use Offer/Promotion).`,
  },
  {
    id: 'retargeting_reminder',
    name: 'Retargeting Reminder',
    subCategory: 'awareness',
    blurb: 'Bring back interested users',
    previewImage: require('../assets/retargeting_reminder.png'),
    defaultTextDensity: 'medium',
    categoryPrompt: `A retargeting reminder paid ad — for warm audiences who already saw or considered the product. Gentle nudge, not first-touch shouting.

Creative direction:
- Product hero clearly visible, lit cleanly. The viewer already knows it; the visual just re-anchors recognition.
- Reminder-style headline that acknowledges familiarity: "Still thinking about it?" / "Don't lose it." / "Yours, when you're ready." / "Saved for later."
- Light urgency element ONLY if the brief provided real data: "Back in stock." / "Last few left." / "Sale ends Sunday." Never invent.
- Optional small trust signal — review star count or "loved by [N]" — only with real numbers.
- CTA pill is the strongest element: "Shop Now" / "Get Yours" / "Try It".
- Tone: warm and confident, not desperate. The viewer already engaged once.

Text style:
- Headline (8–12% of frame height): reminder-led, not shout-led.
- Subline (small, optional): trust signal, urgency cue, or simple benefit.
- CTA: clear action verb.

If an offer was provided in the brief, integrate it tastefully (small badge or in the subline) — but the headline still leads with reminder energy, not discount energy.

Best on: Meta Retargeting, Google Display retargeting, Email banner.

Avoid: first-touch awareness language (use Brand Awareness), aggressive urgency, fake "last chance" if no time was provided, comparison framing (use Comparison/Switch).`,
  },
  {
    id: 'objection_handling',
    name: 'Objection Handling',
    subCategory: 'persuade',
    blurb: 'Remove a buying hesitation',
    previewImage: require('../assets/objection_handling.png'),
    defaultTextDensity: 'medium',
    categoryPrompt: `An objection-handling paid ad — remove ONE specific buying hesitation. Direct, credible, calmly confident.

Creative direction:
- Headline directly names the objection (often as a question or a quoted hesitation): "Worth the price?" / "Will it fit?" / "Does it really last?" / "Too good to be true?"
- Sub-headline answers it with a concrete reassurance — guarantee, proof, mechanism, or comparison ratio. NOT vague platitudes.
- Product clearly visible, supporting the answer with a relevant detail (e.g. close-up on stitching for "will it last", on the cap seal for "does it work", on the size guide for "will it fit").
- Optional small reassurance row at the bottom: "30-day return" / "Free shipping" / "Made in [place]" — only if real.
- CTA pill: "Try Risk-Free" / "Learn More" / "See Why".
- Tone: direct and credible. The objection is named honestly; the answer is specific.

Common objections by category to mirror: price (premium), fit/size (apparel/footwear), trust/results (skincare/wellness/supplements), durability (tech/hardware), comfort (wearables), taste/smell (food/fragrance), ease of use (apps/tools).

Text style:
- Headline (objection): 5–10 words, often a question.
- Answer line: specific, factual, 6–14 words.
- Optional reassurance row: 3–6 short signals.
- CTA: 1–3 words.

CRITICAL: do not invent guarantees, return windows, or certifications. Use only what the brief provides.

Best on: Meta Feed, Google Display, Retargeting placements.

Avoid: pure benefit listing without a hesitation hook (use Product Benefit), comparison split (use Comparison/Switch), discount-led framing (use Offer/Promotion), brand-mood ads (use Brand Awareness).`,
  },
  {
    id: 'demo_how_it_works',
    name: 'Demo / How-It-Works',
    subCategory: 'native&tech',
    blurb: 'Show how to use the product',
    previewImage: require('../assets/demo_how_it_works.png'),
    defaultTextDensity: 'high',
    categoryPrompt: `A demo / how-it-works paid ad — show the product in action so the value becomes obvious. Either step-by-step or product-in-use.

Creative direction:
- Choose ONE format:
  • 3-PANEL: vertical or horizontal stack, each panel = one step. "01 / 02 / 03" labels with a short action verb caption.
  • SINGLE FRAME: product mid-action with annotated callouts pointing to key features (clean line callouts, NOT cluttered).
  • BEFORE/RESULT: tight 2-zone showing what the product does (mainly for skincare, cleaning, beauty, fitness).
- Each panel/callout shows a CONCRETE moment, not a generic stock action: hand pumping the dispenser, finger swiping the app screen, scrubber cleaning the surface, food being cooked.
- Light reads as instructional — clean, even, every detail legible.
- CTA pill at the bottom: "Try Now" / "See How" / "Get Started".

Text style:
- Title (top): "How it works." / "In 3 steps." / "Watch this."
- Step labels: action verbs, parallel ("Apply / Massage / Reveal" or "Tap / Choose / Done").
- Each step has 3–6 word caption.
- CTA: 1–3 words.

Best on: Meta Feed, TikTok in-feed (vertical 3-panel), Google Display, Pinterest, App-store ads.

Avoid: 4+ steps in one panel (split into a carousel or use 3 only), pure benefit list without action (use Product Benefit), brand-mood ads (use Brand Awareness), discount layouts (use Offer/Promotion), comparison framing (use Comparison/Switch).`,
  },
  {
    id: 'seasonal_occasion',
    name: 'Seasonal / Occasion',
    subCategory: 'native&tech',
    blurb: 'Holiday, gift, event, moment',
    previewImage: require('../assets/seasonal_occasion.png'),
    defaultTextDensity: 'medium',
    categoryPrompt: `A seasonal / occasion-based paid ad — anchor the product to a specific cultural moment. Timeliness drives urgency.

Creative direction:
- Pick ONE clear seasonal / cultural cue and lean into its visual idiom — holiday (red+green for Christmas, gold for Diwali, pastel for Easter), summer (sun, water, beach, golden), winter (warm light, knit textures, breath-on-glass), back-to-school (notebooks, fresh start), wedding (florals, cream + champagne), Mother's/Father's Day (handwritten note, tied ribbon), Valentine's, Black Friday (bold red, urgent type), Pride (rainbow accents — only if brand is genuinely participating).
- Setting / props directly evoke the moment: gift-wrapped product with ribbon for gifting, product on a beach towel for summer, snow-flecked for winter, etc.
- Light tone matches the season — warm gold for autumn/holiday, bright cool for summer, soft warm for winter.
- Optional small "Holiday Edition" / "Summer Drop" / "Gift-ready" tag — only if the brief supports it.
- CTA pill: "Shop the Edit" / "Gift Now" / "Pre-Order".
- For premium brands: subtle seasonal cue (a single ribbon, a sprig, a metallic accent) — not overt holiday clip-art. For mass-market: brighter, more literal seasonal styling.

Text style:
- Headline anchored to the moment: "For your favorite person." / "Summer-ready, all year." / "Made for the season." / "Black Friday, ours."
- Optional date/time qualifier: "Through Dec 31." / "While they last."
- CTA: 1–3 words.

Best on: Meta Feed, Email banner, Google Display, Pinterest (especially gifting moments).

Avoid: generic non-seasonal copy ("Premium product, always" — that's Brand Awareness), discount-led framing without the seasonal anchor (use Offer/Promotion), comparison framing (use Comparison/Switch), problem-solution framing (use Problem→Solution).`,
  },
  {
    id: 'premium_brand_story',
    name: 'Premium Brand Story',
    subCategory: 'awareness',
    blurb: 'Build desire, emotion, brand value',
    previewImage: require('../assets/premium_brand_story.png'),
    defaultTextDensity: 'low',
    categoryPrompt: `A premium brand-story paid ad — desire, emotion, brand equity. Don't sell; seduce. The viewer should feel something and remember the brand, not click a CTA.

Creative direction:
- Cinematic still — shot on the equivalent of an 85mm cine prime at f/2 with painterly bokeh, single hard key light from camera-back, deep shadow, optional subtle haze. The product is the protagonist of a film paused at its most evocative frame.
- Color graded with intent: teal/orange luxury cinema, monochrome charcoal, warm amber, sodium-vapor — pick ONE palette and hold it.
- Restrained typography: a single serif or display sans-serif headline, often in lowercase or small-caps. NO bullets, NO offer chip, NO CTA pill (or at most a single underline-hyperlink-style CTA).
- Surfaces / props: dark walnut, oiled leather, black velvet, weathered concrete, frosted glass, fluted brass. Tactile, expensive-feeling, considered.
- Composition: rule-of-thirds, intentional negative space. Often close-cropped on a single product detail (cap, dial, wrist, lid).
- For fragrance/jewelry/watches/fashion: this is your highest-leverage register. For everyday consumer goods: reach for Brand Awareness instead.

Text style:
- ONE evocative line (3–8 words) that captures emotion or identity, not features: "For the hours that matter." / "Quiet. Unmistakable." / "Made by hand. Worn for life." / "What time has always asked for."
- Optional brand wordmark in a corner, small.
- No bullets, no offer, no CTA pill — at most a thin underlined "Discover" hyperlink-style.

Best on: Meta Feed (premium placements), Pinterest, Website hero banner, YouTube bumper.

Avoid: bullets, discounts, star ratings, comparison framing, "shop now" CTA pills, retail palette (red+yellow), bright catalog lighting (use Product Benefit for that). This category is the OPPOSITE of hard conversion.`,
  },
];

export function getNicheById(id: string): PresetOption | undefined {
  return NICHES.find(niche => niche.id === id);
}

export function getVibeById(id: string): PresetOption | undefined {
  return VIBES.find(vibe => vibe.id === id);
}

export function getProductShootPresetById(
  id: string,
): ProductShootPreset | undefined {
  return PRODUCT_SHOOT_PRESETS.find(preset => preset.id === id);
}

export function getProductShootPresetsBySubCategory(
  subCategory: ProductShootSubCategory,
): ProductShootPreset[] {
  return PRODUCT_SHOOT_PRESETS.filter(preset => preset.subCategory === subCategory);
}

export function getSocialPostPresetById(
  id: string,
): SocialPostPreset | undefined {
  return SOCIAL_POST_PRESETS.find(preset => preset.id === id);
}

export function getSocialPostPresetsBySubCategory(
  subCategory: SocialPostSubCategory,
): SocialPostPreset[] {
  return SOCIAL_POST_PRESETS.filter(preset => preset.subCategory === subCategory);
}

export function getAdsCreativePresetById(
  id: string,
): AdsCreativePreset | undefined {
  return ADS_CREATIVE_PRESETS.find(preset => preset.id === id);
}

export function getAdsCreativePresetsBySubCategory(
  subCategory: AdsCreativeSubCategory,
): AdsCreativePreset[] {
  return ADS_CREATIVE_PRESETS.filter(
    preset => preset.subCategory === subCategory,
  );
}

export function toPresetOptions(presets: PresetOption[]): PresetOptionItem[] {
  return presets.map(preset => ({
    key: preset.id,
    label: preset.label,
  }));
}
