import { expect, jest } from "@jest/globals";
import { 
  createCategoryController, 
  updateCategoryController, 
  categoryController, 
  singleCategoryController, 
  deleteCategoryController 
} from "./categoryController";
import categoryModel from "../models/categoryModel";
import slugify from "slugify";

jest.mock("../models/categoryModel.js");
jest.mock("slugify");

describe("Create Category Controller Test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    slugify.mockImplementation(str => `${str}-slug`);
  });

  test("name is empty", async () => {
    req = {
      body: {
        name: "",
      }
    };

    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: "Name is required" });
    expect(categoryModel.findOne).not.toHaveBeenCalled();
    expect(categoryModel.prototype.save).not.toHaveBeenCalled();
  });

  test("category already exists", async () => {
    req = {
      body: {
        name: "Existing Category",
      }
    };

    categoryModel.findOne = jest.fn().mockResolvedValue({
      name: "Existing Category",
      slug: "existing-category"
    });
    categoryModel.prototype.save = jest.fn();

    await createCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "Existing Category" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Category Already Exists",
    });
    expect(categoryModel.prototype.save).not.toHaveBeenCalled();
  });

  test("creates category successfully", async () => {
    req = {
      body: {
        name: "New Category",
      }
    };

    const savedCategory = {
      name: "New Category",
      slug: "new-category-slug",
      _id: "categoryid"
    };

    categoryModel.findOne = jest.fn().mockResolvedValue(null);
    categoryModel.prototype.save = jest.fn().mockResolvedValue(savedCategory);

    await createCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "New Category" });
    expect(slugify).toHaveBeenCalledWith("New Category");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "new category created",
      category: savedCategory
    });
    expect(categoryModel.prototype.save).toHaveBeenCalled();
  });

  test("error in category creation", async () => {
    req = {
      body: {
        name: "New Category",
      }
    };

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    categoryModel.findOne = jest.fn().mockResolvedValue(null);
    categoryModel.prototype.save = jest.fn().mockRejectedValue(new Error("Creation failed"));

    await createCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "New Category" });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: expect.any(Error),
      message: "Error in Category",
    });
    expect(categoryModel.prototype.save).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});

describe("Update Category Controller Test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    slugify.mockImplementation(str => `${str}-slug`);
  });

  test("updates category successfully", async () => {
    req = {
      body: {
        name: "Updated Category",
      },
      params: {
        id: "categoryid"
      }
    };

    const updatedCategory = {
      _id: "categoryid",
      name: "Updated Category",
      slug: "updated-category-slug"
    };

    categoryModel.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedCategory);

    await updateCategoryController(req, res);

    expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "categoryid",
      { name: "Updated Category", slug: "Updated Category-slug" },
      { new: true }
    );
    expect(slugify).toHaveBeenCalledWith("Updated Category");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Category Updated Successfully",
      category: updatedCategory
    });
  });

  test("error in category update", async () => {
    req = {
      body: {
        name: "Updated Category",
      },
      params: {
        id: "categoryid"
      }
    };

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    categoryModel.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error("Update failed"));

    await updateCategoryController(req, res);

    expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "categoryid",
      { name: "Updated Category", slug: "Updated Category-slug" },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: expect.any(Error),
      message: "Error while updating category",
    });
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});

describe("Category Controller (Get All) Test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    req = {};
  });

  test("gets all categories successfully", async () => {
    const categories = [
      { _id: "cat1", name: "Category 1", slug: "category-1" },
      { _id: "cat2", name: "Category 2", slug: "category-2" }
    ];

    categoryModel.find = jest.fn().mockResolvedValue(categories);

    await categoryController(req, res);

    expect(categoryModel.find).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "All Categories List",
      category: categories
    });
  });

  test("error in getting all categories", async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    categoryModel.find = jest.fn().mockRejectedValue(new Error("Find failed"));

    await categoryController(req, res);

    expect(categoryModel.find).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: expect.any(Error),
      message: "Error while getting all categories",
    });
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});

describe("Single Category Controller Test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  test("gets single category successfully", async () => {
    req = {
      params: {
        slug: "category-slug"
      }
    };

    const category = { _id: "categoryid", name: "Category", slug: "category-slug" };

    categoryModel.findOne = jest.fn().mockResolvedValue(category);

    await singleCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "category-slug" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Get Single Category Successfully",
      category
    });
  });

  test("error in getting single category", async () => {
    req = {
      params: {
        slug: "category-slug"
      }
    };

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    categoryModel.findOne = jest.fn().mockRejectedValue(new Error("Find failed"));

    await singleCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "category-slug" });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: expect.any(Error),
      message: "Error While getting Single Category",
    });
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});

describe("Delete Category Controller Test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  test("deletes category successfully", async () => {
    req = {
      params: {
        id: "categoryid"
      }
    };

    categoryModel.findByIdAndDelete = jest.fn().mockResolvedValue({});

    await deleteCategoryController(req, res);

    expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("categoryid");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Category Deleted Successfully",
    });
  });

  test("error in deleting category", async () => {
    req = {
      params: {
        id: "categoryid"
      }
    };

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    categoryModel.findByIdAndDelete = jest.fn().mockRejectedValue(new Error("Delete failed"));

    await deleteCategoryController(req, res);

    expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("categoryid");
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "error while deleting category",
      error: expect.any(Error),
    });
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});