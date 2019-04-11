'use strict';

const bookmarkService = {
  getAllBookmarks(db) {
    return (
      db.select('*').from('bookmarks')
    );
  },

  getBookmarkById(db, id) {
    return (
      db.select('*').from('bookmarks').where('id', id).first()
    );
  },

  deleteBookmark(db, id) {
    return (
      db.select('*').from('bookmarks').where('id', id).delete()
    );
  },

  insertBookmark(db, newItem) {
    return db.insert(newItem).into('bookmarks')
      .returning('*')
      .then(rows => {
        return rows[0];
      });
    
  },

  updateBookmark(db, id, updates) {
    return (
      db('bookmarks')
        .where({id})
        .update(updates)
    );
  } 
};



module.exports = bookmarkService;
