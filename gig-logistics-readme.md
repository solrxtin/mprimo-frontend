   GIGL Thirdparty API Documentation (v2.0)
Overview
This document provides detailed instructions on how to integrate with the Agility Systems Third Party API. The API allows for the creation and management of shipments.
Note: The swagger Documentation can be found by adding “/docs” to the base
urls


 
Base URLs
 

https://thirdpartynode.theagilitysystems.com/ https://dev-thirdpartynode.theagilitysystems.com/
 

   Authentication
All endpoints require an API key passed via the Header. Example:
access-token: YOUR_API_KEY
   API Key Authentication
Retrieve the access token and user information.
Request Example: POST /login
{
"email": "iehioze@yahoo.com", "password": "A1s2d3f@"
}
Response Example:
{
"message": "Success",
"apiId": "d98cd17d-fac5-476b-81d5-5a24288d279b", "status": 200,
"data": {
"_id": "67adefb70a527d714a79b5c2",
"Id":  "949c9c99-5dd7-4db1-8980-1cbb3fa8fc99",
 
"FirstName": "Ehiss", "LastName": "Iweka", "Gender": 0,
"Designation": "Ecommerce", "Department": "Ecommerce", "PictureUrl": "https://s3.ap-south-
1.amazonaws.com/s3.zimblecode.com/GIGL/202108/1628936613188_Screenshot 2021-08-14 at 11.22.26.png",
"IsActive": true,
"Organisation": "Hizzo International", "Status": 0,
"UserType": 0, "IsDeleted": false,
"SystemUserId": "034f14e0-bbc0-432a-b550-f1e1cabde70c", "SystemUserRole": "ThirdPartyCustomers",
"Email": "iehioze@yahoo.com", "EmailConfirmed": false, "PhoneNumber": "+2348039322440",
"PhoneNumberConfirmed": false, "UserName": "iehioze@yahoo.com", "UserChannelCode": "IND298636", "UserChannelPassword": "loving", "UserChannelType": 2,
"UserActiveCountryId": 1, "AppType": null, "IsMagaya": false, "IsInternational": true, "CountryType": "NIGERIA", "Claim":
"Create.ThirdParty,Delete.ThirdParty,Update.ThirdParty,View.ThirdParty,Public:Public", "access-token":
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiI5NDljOWM5OS01ZGQ3LTRkYjEtODk4M C0xY2JiM2ZhOGZjOTkiLCJBY3Rpdml0eSI6IkNyZWF0ZS5UaGlyZFBhcnR5LERlbGV0ZS5UaGlyZFBhc nR5LFVwZGF0ZS5UaGlyZFBhcnR5LFZpZXcuVGhpcmRQYXJ0eSxQdWJsaWM6UHVibGljIiwiVXNlckN oYW5uZWxDb2RlIjoiSU5EMjk4NjM2IiwiVXNlclJvbGVzIjpbIlRoaXJkUGFydHkiXSwiRmlyc3ROYW1lIj oiRWhpc3MiLCJMYXN0TmFtZSI6Ikl3ZWthIiwiaWF0IjoxNzQ3OTk0MzM5LCJleHAiOjE3NDk3MjIzMzl 9.7Ca4R2pto8EWMd-wTpATrmEwfoRNE5HvYgXLlj_-who"
 
}
}


   Endpoints
