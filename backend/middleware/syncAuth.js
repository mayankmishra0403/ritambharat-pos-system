import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export const syncProtect = async (req, res, next) => {
    try {
        let token

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1]
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access sync endpoints'
            })
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET)

            req.user = await User.findById(decoded.id).select('-password')

            if (!req.user || !req.user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found or inactive'
                })
            }

            if (!req.user.restaurant) {
                return res.status(403).json({
                    success: false,
                    message: 'User is not associated with any restaurant'
                })
            }

            req.restaurantId = req.user.restaurant.toString()
            req.isSyncClient = true

            next()
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, token failed'
            })
        }
    } catch (error) {
        next(error)
    }
}
