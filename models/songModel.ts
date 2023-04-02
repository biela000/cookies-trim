import mongoose from 'mongoose';

export interface SongDocument extends mongoose.Document {
	title: string;
	filename: string;
	album: string;
	artist: string;
	year: string;
	track: string;
	genre: string;
	cover: string;
	duration: number;
	plays: number;
	favorite: boolean;
	addedAt: Date;
}

const Schema = new mongoose.Schema<SongDocument>({
	title: {
		type: String,
		required: [true, 'Please provide a title!'],
	},
	filename: {
		type: String,
		required: [true, 'Please provide a filename!'],
	},
	album: {
		type: String,
		default: 'Unknown',
	},
	artist: {
		type: String,
		default: 'Unknown',
	},
	year: {
		type: String,
		default: 'Unknown',
	},
	track: {
		type: mongoose.Schema.Types.Mixed,
		default: { no: null, of: null },
	},
	genre: {
		type: String,
		default: 'Unknown',
	},
	cover: {
		data: Buffer,
		contentType: String,
	},
	duration: {
		type: Number,
		default: 0,
	},
	plays: {
		type: Number,
		default: 0,
	},
	favorite: {
		type: Boolean,
		default: false,
	},
	addedAt: {
		type: Date,
		default: new Date(),
	}
});

const Song = mongoose.model('Song', Schema);
export default Song;