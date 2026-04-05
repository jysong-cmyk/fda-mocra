/**
 * FDA Cosmetic Product Categories and Codes (primary, secondary, tertiary)
 * Source: https://www.fda.gov/cosmetics/registration-listing-cosmetic-product-facilities-and-products/cosmetic-product-categories-and-codes
 * option value === label (exact FDA text) for RPA / state sync
 */

export type FdaCategoryL3 = { value: string; label: string };
export type FdaCategoryL2 = { value: string; label: string; children: FdaCategoryL3[] };
export type FdaCategoryL1 = { value: string; label: string; children: FdaCategoryL2[] };

const NA: FdaCategoryL3[] = [
  { value: "Not applicable", label: "Not applicable" },
];

const leaveOnRinseOff: FdaCategoryL3[] = [
  { value: "1. Leave-on.", label: "1. Leave-on." },
  { value: "2. Rinse-off.", label: "2. Rinse-off." },
];

const foundationsTertiary: FdaCategoryL3[] = [
  { value: "1. Traditional applications.", label: "1. Traditional applications." },
  { value: "2. Airbrush applications.", label: "2. Airbrush applications." },
];

const indoorTanningTertiary: FdaCategoryL3[] = [
  {
    value: "1. Traditional applications (creams, lotions, etc.).",
    label: "1. Traditional applications (creams, lotions, etc.).",
  },
  { value: "2. Airbrush applications.", label: "2. Airbrush applications." },
  { value: "3. Spray applications.", label: "3. Spray applications." },
  {
    value: "4. Professional airbrush tanning applications.",
    label: "4. Professional airbrush tanning applications.",
  },
  {
    value: "5. Professional spray tanning applications.",
    label: "5. Professional spray tanning applications.",
  },
];

const deodorantUnderarmTertiary: FdaCategoryL3[] = [
  {
    value: "1. Sticks, roll-ons, gels, creams, and wipes.",
    label: "1. Sticks, roll-ons, gels, creams, and wipes.",
  },
  { value: "2. Sprays.", label: "2. Sprays." },
];

