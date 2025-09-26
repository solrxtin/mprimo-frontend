import { Request, Response } from 'express';
import gigLogisticsService from '../services/gig-logistics.service';
import { GigLogisticsConstants, formatGigLocation, createShipmentItem } from '../utils/gig-logistics.util';

import dotenv from "dotenv";
dotenv.config();

export const getShippingPrice = async (req: Request, res: Response) => {
  try {
    const {
      senderStationId,
      receiverStationId,
      senderLatitude,
      senderLongitude,
      receiverLatitude,
      receiverLongitude,
      items,
      vehicleType = GigLogisticsConstants.VehicleType.BIKE,
      pickupOption = GigLogisticsConstants.PickupOptions.HOME_DELIVERY,
    } = req.body;

    const priceRequest = {
      SenderStationId: senderStationId,
      ReceiverStationId: receiverStationId,
      VehicleType: vehicleType as 0 | 1 | 2 | 3,
      ReceiverLocation: formatGigLocation(receiverLatitude, receiverLongitude),
      SenderLocation: formatGigLocation(senderLatitude, senderLongitude),
      IsFromAgility: false,
      CustomerCode: process.env.GIG_LOGISTICS_CUSTOMER_CODE || 'ECO017121',
      CustomerType: 2 as 0 | 1 | 2 | 3,
      DeliveryOptionIds: pickupOption === 0 
        ? [...GigLogisticsConstants.DeliveryOptions.HOME_DELIVERY] 
        : [...GigLogisticsConstants.DeliveryOptions.SERVICE_CENTRE],
      Value: items.reduce((total: number, item: any) => total + item.value, 0),
      PickUpOptions: pickupOption as 0 | 1,
      ShipmentItems: items.map((item: any) => createShipmentItem(
        item.name,
        item.description,
        item.quantity,
        item.weight,
        item.value
      )),
    };

    const priceResponse = await gigLogisticsService.getShipmentPrice(priceRequest);
    
    res.json({
      success: true,
      data: priceResponse.data,
      message: 'Shipping price calculated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createShipment = async (req: Request, res: Response) => {
  try {
    const {
      senderDetails,
      receiverDetails,
      items,
      vehicleType = GigLogisticsConstants.VehicleType.BIKE,
    } = req.body;

    const shipmentRequest = {
      SenderDetails: {
        SenderLocation: formatGigLocation(
          senderDetails.latitude,
          senderDetails.longitude,
          senderDetails.address
        ),
        SenderName: senderDetails.name,
        SenderPhoneNumber: senderDetails.phoneNumber,
        SenderStationId: senderDetails.stationId,
        SenderAddress: senderDetails.address,
        InputtedSenderAddress: senderDetails.address,
        SenderLocality: senderDetails.locality || senderDetails.address,
      },
      ReceiverDetails: {
        ReceiverLocation: formatGigLocation(
          receiverDetails.latitude,
          receiverDetails.longitude,
          receiverDetails.address
        ),
        ReceiverStationId: receiverDetails.stationId,
        ReceiverName: receiverDetails.name,
        ReceiverPhoneNumber: receiverDetails.phoneNumber,
        ReceiverAddress: receiverDetails.address,
        InputtedReceiverAddress: receiverDetails.address,
      },
      ShipmentDetails: {
        VehicleType: vehicleType as 0 | 1 | 2 | 3,
        IsFromAgility: 0 as 0 | 1,
        IsBatchPickUp: 0 as 0 | 1,
      },
      ShipmentItems: items.map((item: any) => createShipmentItem(
        item.name,
        item.description,
        item.quantity,
        item.weight,
        item.value
      )),
    };

    const shipmentResponse = await gigLogisticsService.createShipment(shipmentRequest);
    
    res.json({
      success: true,
      data: shipmentResponse.data,
      message: 'Shipment created successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const trackShipment = async (req: Request, res: Response) => {
  try {
    const { waybill } = req.params;
    
    const trackingResponse = await gigLogisticsService.trackShipment(waybill);
    
    res.json({
      success: true,
      data: trackingResponse.data,
      message: 'Shipment tracking retrieved successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getLocalStations = async (req: Request, res: Response) => {
  try {
    const stationsResponse = await gigLogisticsService.getLocalStations();
    
    res.json({
      success: true,
      data: stationsResponse.data,
      message: 'Local stations retrieved successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getInternationalStations = async (req: Request, res: Response) => {
  try {
    const stationsResponse = await gigLogisticsService.getInternationalStations();
    
    res.json({
      success: true,
      data: stationsResponse.data,
      message: 'International stations retrieved successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getServiceCentres = async (req: Request, res: Response) => {
  try {
    const { stationId } = req.params;
    const centresResponse = await gigLogisticsService.getServiceCentresByStation(parseInt(stationId));
    
    res.json({
      success: true,
      data: centresResponse.data,
      message: 'Service centres retrieved successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getDropOffPrice = async (req: Request, res: Response) => {
  try {
    const {
      senderStationId,
      receiverStationId,
      items,
      vehicleType = GigLogisticsConstants.VehicleType.BIKE,
      pickupOption = GigLogisticsConstants.PickupOptions.SERVICE_CENTRE,
    } = req.body;

    const priceRequest = {
      SenderStationId: senderStationId,
      ReceiverStationId: receiverStationId,
      VehicleType: vehicleType as 0 | 1 | 2 | 3,
      CustomerCode: process.env.GIG_LOGISTICS_CUSTOMER_CODE || 'ECO017121',
      CustomerType: 2 as 0 | 1 | 2 | 3,
      DeliveryOptionIds: pickupOption === 0 
        ? [...GigLogisticsConstants.DeliveryOptions.HOME_DELIVERY] 
        : [...GigLogisticsConstants.DeliveryOptions.SERVICE_CENTRE],
      Value: items.reduce((total: number, item: any) => total + item.value, 0),
      PickUpOptions: pickupOption as 0 | 1,
      ShipmentItems: items.map((item: any) => createShipmentItem(
        item.name,
        item.description,
        item.quantity,
        item.weight,
        item.value
      )),
    };

    const priceResponse = await gigLogisticsService.getDropOffPrice(priceRequest);
    
    res.json({
      success: true,
      data: priceResponse.data,
      message: 'Drop-off price calculated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createDropOffShipment = async (req: Request, res: Response) => {
  try {
    const {
      senderDetails,
      receiverDetails,
      items,
      vehicleType = GigLogisticsConstants.VehicleType.BIKE,
    } = req.body;

    const shipmentRequest = {
      SenderDetails: {
        SenderName: senderDetails.name,
        SenderPhoneNumber: senderDetails.phoneNumber,
        SenderStationId: senderDetails.stationId,
        SenderAddress: senderDetails.address,
      },
      ReceiverDetails: {
        ReceiverStationId: receiverDetails.stationId,
        ReceiverName: receiverDetails.name,
        ReceiverPhoneNumber: receiverDetails.phoneNumber,
        ReceiverAddress: receiverDetails.address,
      },
      ShipmentDetails: {
        VehicleType: vehicleType as 0 | 1 | 2 | 3,
        IsFromAgility: 0 as 0 | 1,
        IsBatchPickUp: 0 as 0 | 1,
      },
      ShipmentItems: items.map((item: any) => createShipmentItem(
        item.name,
        item.description,
        item.quantity,
        item.weight,
        item.value
      )),
    };

    const shipmentResponse = await gigLogisticsService.createDropOffShipment(shipmentRequest);
    
    res.json({
      success: true,
      data: shipmentResponse.data,
      message: 'Drop-off shipment created successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const determineShipmentType = async (req: Request, res: Response) => {
  try {
    const { vendorLocation, buyerLocation } = req.body;
    
    const shipmentType = await gigLogisticsService.determineShipmentType(
      vendorLocation,
      buyerLocation
    );
    
    res.json({
      success: true,
      data: shipmentType,
      message: 'Shipment type determined successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};