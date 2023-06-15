const audio = document.querySelector('audio.song-audio');
const audioSource = `/api/v1/songs/stream/${audio.dataset.filename}/output.m3u8`;

// TODO: linter does not see Hls, do something so it does i guess

if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(audioSource);
    hls.attachMedia(audio);
} else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
    audio.src = audioSource;
}
