const eventJoiSchema = require("../utils/EventJoiSchema");
const CommentJoiSchema = require("../utils/CommentJoiSchema");
const cookieParser = require("cookie-parser");
const { StatusCodes } = require("http-status-codes");
const fs = require("fs");
const event = require("../models/eventSchema");
const user = require("../models/authSchema");
const {
  UnAuthorizedError,
  NotFoundError,
  ValidationError,
} = require("../errors");
const cloudinary = require("../utils/CloudinaryFileUpload");

const getAllEvent = async (req, res) => {
  try {
    const allevent = await event.find();

    if (allevent.length === 0) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "No events found" });
    }

    return res.status(StatusCodes.OK).json({ allevent, message: "All event" });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error });
  }
};

const createEvent = async (req, res) => {
  const { title, shortdescription, longdescription, category } = req.body;

  try {
    const currentUser = req.user;

    if (!currentUser) {
      throw new UnAuthorizedError("User not found");
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { originalname, size, mimetype, path } = req.file;

    const eventphoto = await cloudinary.uploader.upload(path, {
      use_filename: true,
      folder: "AlleventsImage",
    });

    if (!eventphoto.secure_url) {
      throw new Error("Failed to upload file to Cloudinary");
    }

    const newevent = {
      title,
      shortdescription,
      longdescription,
      category,
      eventimage: eventphoto.secure_url,
      authorid: currentUser._id,
    };

    const { error, value } = eventJoiSchema.validate(newevent);

    if (error) {
      throw new ValidationError("Invalid event information");
    }

    const eventData = await event.create(value);

    currentUser.mypost.push(eventData._id);

    await currentUser.save();

    return res.status(StatusCodes.CREATED).json({
      eventData,
      message: "event created successfully",
    });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

const getSingleEvent = async (req, res) => {
  const { id } = req.params;

  try {
    const eventdata = await event.findById(id);

    if (!eventdata) {
      throw new NotFoundError("event not found");
    }

    // Check if the user has already viewed this post
    const hasUserViewed = req.cookies[`viewed_${id}`];

    if (!hasUserViewed && req.method === "GET") {
      // Increment the view count
      console.log("not viewed yet");
      eventdata.view = (eventdata.view || 0) + 1;

      // Set a cookie to mark that the user has viewed this post
      res.cookie(`viewed_${id}`, "true", { maxAge: 24 * 60 * 60 * 1000 }); // 1 day expiry

      await eventdata.save();
    }

    console.log("has viewed");

    return res.status(StatusCodes.OK).json({ eventdata });
  } catch (error) {
    console.error("Error in getSingleevent:", error); // Log the error for debugging
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal Server Error" });
  }
};

const updateEvent = async (req, res) => {
  const { title, shortdescription, longdescription, category, eventid } =
    req.body;

  try {
    const eventdata = await event.findById(eventid);

    const olduser = await req.user._id;

    if (!eventdata) {
      throw new NotFoundError("event not found");
    } else if (
      !olduser &&
      eventdata.authorid.toString() !== olduser.toString()
    ) {
      throw new UnAuthorizedError("User not authorized");
    }

    if (req.file === undefined) {
      const oldpost = {
        title,
        shortdescription,
        longdescription,
        category,
      };

      const updatedevent = await event.findByIdAndUpdate(eventid, oldpost, {
        new: true,
      });

      return res
        .status(StatusCodes.OK)
        .json({ data: updatedevent, message: "event updated successfully" });
    }

    const { path } = req.file;

    const eventphoto = await cloudinary.uploader.upload(path, {
      use_filename: true,
      folder: "AlleventsImage",
    });

    const oldpost = {
      title,
      shortdescription,
      longdescription,
      category,
      eventimage: eventphoto.secure_url,
    };

    const updatedevent = await event.findByIdAndUpdate(eventid, oldpost, {
      new: true,
    });

    res
      .status(StatusCodes.OK)
      .json({ data: updatedevent, message: "event updated successfully" });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error });
  }
};

const deleteEvent = async (req, res) => {
  const { id } = req.params;

  try {
    const eventdata = await event.findById(id);

    const olduser = req.user._id;

    if (!eventdata) {
      throw new NotFoundError("event not found");
    } else if (eventdata.authorid.toString() !== olduser.toString()) {
      throw new UnAuthorizedError("User not authorized");
    }

    const userid = olduser.toString();

    try {
      const getUserinfo = await user.findById(userid);
      const userpost = getUserinfo.mypost;
      const index = userpost.indexOf(id);

      if (index !== -1) {
        console.log(index);

        // Remove the element from the array and store it in changeid
        await userpost.splice(index, 1);

        await event.findByIdAndDelete(id);

        // Save the changes to the mypost array
        await getUserinfo.save();

        res
          .status(StatusCodes.OK)
          .json({ message: "event deleted successfully" });
      }
    } catch (error) {
      console.error(error);
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "An error occurred while updating user data" });
    }
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error });
  }
};

