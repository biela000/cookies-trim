import fs from 'fs/promises';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { SongDocument } from '../models/songModel';

export default class SongUtils {
    public static async convertSongToHlsStream(
        song: SongDocument,
        ffmpegOutputDirectory: string,
        songDirectory: string
    ): Promise<ffmpeg.FfmpegCommand | null> {
        // Get the song file path
        const songFilePath: string = path.join(songDirectory, song.filename);

        // Set the ffmpeg output file folder path
        const ffmpegOutputFileDirectory: string =
            path.join(ffmpegOutputDirectory, `${song.filename}`);

        // Set the ffmpeg output file path
        const ffmpegOutputFilePath: string =
            path.join(ffmpegOutputFileDirectory, 'output.m3u8');

        // If the ffmpeg output directory does not exist, create it
        try {
            await fs.access(ffmpegOutputFileDirectory);
            return null;
        } catch (error) {
            await fs.mkdir(ffmpegOutputFileDirectory);
        }

        // Create a new ffmpeg instance
        const ffmpegInstance: ffmpeg.FfmpegCommand = ffmpeg(
            songFilePath,
            { timeout: 432000 }
        );

        // Set the ffmpeg output file path
        ffmpegInstance.output(ffmpegOutputFilePath);

        // Set some ffmpeg options
        ffmpegInstance.addOptions([
            '-profile:v baseline',
            '-level 3.0',
            '-start_number 0',
            '-hls_time 10',
            '-hls_list_size 0',
            '-f hls',
            '-map 0:a'
        ]);

        // Run the ffmpeg command
        ffmpegInstance.run();

        // Return the ffmpeg instance so that it can be used to listen to events
        return ffmpegInstance;
    }
}
