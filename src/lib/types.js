// Drink types with an emoji used as a fallback "poster" when no photo exists.
export const TYPES = [
  { name: "Beer", emoji: "🍺" },
  { name: "IPA", emoji: "🍺" },
  { name: "Stout", emoji: "🍺" },
  { name: "Lager", emoji: "🍺" },
  { name: "Cider", emoji: "🍏" },
  { name: "Wine", emoji: "🍷" },
  { name: "Red Wine", emoji: "🍷" },
  { name: "White Wine", emoji: "🥂" },
  { name: "Sparkling", emoji: "🍾" },
  { name: "Whisky", emoji: "🥃" },
  { name: "Whiskey", emoji: "🥃" },
  { name: "Bourbon", emoji: "🥃" },
  { name: "Rum", emoji: "🥃" },
  { name: "Vodka", emoji: "🍸" },
  { name: "Gin", emoji: "🍸" },
  { name: "Tequila", emoji: "🌵" },
  { name: "Mezcal", emoji: "🌵" },
  { name: "Brandy", emoji: "🥃" },
  { name: "Cognac", emoji: "🥃" },
  { name: "Sake", emoji: "🍶" },
  { name: "Soju", emoji: "🍶" },
  { name: "Mead", emoji: "🍯" },
  { name: "Liqueur", emoji: "🍸" },
  { name: "Cocktail", emoji: "🍹" },
  { name: "Other", emoji: "🍹" },
];

const EMOJI = Object.fromEntries(TYPES.map((t) => [t.name, t.emoji]));

export function typeEmoji(type) {
  return EMOJI[type] || "🍹";
}
