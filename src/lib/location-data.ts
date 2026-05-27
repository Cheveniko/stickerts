export type LocationSeedEntry = {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  flagEmoji: string;
  cities: string[];
};

export type LocationCityOption = {
  countryCode: string;
  countryName: string;
  currency: string;
  currencySymbol: string;
  flagEmoji: string;
  name: string;
  slug: string;
};

const currencyNamesByCode = {
  ARS: "Peso argentino",
  BRL: "Real brasileño",
  CLP: "Peso chileno",
  COP: "Peso colombiano",
  EUR: "Euro",
  MXN: "Peso mexicano",
  PEN: "Sol peruano",
  PYG: "Guaraní paraguayo",
  USD: "Dólar",
  UYU: "Peso uruguayo",
} as const;

export const locationSeed: LocationSeedEntry[] = [
  {
    code: "EC",
    name: "Ecuador",
    currency: "USD",
    currencySymbol: "$",
    flagEmoji: "🇪🇨",
    cities: [
      "Ambato",
      "Azogues",
      "Babahoyo",
      "Cayambe",
      "Chone",
      "Cuenca",
      "Daule",
      "Durán",
      "Esmeraldas",
      "Guaranda",
      "Guayaquil",
      "Huaquillas",
      "Ibarra",
      "La Libertad",
      "Latacunga",
      "Loja",
      "Macas",
      "Machala",
      "Manta",
      "Milagro",
      "Nueva Loja",
      "Otavalo",
      "Pasaje",
      "Playas",
      "Portoviejo",
      "Puerto Ayora",
      "Puerto Baquerizo Moreno",
      "Puerto Francisco de Orellana",
      "Puyo",
      "Quevedo",
      "Quito",
      "Riobamba",
      "Salinas",
      "Santa Elena",
      "Santa Rosa",
      "Santo Domingo",
      "Tena",
      "Tulcán",
      "Zamora",
    ],
  },
  {
    code: "AR",
    name: "Argentina",
    currency: "ARS",
    currencySymbol: "$",
    flagEmoji: "🇦🇷",
    cities: ["Buenos Aires", "Córdoba", "Rosario"],
  },
  {
    code: "BR",
    name: "Brasil",
    currency: "BRL",
    currencySymbol: "R$",
    flagEmoji: "🇧🇷",
    cities: ["Brasília", "Rio de Janeiro", "São Paulo"],
  },
  {
    code: "CL",
    name: "Chile",
    currency: "CLP",
    currencySymbol: "$",
    flagEmoji: "🇨🇱",
    cities: ["Concepción", "Santiago", "Valparaíso"],
  },
  {
    code: "CO",
    name: "Colombia",
    currency: "COP",
    currencySymbol: "$",
    flagEmoji: "🇨🇴",
    cities: ["Barranquilla", "Bogotá", "Cali", "Medellín"],
  },
  {
    code: "ES",
    name: "España",
    currency: "EUR",
    currencySymbol: "€",
    flagEmoji: "🇪🇸",
    cities: ["Barcelona", "Madrid", "Sevilla", "Valencia"],
  },
  {
    code: "MX",
    name: "México",
    currency: "MXN",
    currencySymbol: "$",
    flagEmoji: "🇲🇽",
    cities: ["Ciudad de México", "Guadalajara", "Monterrey"],
  },
  {
    code: "PA",
    name: "Panamá",
    currency: "USD",
    currencySymbol: "$",
    flagEmoji: "🇵🇦",
    cities: ["Ciudad de Panamá", "Colón", "David"],
  },
  {
    code: "PE",
    name: "Perú",
    currency: "PEN",
    currencySymbol: "S/",
    flagEmoji: "🇵🇪",
    cities: ["Arequipa", "Lima", "Trujillo"],
  },
  {
    code: "PY",
    name: "Paraguay",
    currency: "PYG",
    currencySymbol: "₲",
    flagEmoji: "🇵🇾",
    cities: ["Asunción", "Ciudad del Este", "Encarnación"],
  },
  {
    code: "US",
    name: "Estados Unidos",
    currency: "USD",
    currencySymbol: "$",
    flagEmoji: "🇺🇸",
    cities: [
      "Atlanta",
      "Austin",
      "Boston",
      "Charlotte",
      "Chicago",
      "Dallas",
      "Denver",
      "Fort Lauderdale",
      "Houston",
      "Las Vegas",
      "Los Angeles",
      "Miami",
      "New York",
      "Newark",
      "Orlando",
      "Philadelphia",
      "Phoenix",
      "San Antonio",
      "San Diego",
      "San Francisco",
      "San Jose",
      "Seattle",
      "Tampa",
      "Washington",
    ],
  },
  {
    code: "UY",
    name: "Uruguay",
    currency: "UYU",
    currencySymbol: "$",
    flagEmoji: "🇺🇾",
    cities: ["Montevideo", "Punta del Este", "Salto"],
  },
];

export function toLocationSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const COUNTRIES = locationSeed.map(
  ({ code, name, flagEmoji, currency }) => ({
    code,
    name,
    flagEmoji,
    currency,
  }),
);

export const CURRENCIES = Array.from(
  new Map(
    locationSeed.map(({ currency, currencySymbol }) => [
      currency,
      {
        code: currency,
        symbol: currencySymbol,
        name:
          currencyNamesByCode[currency as keyof typeof currencyNamesByCode] ??
          currency,
      },
    ]),
  ).values(),
);

export const CITIES_BY_COUNTRY_CODE = Object.fromEntries(
  locationSeed.map((country) => [
    country.code,
    country.cities.map<LocationCityOption>((cityName) => ({
      countryCode: country.code,
      countryName: country.name,
      currency: country.currency,
      currencySymbol: country.currencySymbol,
      flagEmoji: country.flagEmoji,
      name: cityName,
      slug: toLocationSlug(cityName),
    })),
  ]),
) as Record<string, LocationCityOption[]>;
