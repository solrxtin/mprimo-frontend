import { Request, Response } from 'express';
import gigLogisticsService from '../services/gig-logistics.service';
import { GigLogisticsConstants, formatGigLocation, createShipmentItem } from '../utils/gig-logistics.util';
import Order from '../models/order.model';
import { IShipment } from '../types/order.type';
import mongoose from 'mongoose';

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

export const trackSingleShipment = async (req: Request, res: Response) => {
  try {
    const { orderId, shipmentId } = req.params;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const shipment = order.shipments.find((s: any) => s._id.toString() === shipmentId);
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }

    let trackingData = null;
    if ((shipment as any).shipping.waybill) {
      try {
        const trackingResponse = await gigLogisticsService.trackShipment((shipment as any).shipping.waybill);
        trackingData = trackingResponse.data;
      } catch (error) {
        console.warn('Failed to get tracking data:', error);
      }
    }
    
    res.json({
      success: true,
      shipment,
      trackingData,
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

export const updateShipmentStatus = async (req: Request, res: Response) => {
  try {
    const { orderId, shipmentId } = req.params;
    const { status, trackingNumber, waybill, actualPickup, actualDelivery } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const shipmentIndex = order.shipments.findIndex(
      (s: any) => s._id.toString() === shipmentId
    );

    if (shipmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }

    // Update shipment status
    order.shipments[shipmentIndex].shipping.status = status;
    if (trackingNumber) order.shipments[shipmentIndex].shipping.trackingNumber = trackingNumber;
    if (waybill) order.shipments[shipmentIndex].shipping.waybill = waybill;
    if (actualPickup) order.shipments[shipmentIndex].shipping.actualPickup = new Date(actualPickup);
    if (actualDelivery) order.shipments[shipmentIndex].shipping.actualDelivery = new Date(actualDelivery);

    // Update overall order status based on shipment statuses
    const allShipments = order.shipments;
    const deliveredCount = allShipments.filter((s: any) => s.shipping.status === 'delivered').length;
    const shippedCount = allShipments.filter((s: any) => ['picked_up', 'in_transit', 'out_for_delivery'].includes(s.shipping.status)).length;
    
    if (deliveredCount === allShipments.length) {
      order.status = 'delivered';
    } else if (deliveredCount > 0 || shippedCount > 0) {
      order.status = 'partially_shipped';
    }

    await order.save();

    res.json({
      success: true,
      message: 'Shipment status updated successfully',
      order
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getOrderShipments = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('shipments.vendorId', 'businessInfo')
      .populate('shipments.items.productId', 'name images');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      shipments: order.shipments,
      deliveryCoordination: order.deliveryCoordination,
      message: 'Order shipments retrieved successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const trackOrderShipments = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('shipments.vendorId', 'businessInfo')
      .populate('shipments.items.productId', 'name images');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Get tracking info for each shipment
    const trackingPromises = order.shipments.map(async (shipment: any) => {
      if (shipment.shipping.waybill) {
        try {
          const trackingData = await gigLogisticsService.trackShipment(shipment.shipping.waybill);
          return {
            shipmentId: shipment._id,
            vendorId: shipment.vendorId,
            trackingData: trackingData.data,
            status: shipment.shipping.status,
            estimatedDelivery: shipment.shipping.estimatedDelivery
          };
        } catch (error) {
          return {
            shipmentId: shipment._id,
            vendorId: shipment.vendorId,
            trackingData: null,
            status: shipment.shipping.status,
            estimatedDelivery: shipment.shipping.estimatedDelivery,
            error: 'Tracking data unavailable'
          };
        }
      }
      return {
        shipmentId: shipment._id,
        vendorId: shipment.vendorId,
        trackingData: null,
        status: shipment.shipping.status,
        estimatedDelivery: shipment.shipping.estimatedDelivery
      };
    });

    const trackingResults = await Promise.all(trackingPromises);

    res.json({
      success: true,
      orderId,
      deliveryCoordination: order.deliveryCoordination,
      shipments: trackingResults,
      message: 'Order tracking retrieved successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};