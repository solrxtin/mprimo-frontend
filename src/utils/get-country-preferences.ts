// Helper function to get preferences based on country name
export default function getCountryPreferences(countryName: string): { language: string; currency: string } {
    // Default preferences
    const defaults = { language: "en", currency: "USD" };
    
    // Map of country names to their preferences
    const countryPreferences: Record<string, { language: string; currency: string }> = {
      // North America
      "United States": { language: "en", currency: "USD" },
      "Canada": { language: "en", currency: "CAD" },
      "Mexico": { language: "es", currency: "MXN" },
      
      // Europe
      "United Kingdom": { language: "en", currency: "GBP" },
      "Germany": { language: "de", currency: "EUR" },
      "France": { language: "fr", currency: "EUR" },
      "Spain": { language: "es", currency: "EUR" },
      "Italy": { language: "it", currency: "EUR" },
      "Netherlands": { language: "nl", currency: "EUR" },
      "Belgium": { language: "fr", currency: "EUR" },
      "Switzerland": { language: "de", currency: "CHF" },
      "Sweden": { language: "sv", currency: "SEK" },
      "Norway": { language: "no", currency: "NOK" },
      "Denmark": { language: "da", currency: "DKK" },
      "Finland": { language: "fi", currency: "EUR" },
      "Ireland": { language: "en", currency: "EUR" },
      "Portugal": { language: "pt", currency: "EUR" },
      "Greece": { language: "el", currency: "EUR" },
      "Poland": { language: "pl", currency: "PLN" },
      "Austria": { language: "de", currency: "EUR" },
      "Hungary": { language: "hu", currency: "HUF" },
      "Czech Republic": { language: "cs", currency: "CZK" },
      "Romania": { language: "ro", currency: "RON" },
      "Russia": { language: "ru", currency: "RUB" },
      
      // Asia
      "China": { language: "zh", currency: "CNY" },
      "Japan": { language: "ja", currency: "JPY" },
      "India": { language: "en", currency: "INR" },
      "South Korea": { language: "ko", currency: "KRW" },
      "Indonesia": { language: "id", currency: "IDR" },
      "Malaysia": { language: "ms", currency: "MYR" },
      "Singapore": { language: "en", currency: "SGD" },
      "Thailand": { language: "th", currency: "THB" },
      "Vietnam": { language: "vi", currency: "VND" },
      "Philippines": { language: "en", currency: "PHP" },
      "Pakistan": { language: "en", currency: "PKR" },
      "Bangladesh": { language: "bn", currency: "BDT" },
      
      // Africa
      "Nigeria": { language: "en", currency: "NGN" },
      "South Africa": { language: "en", currency: "ZAR" },
      "Kenya": { language: "en", currency: "KES" },
      "Ghana": { language: "en", currency: "GHS" },
      "Egypt": { language: "ar", currency: "EGP" },
      "Morocco": { language: "ar", currency: "MAD" },
      "Tanzania": { language: "sw", currency: "TZS" },
      "Ethiopia": { language: "am", currency: "ETB" },
      "Uganda": { language: "en", currency: "UGX" },
      
      // South America
      "Brazil": { language: "pt", currency: "BRL" },
      "Argentina": { language: "es", currency: "ARS" },
      "Colombia": { language: "es", currency: "COP" },
      "Chile": { language: "es", currency: "CLP" },
      "Peru": { language: "es", currency: "PEN" },
      "Venezuela": { language: "es", currency: "VES" },
      
      // Oceania
      "Australia": { language: "en", currency: "AUD" },
      "New Zealand": { language: "en", currency: "NZD" },
    };
    
    return countryPreferences[countryName] || defaults;
  }
  