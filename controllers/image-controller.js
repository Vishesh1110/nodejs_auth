const Image = require('../models/Image')
const { uploadToCloudinary } = require('../helpers/cloudinaryHelper')
// const fs = require('fs')
const cloudinary = require('../config/cloudinary')

const uploadImageController = async(req, res) => {
    try {
        // check if file is missing in req object
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image found"
            })
        }

        // upload to cloudinary
        const {url, publicId} = await uploadToCloudinary(req.file.path)

        // store the image url and public id along with the uploaded user id
        const newlyUploadedImage = new Image({
            url,
            publicId,
            uploadedBy: req.userInfo.userId
        })

        await newlyUploadedImage.save()

        // delete the image from local storage
        // fs.unlinkSync()

        res.status(201).json({
            success: true,
            message: "Image uploaded successfully",
            image: newlyUploadedImage
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Something went wrong'
        })
    }
}

const fetchImagesController = async (req, res) => {
    try {
        const images = await Image.find({})

        if (images) {
            res.status(200).json({
                success: true,
                data: images
            })
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Something went wrong'
        })
    }
}

const deleteImageController = async (req, res) => {
    try {
        const getCurrentImageId = req.params.id
        const userId = req.userInfo.userId

        const image = await Image.findById(getCurrentImageId)

        if (!image) {
            return res.status(404).json({
                success: false,
                message: "Image not found"
            })
        }

        // check if image is uploaded by the current user who is trying to delete the image
        if (image.uploadedBy.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "Not authorised to delete this image"
            })
        }

        // first, delete image from cloudinary 
        await cloudinary.uploader.destroy(image.publicId)

        // delete this image from mongoDB
        await Image.findByIdAndDelete(getCurrentImageId)

        res.status(200).json({
            success: true,
            message: "Image is deleted successfully"
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong"
        })
    }
}


module.exports = { uploadImageController, fetchImagesController, deleteImageController }