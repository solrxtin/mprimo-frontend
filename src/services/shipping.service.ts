import gigLogisticsService from './gig-logistics.service';
import { GigLogisticsConstants, createShipmentItem, findNearestStation, getCountryCodeFromLocation } from '../utils/gig-logistics.util';

interface OrderShippingData {
  vendorLocation: {
    latitude: number;
    longitude: number;
    address: string;
    country: string;
    stationId?: number;
  };
  buyerLocation: {
    latitude: number;
    longitude: number;
    address: string;
    country: string;
    stationId?: number;
  };
  items: Array<{
    name: string;
    description: string;
    quantity: number;
    weight: number;
    value: number;
  }>;
  vendorDetails: {
    name: string;
    phoneNumber: string;
  };
  buyerDetails: {
    name: string;
    phoneNumber: string;
  };
}

export class ShippingService {
  async calculateShippingCost(orderData: OrderShippingData) {
    try {
      // Determine if international shipment
      const vendorCountryCode = getCountryCodeFromLocation(orderData.vendorLocation.country);
      const buyerCountryCode = getCountryCodeFromLocation(orderData.buyerLocation.country);
      const isInternational = vendorCountryCode !== buyerCountryCode;

      // Get appropriate stations
      const stations = isInternational 
        ? await gigLogisticsService.getInternationalStations()
        : await gigLogisticsService.getLocalStations();

      // Find nearest stations if not provided
      const senderStationId = orderData.vendorLocation.stationId || 
        findNearestStation(stations.data, orderData.vendorLocation.latitude, orderData.vendorLocation.longitude)?.StationId;
      
      const receiverStationId = orderData.buyerLocation.stationId || 
        findNearestStation(stations.data, orderData.buyerLocation.latitude, orderData.buyerLocation.longitude)?.StationId;

      if (!senderStationId || !receiverStationId) {
        throw new Error('Unable to find suitable stations for shipping');
      }

      // For international shipments, use drop-off pricing
      if (isInternational) {
        const priceRequest = {
          SenderStationId: senderStationId,
          ReceiverStationId: receiverStationId,
          VehicleType: 1 as 0 | 1 | 2 | 3,
          CustomerCode: process.env.GIG_LOGISTICS_CUSTOMER_CODE || 'ECO017121',
          CustomerType: 2 as 0 | 1 | 2 | 3,
          DeliveryOptionIds: [...GigLogisticsConstants.DeliveryOptions.SERVICE_CENTRE],
          Value: orderData.items.reduce((total, item) => total + item.value, 0),
          PickUpOptions: 1 as 0 | 1,
          ShipmentItems: orderData.items.map(item => createShipmentItem(
            item.name,
            item.description,
            item.quantity,
            item.weight,
            item.value
          )),
        };

        return await gigLogisticsService.getDropOffPrice(priceRequest);
      } else {
        // Local shipment pricing
        const priceRequest = {
          SenderStationId: senderStationId,
          ReceiverStationId: receiverStationId,
          VehicleType: 1 as 0 | 1 | 2 | 3,
          ReceiverLocation: {
            Latitude: orderData.buyerLocation.latitude,
            Longitude: orderData.buyerLocation.longitude,
          },
          SenderLocation: {
            Latitude: orderData.vendorLocation.latitude,
            Longitude: orderData.vendorLocation.longitude,
          },
          IsFromAgility: false,
          CustomerCode: process.env.GIG_LOGISTICS_CUSTOMER_CODE || 'ECO017121',
          CustomerType: 2 as 0 | 1 | 2 | 3,
          DeliveryOptionIds: [...GigLogisticsConstants.DeliveryOptions.HOME_DELIVERY],
          Value: orderData.items.reduce((total, item) => total + item.value, 0),
          PickUpOptions: 0 as 0 | 1,
          ShipmentItems: orderData.items.map(item => createShipmentItem(
            item.name,
            item.description,
            item.quantity,
            item.weight,
            item.value
          )),
        };

        return await gigLogisticsService.getShipmentPrice(priceRequest);
      }
    } catch (error: any) {
      throw new Error(`Failed to calculate shipping cost: ${error.message}`);
    }
  }

