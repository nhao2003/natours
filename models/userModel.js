const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Please tell us your name!'] },
    email: {
        type: String,
        required: [true, 'Please provide your email!'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email!'],
    },
    photo: { type: String, default: 'default.jpg' },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user',
    },
    password: {
        type: String,
        required: [true, 'Please provide a password!'],
        minlength: 8,
        select: false,
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password!'],
        validate: {
            // This only works on CREATE and SAVE!!!
            validator: function (el) {
                return el === this.password;
            }
        },
        message: 'Passwords are not the same!',
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    //select false means that this field will not be displayed in the output
    active: { type: Boolean, default: true, select: false },
});

userSchema.pre('save', async function (next) {
    // Only run this function if password was actually modified
    if (!this.isModified('password')) return next();
    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    // Delete passwordConfirm field
    this.passwordConfirm = undefined;
    next();
});

// This middleware will run before the document is saved to the database
userSchema.pre('save', function (next) {
    // If the password was not modified or the document is new, do not update the passwordChangedAt field
    if (!this.isModified('password') || this.isNew) return next();
    // Subtract 1 second from the passwordChangedAt field to make sure that the token is always created after the password was changed
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

// This middleware will run before the find query is executed
userSchema.pre(/^find/, function (next) {
    // this points to the current query
    // Only find the users that have the active field set to true
    this.find({ active: { $ne: false } });
    next();
});

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        console.log(changedTimestamp, JWTTimestamp);
        return JWTTimestamp < changedTimestamp;
    }
    // False means NOT changed
    return false;
};

//    Explanation of the process:
// 1. A random token is generated using crypto.randomBytes(32).
//    This token is used to verify the user's identity during the password reset process.
//    It's a random string of 32 bytes (256 bits).
// 2. The generated token is then hashed using the SHA-256 algorithm.
//    Hashing is a one-way process that produces a fixed-length string of characters from the input data.
//    This hashed token is stored in the user's database record.
// 3. The passwordResetExpires field is set to the current timestamp plus 10 minutes (in milliseconds).
//    This indicates the time until which the password reset token is valid.
// 4. The original, unhashed resetToken is returned.
//    This can be used to send the token to the user via email or other communication channels,
//    allowing them to initiate the password reset process.
userSchema.methods.createPasswordResetToken = function () {
    // Generate a random token of 32 bytes and convert it to a hexadecimal string
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash the generated resetToken using the SHA-256 algorithm and update the user's passwordResetToken field with the hashed token
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set the passwordResetExpires field to the current timestamp plus 10 minutes (in milliseconds)
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    console.log({ resetToken }, this.passwordResetToken);

    // Return the original resetToken (not hashed) to potentially send it via email or other means to the user
    return resetToken;
};


const User = mongoose.model('User', userSchema);

module.exports = User;