export const fdaCategories: FdaCategoryL1[] = [
  {
    value: "(01) Baby products.",
    label: "(01) Baby products.",
    children: [
      {
        value: "(a) Baby shampoos.",
        label: "(a) Baby shampoos.",
        children: leaveOnRinseOff,
      },
      {
        value: "(b) Lotions, oils, powders, and creams.",
        label: "(b) Lotions, oils, powders, and creams.",
        children: leaveOnRinseOff,
      },
      {
        value: "(c) Baby wipes.",
        label: "(c) Baby wipes.",
        children: leaveOnRinseOff,
      },
      {
        value: "(d) Other baby products.",
        label: "(d) Other baby products.",
        children: leaveOnRinseOff,
      },
    ],
  },
  {
    value: "(02) Bath preparations.",
    label: "(02) Bath preparations.",
    children: [
      {
        value: "(a) Bath oils, tablets, and salts.",
        label: "(a) Bath oils, tablets, and salts.",
        children: NA,
      },
      {
        value: "(b) Bubble baths.",
        label: "(b) Bubble baths.",
        children: NA,
      },
      {
        value: "(c) Bath capsules.",
        label: "(c) Bath capsules.",
        children: NA,
      },
      {
        value: "(d) Other bath preparations.",
        label: "(d) Other bath preparations.",
        children: NA,
      },
    ],
  },
  {
    value:
      "(03) Eye makeup preparations (other than children's eye makeup preparations).",
    label:
      "(03) Eye makeup preparations (other than children's eye makeup preparations).",
    children: [
      {
        value: "(a) Eyebrow pencils.",
        label: "(a) Eyebrow pencils.",
        children: NA,
      },
      { value: "(b) Eyeliners.", label: "(b) Eyeliners.", children: NA },
      { value: "(c) Eye shadows.", label: "(c) Eye shadows.", children: NA },
      { value: "(d) Eye lotions.", label: "(d) Eye lotions.", children: NA },
      {
        value: "(e) Eye makeup removers.",
        label: "(e) Eye makeup removers.",
        children: NA,
      },
      { value: "(f) False eyelashes.", label: "(f) False eyelashes.", children: NA },
      { value: "(g) Mascaras.", label: "(g) Mascaras.", children: NA },
      {
        value:
          "(h) Eyelash and eyebrow adhesives, glues, and sealants.",
        label:
          "(h) Eyelash and eyebrow adhesives, glues, and sealants.",
        children: NA,
      },
      {
        value:
          "(i) Eyelash and eyebrow preparations (primers, conditioners, serums, fortifiers).",
        label:
          "(i) Eyelash and eyebrow preparations (primers, conditioners, serums, fortifiers).",
        children: NA,
      },
      {
        value: "(j) Eyelash cleansers.",
        label: "(j) Eyelash cleansers.",
        children: NA,
      },
      {
        value: "(k) Other eye makeup preparations.",
        label: "(k) Other eye makeup preparations.",
        children: NA,
      },
    ],
  },
  {
    value: "(04) Children's eye makeup preparations.",
    label: "(04) Children's eye makeup preparations.",
    children: [
      {
        value: "(a) Children's eyeshadows.",
        label: "(a) Children's eyeshadows.",
        children: NA,
      },
      {
        value: "(b) Other children's eye makeup.",
        label: "(b) Other children's eye makeup.",
        children: NA,
      },
    ],
  },
  {
    value: "(05) Fragrance preparations.",
    label: "(05) Fragrance preparations.",
    children: [
      {
        value: "(a) Colognes and toilet waters.",
        label: "(a) Colognes and toilet waters.",
        children: NA,
      },
      { value: "(b) Perfumes.", label: "(b) Perfumes.", children: NA },
      {
        value:
          "(c) Powders (dusting and talcum) (excluding aftershave talc).",
        label:
          "(c) Powders (dusting and talcum) (excluding aftershave talc).",
        children: NA,
      },
      {
        value: "(d) Other fragrance preparations.",
        label: "(d) Other fragrance preparations.",
        children: NA,
      },
    ],
  },
  {
    value: "(06) Hair preparations (non-coloring).",
    label: "(06) Hair preparations (non-coloring).",
    children: [
      {
        value: "(a) Hair conditioners.",
        label: "(a) Hair conditioners.",
        children: leaveOnRinseOff,
      },
      {
        value: "(b) Hair sprays (aerosol fixatives).",
        label: "(b) Hair sprays (aerosol fixatives).",
        children: NA,
      },
      {
        value: "(c) Hair straighteners.",
        label: "(c) Hair straighteners.",
        children: NA,
      },
      {
        value: "(d) Permanent waves.",
        label: "(d) Permanent waves.",
        children: NA,
      },
      {
        value: "(e) Rinses (non-coloring).",
        label: "(e) Rinses (non-coloring).",
        children: NA,
      },
      {
        value: "(f) Shampoos (non-coloring).",
        label: "(f) Shampoos (non-coloring).",
        children: leaveOnRinseOff,
      },
      {
        value: "(g) Tonics, dressings, and other hair grooming aids.",
        label: "(g) Tonics, dressings, and other hair grooming aids.",
        children: NA,
      },
      { value: "(h) Wave sets.", label: "(h) Wave sets.", children: NA },
      {
        value: "(i) Other hair preparations.",
        label: "(i) Other hair preparations.",
        children: leaveOnRinseOff,
      },
    ],
  },
  {
    value: "(07) Hair coloring preparations.",
    label: "(07) Hair coloring preparations.",
    children: [
      {
        value:
          "(a) Hair dyes and colors (all types requiring caution statement and patch test).",
        label:
          "(a) Hair dyes and colors (all types requiring caution statement and patch test).",
        children: NA,
      },
      { value: "(b) Hair tints.", label: "(b) Hair tints.", children: NA },
      {
        value: "(c) Hair rinses (coloring).",
        label: "(c) Hair rinses (coloring).",
        children: leaveOnRinseOff,
      },
      {
        value: "(d) Hair shampoos (coloring).",
        label: "(d) Hair shampoos (coloring).",
        children: leaveOnRinseOff,
      },
      {
        value: "(e) Hair color sprays (aerosol).",
        label: "(e) Hair color sprays (aerosol).",
        children: NA,
      },
      {
        value: "(f) Hair lighteners with color.",
        label: "(f) Hair lighteners with color.",
        children: NA,
      },
      { value: "(g) Hair bleaches.", label: "(g) Hair bleaches.", children: NA },
      {
        value: "(h) Eyelash and eyebrow dyes.",
        label: "(h) Eyelash and eyebrow dyes.",
        children: NA,
      },
      {
        value: "(i) Other hair coloring preparations.",
        label: "(i) Other hair coloring preparations.",
        children: leaveOnRinseOff,
      },
    ],
  },
  {
    value:
      "(08) Makeup preparations (not eye)(other than makeup preparations for children).",
    label:
      "(08) Makeup preparations (not eye)(other than makeup preparations for children).",
    children: [
      {
        value: "(a) Blushers and rouges (all types).",
        label: "(a) Blushers and rouges (all types).",
        children: NA,
      },
      { value: "(b) Face powders.", label: "(b) Face powders.", children: NA },
      {
        value: "(c) Foundations.",
        label: "(c) Foundations.",
        children: foundationsTertiary,
      },
      {
        value: "(d) Leg and body paints.",
        label: "(d) Leg and body paints.",
        children: foundationsTertiary,
      },
      {
        value: "(e) Lipsticks and lip glosses.",
        label: "(e) Lipsticks and lip glosses.",
        children: NA,
      },
      {
        value: "(f) Makeup bases.",
        label: "(f) Makeup bases.",
        children: foundationsTertiary,
      },
      {
        value: "(g) Makeup fixatives.",
        label: "(g) Makeup fixatives.",
        children: NA,
      },
      {
        value: "(h) Other makeup preparations.",
        label: "(h) Other makeup preparations.",
        children: foundationsTertiary,
      },
    ],
  },
  {
    value: "(09) Makeup preparations for children (not eye).",
    label: "(09) Makeup preparations for children (not eye).",
    children: [
      {
        value: "(a) Children's blushers and rouges (all types).",
        label: "(a) Children's blushers and rouges (all types).",
        children: NA,
      },
      {
        value: "(b) Children's face paints.",
        label: "(b) Children's face paints.",
        children: NA,
      },
      {
        value: "(c) Children's face powders.",
        label: "(c) Children's face powders.",
        children: NA,
      },
      {
        value: "(d) Children's foundations.",
        label: "(d) Children's foundations.",
        children: NA,
      },
      {
        value: "(e) Children's lipsticks and lip glosses.",
        label: "(e) Children's lipsticks and lip glosses.",
        children: NA,
      },
      {
        value: "(f) Children's color hairsprays.",
        label: "(f) Children's color hairsprays.",
        children: NA,
      },
      {
        value: "(g) Other children's makeup.",
        label: "(g) Other children's makeup.",
        children: NA,
      },
    ],
  },
  {
    value: "(10) Manicuring preparations.",
    label: "(10) Manicuring preparations.",
    children: [
      {
        value: "(a) Basecoats and undercoats.",
        label: "(a) Basecoats and undercoats.",
        children: NA,
      },
      {
        value: "(b) Cuticle softeners.",
        label: "(b) Cuticle softeners.",
        children: NA,
      },
      {
        value: "(c) Nail creams and lotions.",
        label: "(c) Nail creams and lotions.",
        children: NA,
      },
      {
        value: "(d) Nail extenders.",
        label: "(d) Nail extenders.",
        children: NA,
      },
      {
        value: "(e) Nail polishes and enamels.",
        label: "(e) Nail polishes and enamels.",
        children: NA,
      },
      {
        value: "(f) Nail polish and enamel removers.",
        label: "(f) Nail polish and enamel removers.",
        children: NA,
      },
      {
        value: "(g) Other manicuring preparations.",
        label: "(g) Other manicuring preparations.",
        children: NA,
      },
    ],
  },
  {
    value: "(11) Oral products.",
    label: "(11) Oral products.",
    children: [
      {
        value: "(a) Dentifrices (aerosols, liquids, pastes, and powders).",
        label: "(a) Dentifrices (aerosols, liquids, pastes, and powders).",
        children: NA,
      },
      {
        value: "(b) Mouthwashes and breath fresheners (liquids and sprays).",
        label: "(b) Mouthwashes and breath fresheners (liquids and sprays).",
        children: NA,
      },
      {
        value: "(c) Other oral products.",
        label: "(c) Other oral products.",
        children: NA,
      },
    ],
  },
  {
    value: "(12) Personal cleanliness.",
    label: "(12) Personal cleanliness.",
    children: [
      {
        value: "(a) Bath soaps and body washes.",
        label: "(a) Bath soaps and body washes.",
        children: NA,
      },
      {
        value: "(b) Deodorants (underarm).",
        label: "(b) Deodorants (underarm).",
        children: deodorantUnderarmTertiary,
      },
      { value: "(c) Douches.", label: "(c) Douches.", children: NA },
      {
        value: "(d) Feminine deodorants.",
        label: "(d) Feminine deodorants.",
        children: leaveOnRinseOff,
      },
      {
        value: "(e) Disposable wipes.",
        label: "(e) Disposable wipes.",
        children: NA,
      },
      {
        value: "(f) Other personal cleanliness products.",
        label: "(f) Other personal cleanliness products.",
        children: leaveOnRinseOff,
      },
    ],
  },
  {
    value: "(13) Shaving preparations.",
    label: "(13) Shaving preparations.",
    children: [
      {
        value: "(a) Aftershave lotions.",
        label: "(a) Aftershave lotions.",
        children: NA,
      },
      {
        value: "(b) Beard softeners.",
        label: "(b) Beard softeners.",
        children: NA,
      },
      { value: "(c) Men's talcum.", label: "(c) Men's talcum.", children: NA },
      {
        value: "(d) Pre-shave lotions (all types).",
        label: "(d) Pre-shave lotions (all types).",
        children: NA,
      },
      {
        value: "(e) Shaving creams (aerosol, brushless, and lather).",
        label: "(e) Shaving creams (aerosol, brushless, and lather).",
        children: NA,
      },
      {
        value: "(f) Shaving soaps (cakes, sticks, etc.).",
        label: "(f) Shaving soaps (cakes, sticks, etc.).",
        children: NA,
      },
      {
        value: "(g) Other shaving preparation products.",
        label: "(g) Other shaving preparation products.",
        children: NA,
      },
    ],
  },
  {
    value:
      "(14) Skin care preparations, (creams, lotions, powder, and sprays).",
    label:
      "(14) Skin care preparations, (creams, lotions, powder, and sprays).",
    children: [
      {
        value:
          "(a) Cleansing (cold creams, cleansing lotions, liquids, and pads).",
        label:
          "(a) Cleansing (cold creams, cleansing lotions, liquids, and pads).",
        children: NA,
      },
      { value: "(b) Depilatories.", label: "(b) Depilatories.", children: NA },
      {
        value: "(c) Face and neck (excluding shaving preparations).",
        label: "(c) Face and neck (excluding shaving preparations).",
        children: leaveOnRinseOff,
      },
      {
        value: "(d) Body and hand (excluding shaving preparations).",
        label: "(d) Body and hand (excluding shaving preparations).",
        children: leaveOnRinseOff,
      },
      {
        value: "(e) Foot powders and sprays.",
        label: "(e) Foot powders and sprays.",
        children: NA,
      },
      { value: "(f) Moisturizing.", label: "(f) Moisturizing.", children: NA },
      { value: "(g) Night.", label: "(g) Night.", children: NA },
      {
        value: "(h) Paste masks (mud packs).",
        label: "(h) Paste masks (mud packs).",
        children: NA,
      },
      {
        value: "(i) Skin fresheners.",
        label: "(i) Skin fresheners.",
        children: NA,
      },
      {
        value: "(j) Other skin care preparations.",
        label: "(j) Other skin care preparations.",
        children: leaveOnRinseOff,
      },
    ],
  },
  {
    value: "(15) Suntan preparations.",
    label: "(15) Suntan preparations.",
    children: [
      {
        value: "(a) Suntan gels, creams, and liquids.",
        label: "(a) Suntan gels, creams, and liquids.",
        children: NA,
      },
      {
        value: "(b) Indoor tanning preparations.",
        label: "(b) Indoor tanning preparations.",
        children: indoorTanningTertiary,
      },
      {
        value: "(c) Other suntan preparations.",
        label: "(c) Other suntan preparations.",
        children: NA,
      },
    ],
  },
  {
    value: "(16) Tattoo preparations.",
    label: "(16) Tattoo preparations.",
    children: [
      {
        value: "(a) Permanent tattoo inks.",
        label: "(a) Permanent tattoo inks.",
        children: NA,
      },
      {
        value: "(b) Temporary tattoo inks.",
        label: "(b) Temporary tattoo inks.",
        children: NA,
      },
      {
        value: "(c) Other tattoo preparations.",
        label: "(c) Other tattoo preparations.",
        children: NA,
      },
    ],
  },
  {
    value:
      "(17) Other preparations (i.e., those preparations that do not fit another category)",
    label:
      "(17) Other preparations (i.e., those preparations that do not fit another category)",
    children: [
      {
        value:
          "(17) Other preparations (i.e., those preparations that do not fit another category)",
        label:
          "(17) Other preparations (i.e., those preparations that do not fit another category)",
        children: NA,
      },
    ],
  },
];

/** 유효한 (대분류·중분류·소분류) 조합 — select value와 동일 */
export type FdaCategoryPath = {
  category1: string;
  category2: string;
  category3: string;
};

export function getFdaCategoryPaths(): FdaCategoryPath[] {
  const paths: FdaCategoryPath[] = [];
  for (const l1 of fdaCategories) {
    for (const l2 of l1.children) {
      for (const l3 of l2.children) {
        paths.push({
          category1: l1.value,
          category2: l2.value,
          category3: l3.value,
        });
      }
    }
  }
  return paths;
}
