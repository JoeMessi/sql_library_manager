const express = require('express'); // require express
const router = express.Router(); // starts an express apllication
const Book = require('../models').Book; // require the Book model
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

// /* GET home route */
router.get('/', (req, res) => {
  res.redirect("/books/page/1");
});

/* GET books listing + pagination */
router.get('/books/page/:pageNum', (req, res, next) => {

  const pageNum = req.params.pageNum;
  const limit = 8;
  const offset = limit * (pageNum - 1);

  Book.findAndCountAll({
    limit: limit,
    offset: offset
  })
    .then(books => {
      const totalPages = Math.ceil(books.count / limit);
      res.render("index", { books: books.rows, totalPages: totalPages });
    })
    .catch(err => {
      const error = new Error('Server Error');
      error.status = 500;
      next(error);
    });
});

/* GET search route. */
router.get('/books/search', (req, res, next) => {
  const query = req.query.search;
  if(query === '') {
    res.redirect('/books/page/1');
  }else{
    Book.findAll({
        where: {
            [Op.or]: [
              { title: { [Op.like]: `%${query}%` } },
              { author: { [Op.like]: `%${query}%` } },
              { genre: { [Op.like]: `%${query}%` } },
              { year: { [Op.like]: `%${query}%` } },
            ]
        }
      })
      .then(books => {
        res.render("index", { books: books, query: query });
      })
      .catch(err => {
        const error = new Error('Server Error');
        error.status = 500;
        next(error);
      });
   }

})


/* Create a new book form. */
router.get('/books/new', (req, res, next) => {
  res.render("new-book", {book: Book.build(), title: "New Book"});
});

/* POST create book. */
router.post('/books/new', (req, res, next) => {
  Book.create(req.body)
    .then(book => {
      res.redirect("/books/page/1");
    })
    .catch(error => {
        if(error.name === "SequelizeValidationError") {
          res.render("new-book", {book: Book.build(req.body), errors: error.errors, title: "New Book"})
        } else {
           throw error;
        }
    })
    .catch(err => {
        const error = new Error('Server Error');
        error.status = 500;
        next(error);
    });
});


/* GET individual book. */
router.get("/books/:id", (req, res, next) => {
  Book.findByPk(req.params.id)
    .then(book => {
        if(book) {
          res.render("update-book", {book: book, title: "Update Book"});
        }else{
          throw error;
        }
    })
    .catch(err => {
        const error = new Error('Server Error');
        error.status = 500;
        next(error);
    });
});

/* POST update book. */
router.post("/books/:id", (req, res, next) => {
  Book.findByPk(req.params.id)
    .then(book => {
      if(book) {
        return book.update(req.body);
      } else {
        res.send(404);
      }
    }).then(book => {
      res.redirect("/books/page/1");
    })
    .catch(error => {
        if(error.name === "SequelizeValidationError") {
          const book = Book.build(req.body);
          book.id = req.params.id;
          res.render("update-book", {book: book, errors: error.errors, title: "Update Book"})
        } else {
           throw error;
        }
    })
    .catch(err => {
        const error = new Error('Server Error');
        error.status = 500;
        next(error);
    });
});

/* DELETE individual book. */
router.post("/books/:id/delete", (req, res, next) => {
  Book.findByPk(req.params.id)
    .then(book => {
      if(book) {
        return book.destroy();
      } else {
        res.send(404);
      }
    })
    .then(() => {
      res.redirect("/books/page/1");
    })
    .catch(err => {
        const error = new Error('Server Error');
        error.status = 500;
        next(error);
    });
});

//error handler middleware
router.use((err, req, res, next) => {
  res.render('error', {error: err});
  console.log(`There was an error with the application. ${err}`);
});


// 404 error middleware
router.use((req, res) => {
  const error = new Error('Page Not Found');
  error.status = 404;
  res.render('page-not-found', {error});
});


module.exports = router;
