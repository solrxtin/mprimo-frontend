import { Request, Response } from "express"
import User from "../models/user.model"


export const addAddress = async (req: Request, res: Response) => {
  try {
    const { address } = req.body

    const {type, street, city, state, country, postalCode} = address

    if (!type || !street || !city || !state || !country || !postalCode) {
        return res.status(400).json({
            success: false,
            message: "All address fields are required"
        })
    }

    if (!address) {
        return res.status(400).json({
            success: false,
            message: "Address is required"
        })
    }
    const { userId } = req
    const user = await User.findOne({ _id: userId })

    if (user && user.addresses) {
        const hasDefaultAddress = user.addresses.find((address: any) => address.default === true)
        
        const modifiedAddress = {
            type,
            street,
            city,
            state,
            country,
            postalCode,
            isDefault: hasDefaultAddress ? false : true
        }
        user.addresses.push(modifiedAddress)
        await user.save()
    } else {
        throw new Error("An error occured while trying to add address")
    }

    return res.status(200).json({
        success: true,
        message: "Address added successfully"
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
        success: false,
        message: "An error occured while trying to add address"
    })
  }
}

export const modifyAddress = async(req: Request, res: Response) => {
    try {
        const { address } = req.body
        const { userId } = req
        const user = await User.findOne({ _id: userId })

        if (user && user.addresses) {
            const addressIndex = user.addresses.findIndex((address: any) => address._id.toString() === address._id.toString())
            if (addressIndex !== -1) {
                user.addresses[addressIndex] = address
                await user.save()
            }
        } else {
            throw new Error("An error occured while trying to modify address")
        }

        return res.status(200).json({
            success: true,
            message: "Address modified successfully"
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: "An error occured while trying to modify address"
        })
    }
}