const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
const sharp = require('sharp');
const multer = require('multer');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 40), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadUserPhoto = upload.single('photo');
exports.resizeUserPhoto = (req, res, next) => {
  if (!req.file) return next();

  // resize image using Sharp
  req.file.fileName = `user-${req.user.id}-${Date.now()}.jpeg`;
  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
};

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) newObj[key] = obj[key];
  });
  return newObj;
};

exports.getUsers = catchAsync(async (req, res) => {
  const users = await User.find();
  // SENDING RESPONSE
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  console.log(req.file);
  // 1) Create error if user posted password data
  if (req?.body?.password || req?.body?.passwordConfirm) {
    return next(
      new AppError(
        'This route is not allowed for password update,please use /updateMyPassword'
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to update
  const filterdBody = filterObj(req.body, 'name', 'email');
  if (req.file) filterdBody.photo = req.file.filename;
  // 3) update user document
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filterdBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    data: { user: updatedUser },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req?.user.id, { active: false });

  res.status(204).json({
    status: 'success',
  });
});

exports.createUser = (req, res) => {
  res
    .status(500)
    .json({ status: 'Error', message: 'This Route is not Yet Defined' });
};
exports.getUser = (req, res) => {
  res
    .status(500)
    .json({ status: 'Error', message: 'This Route is not Yet Defined' });
};
exports.updateUser = (req, res) => {
  res
    .status(500)
    .json({ status: 'Error', message: 'This Route is not Yet Defined' });
};
exports.deleteUser = (req, res) => {
  res
    .status(500)
    .json({ status: 'Error', message: 'This Route is not Yet Defined' });
};