1.	Get Price POST /price
Get the price based of shipment information.
Request Example:
access-token: YOUR_API_KEY
{
"SenderStationId": 39,
"ReceiverStationId": 10,
"VehicleType": 1, "ReceiverLocation": {
"Latitude": 10.3090,
"Longitude": 9.8400
},
"SenderLocation": { "Latitude": 9.0570,
"Longitude": 7.4950
},
"IsFromAgility": false, "CustomerCode": "ECO017121", "CustomerType": 0,
"DeliveryOptionIds" : [2],
"Value"	: 20,
"PickUpOptions"	: 1, "ShipmentItems": [
{
"ItemName": "",
"Description": "", "SpecialPackageId": 10,
"Quantity": 1,
"Weight": 3.5, "IsVolumetric": false,
 
"Length": 0,
"Width": 0,
"Height": 0,
"ShipmentType": 0, //special
"Value": 1200
},
{
"ItemName": "ABCD", "Description": "ABCD", "SpecialPackageId": 0,
"Quantity": 1,
"Weight": 3.5, "IsVolumetric": false, "Length": 0,
"Width": 0,
"Height": 0,
"ShipmentType": 1, // regular "Value": 1200
}
]
}
Response Example:
{
"message": "Success",
"apiId": "fda0ba9f-4c6d-4962-b5db-eea5735b0342", "status": 200,
"data": { "isWithinProcessingTime": true, "MainCharge": 13727.993,
"DeliverPrice": 12355.194,
"PickupCharge": 1625,
"InsuranceValue": 24,
"GrandTotal": 13980.194,
"DeclaredValue": 2400,
"Discount": 0, "ShipmentItems": [
{
 
"ItemName": "",
"Description": "", "SpecialPackageId": 10,
"Quantity": 1,
"Weight": 50, "IsVolumetric": false, "Length": 0,
"Width": 0,
"Height": 0,
"ShipmentType": 0,
"Value": 1200,
"CalculatedPrice": 3712.688
},
{
"ItemName": "ABCD", "Description": "ABCD", "SpecialPackageId": 0,
"Quantity": 1,
"Weight": 3.5, "IsVolumetric": false, "Length": 0,
"Width": 0,
"Height": 0,
"ShipmentType": 1,
"Value": 1200,
"CalculatedPrice": 10015.305
}
]
}
}
2.	Create Shipment POST /capture/preshipment
Create a new shipment and generate a waybill number.
Request Example:
access-token: YOUR_API_KEY
{
 
"SenderDetails": { "SenderLocation": {
"Latitude": "6.649438",
"Longitude": "3.340983"
},
"SenderName": "SanyaTest", "SenderPhoneNumber": "+234798804568",
"SenderStationId": 4, "SenderAddress": "testAddress",
"InputtedSenderAddress": "testAddress", "SenderLocality": "test"
},
"ReceiverDetails": { "ReceiverLocation": {
"Longitude": "3.340983",
"Latitude": "6.649438",
"FormattedAddress": "Receiver Address Test"
},
"ReceiverStationId": 4, "ReceiverName": "Receiver Test",
"ReceiverPhoneNumber": "+23468703966", "ReceiverAddress": "ReceivertestAddress", "InputtedReceiverAddress": "ReceiverAddress"
},
"ShipmentDetails": { "VehicleType": 1,
"IsFromAgility": 0,
"IsBatchPickUp": 0
},
"ShipmentItems": [
{
"SpecialPackageId": 10,
"Quantity": 1,
"Value": 10,
"ShipmentType": 0
}
]
 
}
Response Example:
{
"message": "Shipment created successfully.", "apiId": "cea2d0ec-700d-414e-a9dd-9497d6025366", "status": 200,
"data": {
"Waybill": "N-1349000269"
}
}
3.	•   Track Shipment
GET /track/mobileShipment
Retrieve the status and history of a shipment using a waybill number.
Request Example:
GET /track/mobileShipment?Waybill=123456789 access-token: YOUR_API_KEY
Response Example:
{
"message": "Success",
"apiId": "bc9c02cc-86ec-40a7-b96d-492f6aee76d1", "status": 200,
"data": [
{
"Waybill": "1349000020",
"Origin": "20 Emmanuel Olorunfemi St, Ifako Agege, Lagos, Nigeria", "Destination": "64/66,Ojuelegba Road, Surulere", "MobileShipmentTrackings": [
{
"PickupOptions": "HOMEDELIVERY", "DepartureServiceCentreId": 43, "DepartureServiceCentre": {
"Name": "NSUKKA (64 OWERRANI ENUGU ROAD)"
},
"GrandTotal": 2306,
"DeliveryOption": "ECOMMERCE HOME DELIVERY"
 
}
]
}
]
}


