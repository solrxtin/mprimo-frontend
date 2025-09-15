export const GigLogisticsConstants = {
  VehicleType: {
    CAR: 0,
    BIKE: 1,
    VAN: 2,
    TRUCK: 3,
  },
  
  ShipmentType: {
    SPECIAL: 0,
    REGULAR: 1,
    ECOMMERCE: 2,
  },
  
  CustomerType: {
    INDIVIDUAL: 0,
    CORPORATE: 1,
    ECOMMERCE: 2,
    PARTNER: 3,
  },
  
  PickupOptions: {
    HOME_DELIVERY: 0,
    SERVICE_CENTRE: 1,
  },
  
  DeliveryOptions: {
    HOME_DELIVERY: [2],
    SERVICE_CENTRE: [11],
  },
} as const;

export const formatGigLocation = (latitude: number, longitude: number, address?: string) => ({
  Latitude: latitude,
  Longitude: longitude,
  ...(address && { FormattedAddress: address }),
});

export const createShipmentItem = (
  itemName: string,
  description: string,
  quantity: number,
  weight: number,
  value: number,
  shipmentType: 0 | 1 | 2 = GigLogisticsConstants.ShipmentType.ECOMMERCE as 0 | 1 | 2
) => ({
  ItemName: itemName,
  Description: description,
  Quantity: quantity,
  Weight: weight,
  Value: value,
  ShipmentType: shipmentType,
  IsVolumetric: false,
  Length: 0,
  Width: 0,
  Height: 0,
});

export const findNearestStation = (stations: any[], latitude: number, longitude: number) => {
  if (!stations.length) return null;
  
  let nearest = stations[0];
  let minDistance = Infinity;
  
  stations.forEach(station => {
    if (station.Latitude && station.Longitude) {
      const distance = Math.sqrt(
        Math.pow(latitude - parseFloat(station.Latitude), 2) + 
        Math.pow(longitude - parseFloat(station.Longitude), 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = station;
      }
    }
  });
  
  return nearest;
};

export const getCountryCodeFromLocation = (countryName: string): string => {
  const countryMap: { [key: string]: string } = {
    'NIGERIA': 'NG',
    'GHANA': 'GH',
    'KENYA': 'KE',
    'SOUTH AFRICA': 'ZA',
    'UNITED STATES': 'US',
    'UNITED KINGDOM': 'GB',
  };
  
  return countryMap[countryName.toUpperCase()] || countryName;
};