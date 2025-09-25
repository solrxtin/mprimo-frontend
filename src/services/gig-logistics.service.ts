import axios, { AxiosInstance } from 'axios';

interface GigLocation {
  Latitude: number | string;
  Longitude: number | string;
  FormattedAddress?: string;
}

interface ShipmentItem {
  ItemName?: string;
  Description?: string;
  SpecialPackageId?: number;
  Quantity: number;
  Weight?: number;
  IsVolumetric?: boolean;
  Length?: number;
  Width?: number;
  Height?: number;
  ShipmentType: 0 | 1 | 2; // Special: 0, Regular: 1, Ecommerce: 2
  Value: number;
}

interface PriceRequest {
  SenderStationId: number;
  ReceiverStationId: number;
  VehicleType: 0 | 1 | 2 | 3; // Car: 0, Bike: 1, Van: 2, Truck: 3
  ReceiverLocation: GigLocation;
  SenderLocation: GigLocation;
  IsFromAgility: boolean;
  CustomerCode: string;
  CustomerType: 0 | 1 | 2 | 3; // Individual: 0, Corporate: 1, Ecommerce: 2, Partner: 3
  DeliveryOptionIds: number[];
  Value: number;
  PickUpOptions: 0 | 1; // HomeDelivery: 0, ServiceCentre: 1
  ShipmentItems: ShipmentItem[];
}

interface CreateShipmentRequest {
  SenderDetails: {
    SenderLocation: GigLocation;
    SenderName: string;
    SenderPhoneNumber: string;
    SenderStationId: number;
    SenderAddress: string;
    InputtedSenderAddress: string;
    SenderLocality: string;
  };
  ReceiverDetails: {
    ReceiverLocation: GigLocation;
    ReceiverStationId: number;
    ReceiverName: string;
    ReceiverPhoneNumber: string;
    ReceiverAddress: string;
    InputtedReceiverAddress: string;
  };
  ShipmentDetails: {
    VehicleType: 0 | 1 | 2 | 3;
    IsFromAgility: 0 | 1;
    IsBatchPickUp: 0 | 1;
  };
  ShipmentItems: ShipmentItem[];
}

interface DropOffPriceRequest {
  SenderStationId: number;
  ReceiverStationId: number;
  VehicleType: 0 | 1 | 2 | 3;
  CustomerCode: string;
  CustomerType: 0 | 1 | 2 | 3;
  DeliveryOptionIds: number[];
  Value: number;
  PickUpOptions: 0 | 1;
  ShipmentItems: ShipmentItem[];
}

interface DropOffShipmentRequest {
  SenderDetails: {
    SenderName: string;
    SenderPhoneNumber: string;
    SenderStationId: number;
    SenderAddress: string;
  };
  ReceiverDetails: {
    ReceiverStationId: number;
    ReceiverName: string;
    ReceiverPhoneNumber: string;
    ReceiverAddress: string;
  };
  ShipmentDetails: {
    VehicleType: 0 | 1 | 2 | 3;
    IsFromAgility: 0 | 1;
    IsBatchPickUp: 0 | 1;
  };
  ShipmentItems: ShipmentItem[];
}

interface Station {
  StationId: number;
  StationName: string;
  StationCode: string;
  StateId: number;
  StateName: string;
  CountryName: string;
  CountryId: number;
  CountryCode: string;
  CurrencyCode: string;
  CurrencySymbol: string;
}

export class GigLogisticsService {
  private api: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.GIG_LOGISTICS_BASE_URL || 'https://thirdpartynode.theagilitysystems.com',
      timeout: 30000,
    });
  }

  async login(): Promise<void> {
    try {
      const response = await this.api.post('/login', {
        email: process.env.GIG_LOGISTICS_EMAIL,
        password: process.env.GIG_LOGISTICS_PASSWORD,
      });

      this.accessToken = response.data.data['access-token'];
      this.api.defaults.headers.common['access-token'] = this.accessToken;
    } catch (error: any) {
      throw new Error(`GIG Logistics login failed: ${error.response?.data?.message || error.message}`);
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken) {
      await this.login();
    }
  }

  async getShipmentPrice(priceData: PriceRequest) {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.api.post('/price', priceData);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        await this.login();
        const response = await this.api.post('/price', priceData);
        return response.data;
      }
      throw new Error(`Failed to get shipment price: ${error.response?.data?.message || error.message}`);
    }
  }

  async createShipment(shipmentData: CreateShipmentRequest) {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.api.post('/capture/preshipment', shipmentData);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        await this.login();
        const response = await this.api.post('/capture/preshipment', shipmentData);
        return response.data;
      }
      throw new Error(`Failed to create shipment: ${error.response?.data?.message || error.message}`);
    }
  }

  async trackShipment(waybill: string) {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.api.get(`/track/mobileShipment?Waybill=${waybill}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        await this.login();
        const response = await this.api.get(`/track/mobileShipment?Waybill=${waybill}`);
        return response.data;
      }
      throw new Error(`Failed to track shipment: ${error.response?.data?.message || error.message}`);
    }
  }

  async getLocalStations() {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.api.get('/localstations/get');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        await this.login();
        const response = await this.api.get('/localstations/get');
        return response.data;
      }
      throw new Error(`Failed to get local stations: ${error.response?.data?.message || error.message}`);
    }
  }

  
  async getInternationalStations() {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.api.get('/internationalStations/get');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        await this.login();
        const response = await this.api.get('/internationalStations/get');
        return response.data;
      }
      throw new Error(`Failed to get international stations: ${error.response?.data?.message || error.message}`);
    }
  }

  async getServiceCentresByStation(stationId: number) {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.api.get(`/serviceCentresByStation?stationId=${stationId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        await this.login();
        const response = await this.api.get(`/serviceCentresByStation?stationId=${stationId}`);
        return response.data;
      }
      throw new Error(`Failed to get service centres: ${error.response?.data?.message || error.message}`);
    }
  }

  async getDropOffPrice(priceData: DropOffPriceRequest) {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.api.post('/dropOff/price', priceData);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        await this.login();
        const response = await this.api.post('/dropOff/price', priceData);
        return response.data;
      }
      throw new Error(`Failed to get drop-off price: ${error.response?.data?.message || error.message}`);
    }
  }

  async createDropOffShipment(shipmentData: DropOffShipmentRequest) {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.api.post('/create/dropOff', shipmentData);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        await this.login();
        const response = await this.api.post('/create/dropOff', shipmentData);
        return response.data;
      }
      throw new Error(`Failed to create drop-off shipment: ${error.response?.data?.message || error.message}`);
    }
  }

  async isInternationalShipment(senderCountryCode: string, receiverCountryCode: string): Promise<boolean> {
    return senderCountryCode !== receiverCountryCode;
  }

  async determineShipmentType(vendorLocation: { countryCode: string }, buyerLocation: { countryCode: string }) {
    const isInternational = await this.isInternationalShipment(vendorLocation.countryCode, buyerLocation.countryCode);
    
    return {
      isInternational,
      requiresDropOff: isInternational,
      stationType: isInternational ? 'international' : 'local'
    };
  }
}

export default new GigLogisticsService();