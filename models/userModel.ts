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

Schema.pre<UserDocument>('save', async function(next) {
	if (!this.isModified('password')) return next();
	this.password = await bcrypt.hash(this.password, 12);
	this.passwordConfirm = undefined;
	next();
});

Schema.methods.correctPassword = async function(candidatePassword: string, userPassword: string) {
	return await bcrypt.compare(candidatePassword, userPassword);
};

Schema.methods.changedPasswordAfter = function(JWTTimestamp: number) {
	if (this.passwordChangedAt) {
		const changedTimestamp = this.passwordChangedAt.getTime() / 1000;
		return JWTTimestamp < changedTimestamp;
	}
	return false;
};

const User = mongoose.model<UserDocument>('User', Schema);
export default User;