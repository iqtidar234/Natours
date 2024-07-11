const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const { promisify } = require('util');
const sendEmail = require('../utils/email');
const crypto = require('crypto');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user?._id);
  const cookiesOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookiesOptions.secure = true;

  res.cookie('jwt', token, cookiesOptions);
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const user = await User.create({
    name: req?.body?.name,
    email: req?.body?.email,
    password: req?.body?.password,
    passwordConfirm: req?.body?.passwordConfirm,
    passwordChangedAt: req?.body?.passwordChangedAt,
    role: req?.body?.role,
  });
  createSendToken(user, 200, res);
});

exports.login = catchAsync(async (req, res, next) => {
  // if the email and password is missing
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('please provide email and password', 400));
  }

  const user = await User.findOne({ email: email }).select('+password');
  const correct = await user.correctPassword(password, user?.password);
  if (!user || !correct) {
    return next(new AppError('Invalid email or password', 401));
  }
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  //1 Getting token and check of its there
  let token;
  if (
    req?.headers?.authorization &&
    req?.headers?.authorization?.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError('You are not logged in,Please login to get access', 401)
    );
  }

  // 2 Verification Token
  const decoded = await promisify(jwt.verify)(token, process?.env?.JWT_SECRET);

  // 3 check user is still exist
  const currentUser = await User.findById(decoded?.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }
  // 4 Check if user changed password after token was issued
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError('User Recently Changed Password, Please Login Again', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTES
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('you dont have permissione to perform this action')
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user Based on Email
  const user = await User.findOne({ email: req?.body?.email });
  if (!user) {
    return next(new AppError('There is no user with email Address', 404));
  }

  // 2) Generate the random Reset Token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) send it to user email's
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/auth/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a patch request with your new password password confirm to : ${resetUrl} ./n if you didn't forget your password please ignore this email `;

  try {
    await sendEmail({
      email: user?.email,
      subject: 'your password reset token (valid for 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an error sending email , try again later', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Ger user Reset token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req?.params?.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // 2) if token has not expired,and there is user then set the new password
  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }
  user.password = req?.body?.password;
  user.passwordConfirm = req?.body?.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 4) log the user in , send jwt
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user._id).select('+password');

  // 2) check if posted current password is correct
  if (
    !(await user?.correctPassword(req?.body?.passwordCurrent, user?.password))
  ) {
    return next(new AppError('Current password is incorrect', 401));
  }

  // 3) if so update password
  user.password = req?.body?.password;
  user.passwordConfirm = req?.body?.passwordConfirm;
  await user.save();

  // 4) log user in, send jwt
  createSendToken(user, 200, res);
});
