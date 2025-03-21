import React, { useState, useEffect } from "react";
import Layout from "./../../components/Layout";
import AdminMenu from "./../../components/AdminMenu";
import toast from "react-hot-toast";
import axios from "axios";
import { Select } from "antd";
import { useNavigate } from "react-router-dom";
const { Option } = Select;

const CreateProduct = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("");
    const [quantity, setQuantity] = useState("");
    const [shipping, setShipping] = useState("");
    const [photo, setPhoto] = useState("");
    const [errors, setErrors] = useState({});

    // get all category
    const getAllCategory = async () => {
        try {
            const { data } = await axios.get("/api/v1/category/get-category");
            if (data?.success) {
                setCategories(data?.category);
            }
        } catch (error) {
            console.log(error);
            toast.error("Something went wrong in getting category");
        }
    };

    useEffect(() => {
        getAllCategory();
    }, []);

    // create product function
    const handleCreate = async (e) => {
        e.preventDefault();

        // Reset error messages
        setErrors({});

        // Validation check for compulsory fields
        const validationErrors = {};

        if (!name) validationErrors.name = "Name is compulsory";
        if (!description)
            validationErrors.description = "Description is compulsory";
        if (!price) validationErrors.price = "Price is compulsory";
        if (!quantity) validationErrors.quantity = "Quantity is compulsory";
        if (!category) validationErrors.category = "Category is compulsory";

        if (price && isNaN(price))
            validationErrors.price = "Price must be a valid number";
        if (price && price <= 0)
            validationErrors.price = "Price must be positive";

        if (quantity && isNaN(quantity))
            validationErrors.quantity = "Quantity must be a valid number";
        if (quantity && quantity <= 0)
            validationErrors.quantity = "Quantity must be positive";

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            const productData = new FormData();
            productData.append("name", name);
            productData.append("description", description);
            productData.append("price", price);
            productData.append("quantity", quantity);
            productData.append("photo", photo);
            productData.append("category", category);

            const { data } = await axios.post(
                "/api/v1/product/create-product",
                productData
            );

            if (data?.success) {
                toast.success("Product Created Successfully");
                navigate("/dashboard/admin/products");
            } else {
                toast.error(data?.message);
            }
        } catch (error) {
            console.log(error);
            toast.error("Something went wrong");
        }
    };

    return (
        <Layout title={"Dashboard - Create Product"}>
            <div className="container-fluid m-3 p-3">
                <div className="row">
                    <div className="col-md-3">
                        <AdminMenu />
                    </div>
                    <div className="col-md-9">
                        <h1>Create Product</h1>
                        <div className="m-1 w-75">
                            <Select
                                bordered={false}
                                placeholder="Select a category"
                                size="large"
                                showSearch
                                className="form-select mb-3"
                                onChange={(value) => setCategory(value)}
                            >
                                {categories?.map((c) => (
                                    <Option key={c._id} value={c._id}>
                                        {c.name}
                                    </Option>
                                ))}
                            </Select>
                            {errors.category && (
                                <p className="text-danger">{errors.category}</p>
                            )}

                            <div className="mb-3">
                                <label className="btn btn-outline-secondary col-md-12">
                                    {photo ? photo.name : "Upload Photo"}
                                    <input
                                        type="file"
                                        name="photo"
                                        accept="image/*"
                                        onChange={(e) =>
                                            setPhoto(e.target.files[0])
                                        }
                                        hidden
                                    />
                                </label>
                            </div>

                            <div className="mb-3">
                                {photo && (
                                    <div className="text-center">
                                        <img
                                            src={URL.createObjectURL(photo)}
                                            alt="product_photo"
                                            height={"200px"}
                                            className="img img-responsive"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="mb-3">
                                <input
                                    type="text"
                                    value={name}
                                    placeholder="Write a name"
                                    className="form-control"
                                    onChange={(e) => setName(e.target.value)}
                                />
                                {errors.name && (
                                    <p className="text-danger">{errors.name}</p>
                                )}
                            </div>

                            <div className="mb-3">
                                <textarea
                                    type="text"
                                    value={description}
                                    placeholder="Write a description"
                                    className="form-control"
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                />
                                {errors.description && (
                                    <p className="text-danger">
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            <div className="mb-3">
                                <input
                                    type="number"
                                    value={price}
                                    placeholder="Write a price"
                                    className="form-control"
                                    onChange={(e) => setPrice(e.target.value)}
                                />
                                {errors.price && (
                                    <p className="text-danger">
                                        {errors.price}
                                    </p>
                                )}
                            </div>

                            <div className="mb-3">
                                <input
                                    type="number"
                                    value={quantity}
                                    placeholder="Write a quantity"
                                    className="form-control"
                                    onChange={(e) =>
                                        setQuantity(e.target.value)
                                    }
                                />
                                {errors.quantity && (
                                    <p className="text-danger">
                                        {errors.quantity}
                                    </p>
                                )}
                            </div>

                            <div className="mb-3">
                                <Select
                                    bordered={false}
                                    placeholder="Select Shipping"
                                    size="large"
                                    showSearch
                                    className="form-select mb-3"
                                    onChange={(value) => setShipping(value)}
                                >
                                    <Option value="0">No</Option>
                                    <Option value="1">Yes</Option>
                                </Select>
                            </div>

                            <div className="mb-3">
                                <button
                                    className="btn btn-primary"
                                    onClick={handleCreate}
                                >
                                    CREATE PRODUCT
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CreateProduct;
