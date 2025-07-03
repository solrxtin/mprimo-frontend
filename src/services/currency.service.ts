import axios from 'axios';
import Country from '../models/country.model';
import { LoggerService } from './logger.service';

const logger = LoggerService.getInstance();

export class CurrencyService {
  private static readonly BASE_CURRENCY = 'USD';
  private static readonly EXCHANGE_API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

  static async updateExchangeRates(): Promise<void> {
    try {
      const response = await axios.get(this.EXCHANGE_API_URL);
      const rates = response.data.rates;

      const countries = await Country.find({ delisted: false });
      
      for (const country of countries) {
        const rate = rates[country.currency] || 1;
        await Country.findByIdAndUpdate(country._id, {
          exchangeRate: rate,
          lastExchangeUpdate: new Date()
        });
      }

      logger.info('Exchange rates updated successfully');
    } catch (error) {
      logger.error('Failed to update exchange rates:', error);
    }
  }

  static async convertPrice(
    amount: number, 
    fromCurrency: string, 
    toCurrency: string
  ): Promise<{ convertedAmount: number; exchangeRate: number }> {
    if (fromCurrency === toCurrency) {
      return { convertedAmount: amount, exchangeRate: 1 };
    }

    const fromCountry = await Country.findOne({ currency: fromCurrency });
    const toCountry = await Country.findOne({ currency: toCurrency });

    if (!fromCountry || !toCountry) {
      throw new Error('Currency not supported');
    }

    // Convert to USD first, then to target currency
    const usdAmount = amount / fromCountry.exchangeRate;
    const convertedAmount = usdAmount * toCountry.exchangeRate;
    const exchangeRate = toCountry.exchangeRate / fromCountry.exchangeRate;

    return { 
      convertedAmount: Math.round(convertedAmount * 100) / 100,
      exchangeRate: Math.round(exchangeRate * 10000) / 10000
    };
  }

  static async getProductPriceForUser(
    productPrice: number,
    productCurrency: string,
    userCurrency: string
  ) {
    const conversion = await this.convertPrice(productPrice, productCurrency, userCurrency);
    const userCountry = await Country.findOne({ currency: userCurrency });
    
    return {
      originalPrice: productPrice,
      originalCurrency: productCurrency,
      displayPrice: conversion.convertedAmount,
      displayCurrency: userCurrency,
      currencySymbol: userCountry?.currencySymbol || userCurrency,
      exchangeRate: conversion.exchangeRate
    };
  }
}

// Update exchange rates every 6 hours
setInterval(() => {
  CurrencyService.updateExchangeRates();
}, 6 * 60 * 60 * 1000);