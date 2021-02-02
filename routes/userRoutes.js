const express = require('express');
const userController = require('../controllers/userController');
const { signUp, logIn, logOut, forgotPassword, resetPassword, updatePassword, protectRoute, restrictRoute } = require('../utils/apiAuth');
const { uploadUserImage, resizeUserImage } = require('../utils/uploadFuncs');
const logInLimiter = require('../utils/limiterFuncs');

const router = express.Router();
const { getAllUsers, getUser, updateUser, updateCurrentUser, deleteCurrentUser, deleteUser, currentUser } = userController;

// aliasing
router.post('/signup', signUp);
router.post('/login', logInLimiter, logIn);
router.get('/logout', logOut);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);

// Protecting all routes below this middleware
router.use(protectRoute);

router.patch('/update-password', updatePassword);
router.get('/current-user', currentUser, getUser);
router.patch('/update-user', uploadUserImage, resizeUserImage, updateCurrentUser);
router.delete('/delete-user', deleteCurrentUser);

router.use(restrictRoute(['admin']));

// routes -> Admin
router.route('/').get(getAllUsers);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
