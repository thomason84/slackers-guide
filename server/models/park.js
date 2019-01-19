var mongoose = require("mongoose");

//Park model with validation
var Park = mongoose.model("Park", {
  name: {
    type: String,
    required: true,
    minlength: 5,
    trim: true
  },
  description: {
    type: String,
    required: true,
    minlength: 5,
    trim: true
  },
  visited: {
    type: Boolean,
    default: false,
    required: true
  }
});

module.exports = { Park };
