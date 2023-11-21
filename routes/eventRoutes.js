const AuthChecker = require("../middlewares/AuthChecker");
const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
  // destination: function (req, file, cb) {
  //   cb(null, './uploads');
  // },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null,  uniqueSuffix + file.originalname);
  },
});

const upload = multer({ storage: storage });

const {
  getAllEvent,
  createEvent,
  getSingleEvent,
  updateEvent,
  deleteEvent,
  getUserEvent,
  addComment,
  addLike,
  unLike
} = require("../controllers/EventControllers");

const router = require('express').Router();

router.route('/').get(getAllEvent)
router.route('/:id').get(getSingleEvent);
router.route('/create').post(AuthChecker, upload.single("Eventimage"), createEvent);
router.route('/addcomment').post(AuthChecker, addComment);
router.route('/edit/:id').get(AuthChecker, getUserEvent);
router.route('/like').post(AuthChecker, addLike);
router.route('/unlike').get(AuthChecker, unLike);
router.route('/update').patch(AuthChecker, upload.single("Eventimage"), updateEvent);
router.route('/delete/:id').delete(AuthChecker, deleteEvent);

module.exports = router;