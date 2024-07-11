const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');

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