4.	•   Track Multiple Shipment
POST /track/multipleMobileShipment
Retrieve the status and history of a shipment using an array of waybill numbers.
Request Example:
{
"Waybill" : ["1349000020", "1349000270"]
}
Response Example:
{
"message": "Success",
"apiId": "b525931f-a04f-4ea5-af40-bb38d9722799", "status": 200,
"data": [
{
"Waybill": "1349000020",
"Origin": "20 Emmanuel Olorunfemi St, Ifako Agege, Lagos, Nigeria", "Destination": "64/66,Ojuelegba Road,Surulere", "MobileShipmentTrackings": [
{
"PickupOptions": "HOMEDELIVERY", "DepartureServiceCentreId": 43, "DepartureServiceCentre": {
"Name": "NSUKKA(64 OWERRANI ENUGU ROAD)"
},
"GrandTotal": 2306,
"DeliveryOption": "ECOMMERCE HOMEDELIVERY"
}
]
 
},
{
"Waybill": "1349000270",
"Origin": "101283,Somolu,Lagos,nigeria",
"Destination": "1, Peace Street, Eledi Estate off Obasanjo Farm Sango-Ota, Ogun,nigeria", "MobileShipmentTrackings": [
{
"PickupOptions": "HOMEDELIVERY", "DepartureServiceCentreId": 43, "DepartureServiceCentre": {
"Name": "NSUKKA (64 OWERRANI ENUGU ROAD)"
},
"GrandTotal": 3865,
"DeliveryOption": "ECOMMERCE HOME DELIVERY",
"MobileShipmentTrackingId": 251, "DateTime": "2024-08-05T10:53:16.053Z",
"Status": "MCRT", "TrackingType": 0,
"ScanStatusIncident": "SHIPMENT CREATED BY CUSTOMER", "ScanStatusReason": "SHIPMENT CREATED BY CUSTOMER", "ScanStatusComment": "WHEN SHIPMENT IS CREATED BY CUSTOMER"
}
]
}
]
}
5.	•   Get Local Stations GET /localstations/get
Retrieve the status and history of a shipment using an array of waybill numbers.
Request Example:
GET /localstations/get access-token: YOUR_API_KEY Response Example:
{
 
"message": "Success",
"apiId":  "a2db4108-753a-4283-91b8-303047129b52",
"status": 200,
"data": [
{
"_id": "66d6b4e05f6570f0f171d159", "StationId": 1,
"StationName": "ABA", "StationCode": "ABA", "StateId": 1,
"SuperServiceCentreId": 1, "IsPublic": true, "StateName": "ABIA", "CountryName": "NIGERIA", "CountryId": 1, "CountryCode": "NIGERIA", "CurrencyCode": "NGN", "CurrencySymbol": "₦"
},
{
"_id": "66d6b4e05f6570f0f171d17d", "StationId": 37,
"StationName": "ABAKALIKI", "StationCode": "ABL", "StateId": 11,
"SuperServiceCentreId": 291, "IsPublic": true, "StateName": "EBONYI", "CountryName": "NIGERIA", "CountryId": 1, "CountryCode": "NIGERIA", "CurrencyCode": "NGN", "CurrencySymbol": "₦"
}
]
}
 
Extra Information to note:
VehicleType (Enum)
Car: 0
Bike: 1,
Van : 2,
Truck: 3,
IsFromAgility : 0 (false)
IsBatchPickup: 0 (false)
Value: is the declared value for your shipment
ShipmentType (Enum)
Special: 0,
Regular: 1,
Ecommerce: 2
CustomerCode: our unique identifier for customers.. it is available on the login endpoint response as UserChannelCode.
CustomerType:
IndividualCustomer: 0,
Corporate: 1,
Ecommerce: 2,
Partner: 3
Also available on the login endpoint response as UserChannelType
Pickup Options
HomeDelivery : 0,
ServiceCentre : 1

DeliveryOptionIds: depends on the pickup options HomeDelivery: [2]
ServiceCentre : [11]
