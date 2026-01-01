const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// register endpoint
const registerUser = async(req, res) => {
    try {
        // extract user details from request body
        const { username, email, password, role } = req.body

        // check whether the user already exists
        const checkExistingUser = await User.findOne({ $or: [{username}, {email}] })

        if (checkExistingUser) {
            res.status(400).json({
                success: false,
                message: "User already exists"
            })
        }

        // hash user password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // create a new user and save in your db
        const newlyCreatedUser = new User({
            username,
            email,
            password: hashedPassword,
            role: role || "user"
        })

        await newlyCreatedUser.save()

        if (newlyCreatedUser) {
            res.status(200).json({
                success: true,
                message: "User registered successfully!"
            })
        } else {
            res.status(400).json({
                success: true,
                message: "Unable to register"
            })
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Some error occured"
        })
    }
} 




// login endpoint
const loginUser = async(req, res) => {
    try {
        const { username, password } = req.body
        const user = await User.findOne({username})

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User is not registered"
            })
        }


        // check whether the password is correct or not
        const isPasswordMatch = await bcrypt.compare(password, user.password)

        if (!isPasswordMatch) {
            return res.status(400).json({
                success: false,
                message: "Incorrect Password"
            })
        }

        // create access token
        const accessToken = jwt.sign({
            userId: user._id,
            username: user.username,
            role: user.role
        }, process.env.JWT_SECRET_KEY, {
            expiresIn: '15m'
        })


        res.status(200).json({
            success: true,
            message: "Log In Successful",
            accessToken
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Some error occured"
        })
    }
} 

const changePassword = async(req, res) => {
    try {
        const userId = req.userInfo.userId

        // extract old and new password
        const { oldPassword, newPassword } = req.body

        // find the current logged in user
        const user = await User.findById(userId)

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            })
        }

        // check if the old password is correct
        const isPasswordMatch = await bcrypt.compare(oldPassword, user.password)

        if (!isPasswordMatch) {
            return res.status(400).json({
                success: false,
                message: "Incorrect old password"
            })
        }

        // hash new password
        const salt = await bcrypt.genSalt(10)
        const newHashedPassword = await bcrypt.hash(newPassword, salt)

        // update user password
        user.password = newHashedPassword
        await user.save()

        res.status(200).json({
            success: true,
            message: "Password changed successfully"
        })


    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Some error occured"
        })
    }
}

module.exports = { registerUser, loginUser, changePassword }