const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  shortdescription: {
    type: String,
    required: true,
  },
  
  category: {
    type: String,
    required: true,
  },
  longdescription: {
    type: String,
    required: true,
  },
  blogimage: {
    type: String,
  },
  view: {
    type: Number,
    default: 0,
  },
  like: {
    type: Array,
  },
  comment: {
    type: Array,
  },
  authorid: {
    type: mongoose.Types.ObjectId,
    ref: 'Users',
    required: true,
  }
}, {timestamps: true});

const Event = mongoose.model("event", eventSchema);

module.exports = Event;
