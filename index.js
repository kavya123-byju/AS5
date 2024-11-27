// Import the required libraries
const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const path = require("path");
const contentService = require("./content-service");

// Cloudinary configuration
cloudinary.config({
  cloud_name: 'Kavya Byju',  
  api_key: '395145969244964',       
  api_secret: 'UWMoBIfHNnDcJQsv9LbvrbA8vFQ', 
  secure: true
});

// Set up multer for handling file uploads
const upload = multer();

// Create an Express application instance
const app = express();

// Set the HTTP port to an environment variable or default to 3838
const HTTP_PORT = process.env.PORT || 3838;

// Configure EJS as the templating engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files from the "public" directory
app.use(express.static("public"));

// Redirect root path to the "/about" page
app.get("/", (req, res) => {
  res.redirect("/about");
});

// About page route
app.get("/about", (req, res) => {
  res.render("about");
});

// Categories route
app.get("/categories", (req, res) => {
  contentService
    .getCategories()
    .then((categories) => {
      if (categories.length > 0) {
        res.render("categories", { categories });
      } else {
        res.render("categories", { categories: [], error: "No categories found." });
      }
    })
    .catch((err) => {
      res.render("categories", { categories: [], error: err.message });
    });
});

// Modified Articles route with optional filtering by category or minDate
app.get("/articles", (req, res) => {
  // Check if a category is passed as a query parameter
  if (req.query.category) {
    contentService
      .getArticlesByCategory(req.query.category)
      .then((articles) => {
        // Render the articles in the 'articles' view with the filtered data
        res.render("articles", { 
          articles, 
          categoryName: req.query.category,  // Pass categoryName to the view
          errorMessage: null 
        });
      })
      .catch((err) => {
        res.render("articles", { 
          articles: [], 
          categoryName: req.query.category,  // Pass categoryName to the view even in error case
          errorMessage: err.message 
        });
      });
  } else if (req.query.minDate) {
    // If a minDate is provided, filter articles by date
    contentService
      .getArticlesByMinDate(req.query.minDate)
      .then((articles) => {
        res.render("articles", { articles, errorMessage: null });
      })
      .catch((err) => {
        res.render("articles", { articles: [], errorMessage: err.message });
      });
  } else {
    // If no filter is provided, return all articles
    contentService
      .getAllArticles()
      .then((articles) => {
        res.render("articles", { articles, errorMessage: null });
      })
      .catch((err) => {
        res.render("articles", { articles: [], errorMessage: err.message });
      });
  }
});

// Single article route by ID (modified)
app.get("/article/:Id", (req, res) => {
  contentService
    .getArticleById(req.params.Id)
    .then((article) => {
      // Check if the article is published, if not redirect to 404
      if (!article.published) {
        return res.status(404).render("404"); // Render 404 page if not published
      }

      // Get the category name based on the article's category
      contentService.getCategories().then((categories) => {
        const categoryName = categories.find(
          (category) => category.id === article.category
        )?.name || "Unknown Category";

        // Pass the article data and the categoryName to the article.ejs view
        res.render("article", { article, categoryName });
      });
    })
    .catch((err) => {
      res.status(404).render("404", { error: err.message });
    });
});

// Add article form page
app.get("/articles/add", (req, res) => {
  contentService.getCategories()
    .then(categories => {
      res.render("addArticle", { categories });
    })
    .catch(err => {
      res.status(500).json({ message: "Failed to load categories", error: err });
    });
});

// Add article POST handler
app.post("/articles/add", upload.single("featureImage"), (req, res) => {
  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
          { folder: "articles" },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    async function uploadToCloudinary(req) {
      let result = await streamUpload(req);
      return result.url;
    }

    uploadToCloudinary(req)
      .then((imageUrl) => {
        processArticle(imageUrl);
      })
      .catch((err) => {
        res.status(500).json({ message: "Image upload failed", error: err });
      });
  } else {
    processArticle("");
  }

  function processArticle(imageUrl) {
    const articleData = {
      title: req.body.title,
      content: req.body.content,
      category: req.body.category,
      published: req.body.published === "on",
      featureImage: imageUrl || "",
      postDate: new Date().toISOString(),
    };

    contentService
      .addArticle(articleData)
      .then(() => res.redirect("/articles"))
      .catch((err) =>
        res.status(500).json({ message: "Failed to add article", error: err })
      );
  }
});

// Initialize data and start the server
contentService.initialize().then(() => {
  app.listen(HTTP_PORT, () => {
    console.log("Server listening @ http://localhost:" + HTTP_PORT);
  });
});

// Export the Express app instances
module.exports = app;