const getUserEvent = async (req, res) => {
  const { id } = req.params;

  try {
    const oldevent = await event.findById(id);

    if (!oldevent) {
      throw new NotFoundError("event does not exist");
    }

    const getUserId = await req.user._id;

    if (!getUserId && getUserId !== oldevent.authorid) {
      throw new NotFoundError("Unauthorized");
    }

    res.status(StatusCodes.OK).json({ oldevent });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

//event comment controller
const addComment = async (req, res) => {
  const { comment, eventid } = req.body;

  try {
    const currentUser = req.user;

    if (!currentUser) {
      throw new UnAuthorizedError("User not found");
    }

    const eventData = await event.findById(eventid);

    if (!eventData) {
      return res.status(404).json({ error: "event not found" });
    }

    const newComment = {
      usercomment: comment,
      userid: String(currentUser._id),
    };

    const { error, value } = CommentJoiSchema.validate(newComment);

    if (error) {
      throw new ValidationError("Invalid comment information");
    }

    // const commentData = await Comment.create(value);

    // Add the new comment to the event's comment array
    eventData.comment.unshift(value);

    await eventData.save();

    console.log(eventData.comment);

    return res.status(StatusCodes.CREATED).json({
      commentData,
      message: "Comment added successfully",
    });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

const addLike = async (req, res) => {
  const { eventid } = req.body;
  console.log(eventid);

  try {
    const eventdata = await event.findById(eventid);

    const olduser = await req.user._id;
    let userid = String(olduser);
    console.log(userid);

    if (!eventdata) {
      console.log("event not found");
      throw new NotFoundError("event not found");
    } else if (!olduser) {
      console.log("User not found");
      throw new UnAuthorizedError("User not authorized");
    } else if (eventdata.like.includes(userid)) {
      const index = eventdata.like.indexOf(userid);
      eventdata.like.splice(index, 1);

      eventdata.save();

      console.log("Like removed with userid: " + userid);

      return res.status(StatusCodes.OK).json({ message: "Like removed" });
    }

    eventdata.like.push(userid);

    eventdata.save();

    console.log("Like added with userid: " + userid);

    res.status(StatusCodes.OK).json({ message: "Like added" });
  } catch (error) {}
};

const unLike = async (req, res) => {
  const { eventid } = req.body;

  try {
    const eventdata = await event.findById(eventid);

    const olduser = await req.user._id;

    let userid = String(olduser);

    if (!eventdata) {
      throw new NotFoundError("event not found");
    } else if (!olduser) {
      throw new UnAuthorizedError("User not authorized");
    }

    if (eventdata.like.includes(userid)) {
      const index = eventdata.like.indexOf(userid);
      eventdata.like.splice(index, 1);

      eventdata.save();
    }

    res.status(StatusCodes.OK).json({ message: "Unlike successfully" });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error });
  }
};

module.exports = {
  getAllEvent,
  createEvent,
  getSingleEvent,
  updateEvent,
  deleteEvent,
  getUserEvent,
  addComment,
  addLike,
  unLike,
};