  async createShipment(orderData: OrderShippingData) {
    try {
      // Determine if international shipment
      const vendorCountryCode = getCountryCodeFromLocation(orderData.vendorLocation.country);
      const buyerCountryCode = getCountryCodeFromLocation(orderData.buyerLocation.country);
      const isInternational = vendorCountryCode !== buyerCountryCode;

      // Get appropriate stations
      const stations = isInternational 
        ? await gigLogisticsService.getInternationalStations()
        : await gigLogisticsService.getLocalStations();

      // Find nearest stations if not provided
      const senderStationId = orderData.vendorLocation.stationId || 
        findNearestStation(stations.data, orderData.vendorLocation.latitude, orderData.vendorLocation.longitude)?.StationId;
      
      const receiverStationId = orderData.buyerLocation.stationId || 
        findNearestStation(stations.data, orderData.buyerLocation.latitude, orderData.buyerLocation.longitude)?.StationId;

      if (!senderStationId || !receiverStationId) {
        throw new Error('Unable to find suitable stations for shipping');
      }

      // For international shipments, use drop-off shipment creation
      if (isInternational) {
        const shipmentRequest = {
          SenderDetails: {
            SenderName: orderData.vendorDetails.name,
            SenderPhoneNumber: orderData.vendorDetails.phoneNumber,
            SenderStationId: senderStationId,
            SenderAddress: orderData.vendorLocation.address,
          },
          ReceiverDetails: {
            ReceiverStationId: receiverStationId,
            ReceiverName: orderData.buyerDetails.name,
            ReceiverPhoneNumber: orderData.buyerDetails.phoneNumber,
            ReceiverAddress: orderData.buyerLocation.address,
          },
          ShipmentDetails: {
            VehicleType: 1 as 0 | 1 | 2 | 3,
            IsFromAgility: 0 as 0 | 1,
            IsBatchPickUp: 0 as 0 | 1,
          },
          ShipmentItems: orderData.items.map(item => createShipmentItem(
            item.name,
            item.description,
            item.quantity,
            item.weight,
            item.value
          )),
        };

        return await gigLogisticsService.createDropOffShipment(shipmentRequest);
      } else {
        // Local shipment creation
        const shipmentRequest = {
          SenderDetails: {
            SenderLocation: {
              Latitude: orderData.vendorLocation.latitude,
              Longitude: orderData.vendorLocation.longitude,
            },
            SenderName: orderData.vendorDetails.name,
            SenderPhoneNumber: orderData.vendorDetails.phoneNumber,
            SenderStationId: senderStationId,
            SenderAddress: orderData.vendorLocation.address,
            InputtedSenderAddress: orderData.vendorLocation.address,
            SenderLocality: orderData.vendorLocation.address,
          },
          ReceiverDetails: {
            ReceiverLocation: {
              Latitude: orderData.buyerLocation.latitude,
              Longitude: orderData.buyerLocation.longitude,
              FormattedAddress: orderData.buyerLocation.address,
            },
            ReceiverStationId: receiverStationId,
            ReceiverName: orderData.buyerDetails.name,
            ReceiverPhoneNumber: orderData.buyerDetails.phoneNumber,
            ReceiverAddress: orderData.buyerLocation.address,
            InputtedReceiverAddress: orderData.buyerLocation.address,
          },
          ShipmentDetails: {
            VehicleType: 1 as 0 | 1 | 2 | 3,
            IsFromAgility: 0 as 0 | 1,
            IsBatchPickUp: 0 as 0 | 1,
          },
          ShipmentItems: orderData.items.map(item => createShipmentItem(
            item.name,
            item.description,
            item.quantity,
            item.weight,
            item.value
          )),
        };

        return await gigLogisticsService.createShipment(shipmentRequest);
      }
    } catch (error: any) {
      throw new Error(`Failed to create shipment: ${error.message}`);
    }
  }

  async trackShipment(waybill: string) {
    return await gigLogisticsService.trackShipment(waybill);
  }

  async getEstimatedDeliveryDate(orderData: OrderShippingData): Promise<Date> {
    try {
      const vendorCountryCode = getCountryCodeFromLocation(orderData.vendorLocation.country);
      const buyerCountryCode = getCountryCodeFromLocation(orderData.buyerLocation.country);
      const isInternational = vendorCountryCode !== buyerCountryCode;

      // Estimate delivery times (in days)
      const deliveryDays = isInternational ? 7 : 3; // 7 days for international, 3 for local
      
      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + deliveryDays);
      
      return estimatedDate;
    } catch (error) {
      // Default to 5 days if calculation fails
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 5);
      return defaultDate;
    }
  }
}

export default new ShippingService();