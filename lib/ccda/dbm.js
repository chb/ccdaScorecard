var db = require("../config").db;

var count = 0;

module.exports = {
  inc: function(){ 
    count++;
  },
  dec: function(){
    count--;
    setTimeout(function(){if (count <= 0) db.close();}, 100);
  }
};
