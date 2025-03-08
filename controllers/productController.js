import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import orderModel from "../models/orderModel.js";

import fs from "fs";
import slugify from "slugify";
import braintree from "braintree";
import dotenv from "dotenv";

dotenv.config();

//payment gateway
var gateway = new braintree.BraintreeGateway({
    environment: braintree.Environment.Sandbox,
    merchantId: process.env.BRAINTREE_MERCHANT_ID,
    publicKey: process.env.BRAINTREE_PUBLIC_KEY,
    privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

export const createProductController = async (req, res) => {
    try {
        const { name, description, price, category, quantity, shipping } =
            req.fields;
        const { photo } = req.files;

        // Validation with more appropriate status codes (400 for bad request)
        if (!name) {
            return res.status(400).send({ error: "Name is required" });
        }
        if (!description) {
            return res.status(400).send({ error: "Description is required" });
        }
        if (!price) {
            return res.status(400).send({ error: "Price is required" });
        }
        if (!category) {
            return res.status(400).send({ error: "Category is required" });
        }
        if (!quantity) {
            return res.status(400).send({ error: "Quantity is required" });
        }
        if (photo && photo.size > 1000000) {
            return res.status(400).send({
                error: "Photo should be less than 1MB",
            });
        }
        if (isNaN(price)) {
            return res
                .status(400)
                .send({ error: "Price must be a valid number" });
        }
        if (price <= 0) {
            return res
                .status(400)
                .send({ error: "Price must be a positive number" });
        }
        if (isNaN(quantity)) {
            return res
                .status(400)
                .send({ error: "Quantity must be a valid number" });
        }
        if (quantity <= 0) {
            return res
                .status(400)
                .send({ error: "Quantity must be a positive number" });
        }

        // Create a new product object
        const product = new productModel({
            ...req.fields,
            slug: slugify(name),
        });

        // Handle the photo if present
        if (photo) {
            product.photo = product.photo || {}; // Ensure photo is initialized as an object
            product.photo.data = fs.readFileSync(photo.path);
            product.photo.contentType = photo.type;
        }

        // Save the product
        const savedProduct = await product.save();

        // Send a success response
        res.status(201).send({
            success: true,
            message: "Product created successfully",
            products: savedProduct,
        });
    } catch (error) {
        res.status(500).send({
            success: false,
            error,
            message: "Error in creating product",
        });
    }
};

//get all products
export const getProductController = async (req, res) => {
    try {
        const products = await productModel
            .find({})
            .populate("category")
            .select("-photo")
            .limit(12)
            .sort({ createdAt: -1 });
        res.status(200).send({
            success: true,
            counTotal: products.length,
            message: "ALlProducts ",
            products,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Erorr in getting products",
            error: error.message,
        });
    }
};
// get single product
export const getSingleProductController = async (req, res) => {
    try {
        // Check if slug is provided
        if (!req.params.slug) {
            return res.status(400).send({
                success: false,
                message: "Product ID is required",
            });
        }

        const product = await productModel
            .findOne({ slug: req.params.slug })
            .select("-photo")
            .populate("category");

        // If product is not found
        if (!product) {
            return res.status(404).send({
                success: false,
                message: "Product not found",
            });
        }

        res.status(200).send({
            success: true,
            message: "Single Product Fetched",
            product,
        });
    } catch (error) {
        // console.log(error);
        res.status(500).send({
            success: false,
            message: "Error while getting single product",
            error,
        });
    }
};

// export const getSingleProductController = async (req, res) => {
//     try {
//         const product = await productModel
//             .findOne({ slug: req.params.slug })
//             .select("-photo")
//             .populate("category");
//         res.status(200).send({
//             success: true,
//             message: "Single Product Fetched",
//             product,
//         });
//     } catch (error) {
//         console.log(error);
//         res.status(500).send({
//             success: false,
//             message: "Eror while getting single product",
//             error,
//         });
//     }
// };

// get photo
export const productPhotoController = async (req, res) => {
    try {
        const product = await productModel
            .findById(req.params.pid)
            .select("photo");
        if (product.photo.data) {
            res.set("Content-type", product.photo.contentType);
            return res.status(200).send(product.photo.data);
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Erorr while getting photo",
            error,
        });
    }
};

//delete controller
export const deleteProductController = async (req, res) => {
    try {
        if (!req.params.pid) {
            return res.status(400).send({
                success: false,
                message: "Product ID is required",
            });
        }
        const product = await productModel.findByIdAndDelete(req.params.pid);
        if (!product) {
            return res.status(404).send({
                success: false,
                message: "Product not found",
            });
        }
        res.status(200).send({
            success: true,
            message: "Product Deleted successfully",
        });
    } catch (error) {
        // console.log(error);
        res.status(500).send({
            success: false,
            message: "Error while deleting product",
            error,
        });
    }
};

//upate producta
// export const updateProductController = async (req, res) => {
//     try {
//         const { id } = req.params; // Get product ID from URL params
//         const { name, description, price, category, quantity, shipping } =
//             req.fields;
//         const { photo } = req.files;

//         // Validation
//         switch (true) {
//             case !name:
//                 return res.status(400).send({ error: "Name is required" });
//             case !description:
//                 return res
//                     .status(400)
//                     .send({ error: "Description is required" });
//             case !price:
//                 return res.status(400).send({ error: "Price is required" });
//             case !category:
//                 return res.status(400).send({ error: "Category is required" });
//             case !quantity:
//                 return res.status(400).send({ error: "Quantity is required" });
//             case photo && photo.size > 1000000: // Check if the photo exceeds 1MB
//                 return res.status(400).send({
//                     error: "Photo should be less than 1MB",
//                 });
//             case isNaN(price):
//                 return res
//                     .status(400)
//                     .send({ error: "Price must be a valid number" });
//             case price <= 0:
//                 return res
//                     .status(400)
//                     .send({ error: "Price must be a positive number" });
//             case isNaN(quantity):
//                 return res
//                     .status(400)
//                     .send({ error: "Quantity must be a valid number" });
//             case quantity <= 0:
//                 return res
//                     .status(400)
//                     .send({ error: "Quantity must be a positive number" });
//         }

//         // Find the product by ID and update
//         const updatedProduct = await productModel.findByIdAndUpdate(
//             id, // Product ID from URL params
//             {
//                 name,
//                 description,
//                 price,
//                 category,
//                 quantity,
//                 shipping,
//                 slug: slugify(name), // Generate slug from the name
//                 ...(photo && {
//                     // If there's a photo, add it to the update object
//                     photo: {
//                         data: fs.readFileSync(photo.path), // Save the photo data
//                         contentType: photo.type, // Save the photo content type
//                     },
//                 }),
//             },
//             { new: true } // Return the updated product
//         );

//         // If the product doesn't exist, return a 404 error
//         if (!updatedProduct) {
//             return res.status(404).send({ error: "Product not found" });
//         }

//         // Send success response
//         res.status(200).send({
//             success: true,
//             message: "Product updated successfully",
//             products: updatedProduct, // Return the updated product
//         });
//     } catch (error) {
//         console.error(error); // Log the error details
//         res.status(500).send({
//             success: false,
//             message: "Error in updating product",
//         });
//     }
// };

export const updateProductController = async (req, res) => {
    try {
        const { name, description, price, category, quantity, shipping } =
            req.fields;
        const { photo } = req.files;
        //alidation
        switch (true) {
            case !name:
                return res.status(400).send({ error: "Name is required" });
            case !description:
                return res
                    .status(400)
                    .send({ error: "Description is required" });
            case !price:
                return res.status(400).send({ error: "Price is required" });
            case isNaN(price): // Check if price is not a valid number
                return res
                    .status(400)
                    .send({ error: "Price must be a valid number" });
            case price <= 0: // Check if price is a non-positive number
                return res
                    .status(400)
                    .send({ error: "Price must be a positive number" });
            case !category:
                return res.status(400).send({ error: "Category is required" });
            case !quantity:
                return res.status(400).send({ error: "Quantity is required" });
            case isNaN(quantity): // Check if quantity is not a valid number
                return res
                    .status(400)
                    .send({ error: "Quantity must be a valid number" });
            case quantity <= 0: // Check if quantity is a non-positive number
                return res
                    .status(400)
                    .send({ error: "Quantity must be a positive number" });
            case photo && photo.size > 1000000:
                return res.status(400).send({
                    error: "Photo should be less than 1MB",
                });
        }

        const products = await productModel.findByIdAndUpdate(
            req.params.pid,
            { ...req.fields, slug: slugify(name) },
            { new: true }
        );
        if (!products) res.status(404).send({ error: "Product not found" });
        if (photo) {
            products.photo.data = fs.readFileSync(photo.path);
            products.photo.contentType = photo.type;
        }
        await products.save();
        res.status(201).send({
            success: true,
            message: "Product updated successfully",
            products,
        });
    } catch (error) {
        // console.log(error);
        res.status(500).send({
            success: false,
            error,
            message: "Error in updating product",
        });
    }
};

// filters
export const productFiltersController = async (req, res) => {
    try {
        const { checked, radio } = req.body;
        let args = {};
        if (checked.length > 0) args.category = checked;
        if (radio.length) args.price = { $gte: radio[0], $lte: radio[1] };
        const products = await productModel.find(args);
        res.status(200).send({
            success: true,
            products,
        });
    } catch (error) {
        console.log(error);
        res.status(400).send({
            success: false,
            message: "Error WHile Filtering Products",
            error,
        });
    }
};

// product count
export const productCountController = async (req, res) => {
    try {
        const total = await productModel.find({}).estimatedDocumentCount();
        res.status(200).send({
            success: true,
            total,
        });
    } catch (error) {
        console.log(error);
        res.status(400).send({
            message: "Error in product count",
            error,
            success: false,
        });
    }
};

// product list base on page
export const productListController = async (req, res) => {
    try {
        const perPage = 6;
        const page = req.params.page ? req.params.page : 1;
        const products = await productModel
            .find({})
            .select("-photo")
            .skip((page - 1) * perPage)
            .limit(perPage)
            .sort({ createdAt: -1 });
        res.status(200).send({
            success: true,
            products,
        });
    } catch (error) {
        console.log(error);
        res.status(400).send({
            success: false,
            message: "error in per page ctrl",
            error,
        });
    }
};

// search product
export const searchProductController = async (req, res) => {
    try {
        const { keyword } = req.params;
        const resutls = await productModel
            .find({
                $or: [
                    { name: { $regex: keyword, $options: "i" } },
                    { description: { $regex: keyword, $options: "i" } },
                ],
            })
            .select("-photo");
        res.json(resutls);
    } catch (error) {
        console.log(error);
        res.status(400).send({
            success: false,
            message: "Error In Search Product API",
            error,
        });
    }
};

// similar products
export const realtedProductController = async (req, res) => {
    try {
        const { pid, cid } = req.params;
        const products = await productModel
            .find({
                category: cid,
                _id: { $ne: pid },
            })
            .select("-photo")
            .limit(3)
            .populate("category");
        res.status(200).send({
            success: true,
            products,
        });
    } catch (error) {
        console.log(error);
        res.status(400).send({
            success: false,
            message: "error while geting related product",
            error,
        });
    }
};

// get prdocyst by catgory
export const productCategoryController = async (req, res) => {
    try {
        const category = await categoryModel.findOne({ slug: req.params.slug });
        const products = await productModel
            .find({ category })
            .populate("category");
        res.status(200).send({
            success: true,
            category,
            products,
        });
    } catch (error) {
        console.log(error);
        res.status(400).send({
            success: false,
            error,
            message: "Error While Getting products",
        });
    }
};

//payment gateway api
//token
export const braintreeTokenController = async (req, res) => {
    try {
        gateway.clientToken.generate({}, function (err, response) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.send(response);
            }
        });
    } catch (error) {
        console.log(error);
    }
};

//payment
export const brainTreePaymentController = async (req, res) => {
    try {
        const { nonce, cart } = req.body;
        let total = 0;
        cart.map((i) => {
            total += i.price;
        });
        let newTransaction = gateway.transaction.sale(
            {
                amount: total,
                paymentMethodNonce: nonce,
                options: {
                    submitForSettlement: true,
                },
            },
            function (error, result) {
                if (result) {
                    const order = new orderModel({
                        products: cart,
                        payment: result,
                        buyer: req.user._id,
                    }).save();
                    res.json({ ok: true });
                } else {
                    res.status(500).send(error);
                }
            }
        );
    } catch (error) {
        console.log(error);
    }
};
