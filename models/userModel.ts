import mongoose, { Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface UserDocument extends Document {
	name: string;
	password: string;
	passwordConfirm: string | undefined;
	passwordChangedAt: Date | undefined;
	changedPasswordAfter: (JWTTimestamp: number) => boolean;
	correctPassword: (candidatePassword: string, userPassword: string) => Promise<boolean>;
}

const Schema = new mongoose.Schema<UserDocument>({
	name: {
		type: String,
		required: [true, 'Please tell us your name!'],
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
			validator: function(this: UserDocument) {
				return this.password === this.passwordConfirm;
			}
		}
	}
});

// Encrypt password before saving using mongoose middleware
Schema.pre<UserDocument>('save', async function(next): Promise<void> {
	// Only run this function if password was actually modified
	if (!this.isModified('password')) return next();

	// Hash the password and add salt of 12 characters
	this.password = await bcrypt.hash(this.password, 12);
	// Delete passwordConfirm field
	this.passwordConfirm = undefined;

	next();
});

// Check if password is correct
Schema.methods.correctPassword = async function(candidatePassword: string, userPassword: string): Promise<boolean> {
	return await bcrypt.compare(candidatePassword, userPassword);
};

// Check if password was changed after JWT token was issued
Schema.methods.changedPasswordAfter = function(JWTTimestamp: number): boolean {
	if (this.passwordChangedAt) {
		// Convert passwordChangedAt to seconds
		const changedTimestamp: number = this.passwordChangedAt.getTime() / 1000;
		// If password was changed after JWT token was issued, return true
		return JWTTimestamp < changedTimestamp;
	}

	// If passwordChangedAt is undefined, then password was not ever changed
	// and therefore the password could not have been modified after the JWT token was issued
	return false;
};

const User = mongoose.model<UserDocument>('User', Schema);
export default User;