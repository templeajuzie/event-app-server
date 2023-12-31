const {
  signUp,
  signIn,
  userRecovery,
  userUpdatePassword,
  userVerifyPasswordReset,
  singleUser,
  checkUsername,
  currentUser,
  userUpdate,
  userSignOut,
  userDelete,
} = require('../controllers/authControllers');

const router = require('express').Router();
const authChecker = require('../middlewares/AuthChecker');
const path = require('path');
const multer = require('multer');


const storage = multer.diskStorage({
  // destination: function (req, file, cb) {
  //   cb(null, './uploads');
  // },
  
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + file.originalname);
  },
});

const upload = multer({ storage: storage });


router.route('/signup').post(signUp);
router.route('/signin').post(signIn);
router.route('/checkusername').post(checkUsername);
router.route('/recovery').post(userRecovery);
router.route('/account/signout').delete(authChecker, userSignOut);

router.route('/user/:id').get(singleUser);

router.route('/account/updatepassword/:token').get(userVerifyPasswordReset);
router.route('/account/updatepassword/').post(userUpdatePassword);
router.route('/account').get(authChecker, currentUser);
router.route('/account').patch(authChecker, upload.single('userphoto'), userUpdate);
router.route('/account').delete(authChecker, userDelete);

module.exports = router;
