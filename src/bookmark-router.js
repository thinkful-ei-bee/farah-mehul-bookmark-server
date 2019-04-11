'use strict';

const express = require('express');

const bookmarkRouter = express.Router();
const bodyParser = express.json();
const uuid = require('uuid/v4');
const logger = require('./logger');
const bookmarkService = require('./bookmark-service');
const xss = require('xss');

const serializeBookmark = bookmark => ({
  id: bookmark.id,
  name: xss(bookmark.name),
  url: xss(bookmark.url),
  description: xss(bookmark.description),
  rating: Number(bookmark.rating),
});



bookmarkRouter
  .route('/')
  .get((req,res,next) => {

    const knexInstance = req.app.get('db');
    bookmarkService.getAllBookmarks(knexInstance)
      .then(bookmarks => {
        res.json(bookmarks);
      })
      .catch(next);
  })

  .post(bodyParser, (req,res,next) => {
    const { id,name, url, description,rating } = req.body;
    const newBookmark = { id,name, url, description,rating };

    for (const [key, value] of Object.entries(newBookmark)) {
     
      if (key !== 'description' && (value === null || value === undefined)) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        });
      }
      if( key === 'rating' && (value <1 || value >5 || isNaN(value))){
        logger.error('rating must be between 1 and 5');
        return res.status(400).json({
          error: { message: 'Invalid rating' }
        });
      }

    }

    bookmarkService.insertBookmark(
      req.app.get('db'),
      newBookmark
    )
      .then(bookmark => {
        res
          .status(201)
          .location(`/api/bookmarks/${bookmark.id}`)
          .json(bookmark);
      })
      .catch(next);
  });


bookmarkRouter
  .route('/:id')
  .all((req, res, next) => {
    bookmarkService.getBookmarkById(
      req.app.get('db'),
      req.params.id
    )
   
      .then(bookmark => {
        if (!bookmark) {
          return res.status(404).json({
            error: { message: 'Bookmark doesn\'t exist' }
          });
        }
        res.bookmark = bookmark; // save the article for the next middleware
        next(); // don't forget to call next so the next middleware happens!
      })
      .catch(next);
  })
  .get((req,res,next) => {
    return res.json(serializeBookmark(res.bookmark));
  })
  .delete((req,res,next) => {

    const { id } = req.params;
    const knexInstance = req.app.get('db');
    bookmarkService.deleteBookmark(knexInstance,id)
      .then(() => {
        res.status(204).end();
      }
      )
      .catch(next);
  })
  .patch(bodyParser,(req,res,next) => {
    const { name, url, description,rating } = req.body;
    const updateBookmark = { name, url, description,rating };
    console.log('here');
    const numberOfValues = Object.values(updateBookmark).filter(Boolean).length;
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: 'Request body must content either \'name\', \'url\' or \'description\', \'rating\''
        }
      });
    }


    bookmarkService.updateBookmark(
      req.app.get('db'),
      req.params.id,
      updateBookmark
    ) .then(updated => {
      res.status(204).end();
    })
      .catch(next);
  });

module.exports = bookmarkRouter;