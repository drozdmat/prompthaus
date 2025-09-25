class VideoPlayer {
    constructor() {
        this.video1 = document.getElementById('video1');
        this.video2 = document.getElementById('video2');
        this.video3 = document.getElementById('video3');
        this.video4 = document.getElementById('video4');
        this.video5 = document.getElementById('video5');
        this.video6 = document.getElementById('video6');
        this.playBtn = document.getElementById('playBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.statusText = document.getElementById('statusText');
        
        this.isPlaying = false;
        this.currentVideo = 1;
        this.isLooping = true;
        this.videosLoaded = 0;
        this.totalVideos = 6;
        
        this.initializeEventListeners();
        this.preloadVideos();
    }
    
    initializeEventListeners() {
        this.playBtn.addEventListener('click', () => this.playSequence());
        this.resetBtn.addEventListener('click', () => this.reset());
        
        // Listen for video end events
        this.video1.addEventListener('ended', () => this.onVideoEnd());
        this.video2.addEventListener('ended', () => this.onVideoEnd());
        this.video3.addEventListener('ended', () => this.onVideoEnd());
        this.video4.addEventListener('ended', () => this.onVideoEnd());
        this.video5.addEventListener('ended', () => this.onVideoEnd());
        this.video6.addEventListener('ended', () => this.onVideoEnd());
        
        // Listen for video load events
        this.video1.addEventListener('canplaythrough', () => this.onVideoLoaded());
        this.video2.addEventListener('canplaythrough', () => this.onVideoLoaded());
        this.video3.addEventListener('canplaythrough', () => this.onVideoLoaded());
        this.video4.addEventListener('canplaythrough', () => this.onVideoLoaded());
        this.video5.addEventListener('canplaythrough', () => this.onVideoLoaded());
        this.video6.addEventListener('canplaythrough', () => this.onVideoLoaded());
        
        // Listen for play events
        this.video1.addEventListener('play', () => this.updateStatus('Playing: Mateusz Entering'));
        this.video2.addEventListener('play', () => this.updateStatus('Playing: Mateusz Leaving'));
        this.video3.addEventListener('play', () => this.updateStatus('Playing: Kacper Entering'));
        this.video4.addEventListener('play', () => this.updateStatus('Playing: Kacper Leaving'));
        this.video5.addEventListener('play', () => this.updateStatus('Playing: Jakub Entering'));
        this.video6.addEventListener('play', () => this.updateStatus('Playing: Jakub Leaving'));
    }
    
    playSequence() {
        if (this.isPlaying) {
            this.pauseSequence();
            return;
        }
        
        this.isPlaying = true;
        this.playBtn.disabled = false;
        
        // Start with video 1
        this.currentVideo = 1;
        this.showVideo(1);
        this.video1.play().catch(error => {
            console.error('Error playing video 1:', error);
            this.isPlaying = false;
        });
    }
    
    pauseSequence() {
        this.isPlaying = false;
        
        if (this.currentVideo === 1) {
            this.video1.pause();
        } else if (this.currentVideo === 2) {
            this.video2.pause();
        } else if (this.currentVideo === 3) {
            this.video3.pause();
        } else if (this.currentVideo === 4) {
            this.video4.pause();
        } else if (this.currentVideo === 5) {
            this.video5.pause();
        } else {
            this.video6.pause();
        }
        
    }
    
    onVideoEnd() {
        if (this.currentVideo === 1) {
            // Video 1 ended, start video 2
            this.currentVideo = 2;
            this.showVideo(2);
            this.video2.play().catch(error => {
                console.error('Error playing video 2:', error);
                this.isPlaying = false;
            });
        } else if (this.currentVideo === 2) {
            // Video 2 ended, start video 3
            this.currentVideo = 3;
            this.showVideo(3);
            this.video3.play().catch(error => {
                console.error('Error playing video 3:', error);
                this.isPlaying = false;
            });
        } else if (this.currentVideo === 3) {
            // Video 3 ended, start video 4
            this.currentVideo = 4;
            this.showVideo(4);
            this.video4.play().catch(error => {
                console.error('Error playing video 4:', error);
                this.isPlaying = false;
            });
        } else if (this.currentVideo === 4) {
            // Video 4 ended, start video 5
            this.currentVideo = 5;
            this.showVideo(5);
            this.video5.play().catch(error => {
                console.error('Error playing video 5:', error);
                this.isPlaying = false;
            });
        } else if (this.currentVideo === 5) {
            // Video 5 ended, start video 6
            this.currentVideo = 6;
            this.showVideo(6);
            this.video6.play().catch(error => {
                console.error('Error playing video 6:', error);
                this.isPlaying = false;
            });
        } else {
            // Video 6 ended, loop back to video 1 if looping is enabled
            if (this.isLooping) {
                this.currentVideo = 1;
                this.showVideo(1);
                this.video1.play().catch(error => {
                    console.error('Error playing video 1:', error);
                    this.isPlaying = false;
                });
            } else {
                // Sequence complete
                this.isPlaying = false;
            }
        }
    }
    
    showVideo(videoNumber) {
        // Hide all videos first
        this.video1.style.display = 'none';
        this.video2.style.display = 'none';
        this.video3.style.display = 'none';
        this.video4.style.display = 'none';
        this.video5.style.display = 'none';
        this.video6.style.display = 'none';
        
        // Show the selected video
        if (videoNumber === 1) {
            this.video1.style.display = 'block';
        } else if (videoNumber === 2) {
            this.video2.style.display = 'block';
        } else if (videoNumber === 3) {
            this.video3.style.display = 'block';
        } else if (videoNumber === 4) {
            this.video4.style.display = 'block';
        } else if (videoNumber === 5) {
            this.video5.style.display = 'block';
        } else if (videoNumber === 6) {
            this.video6.style.display = 'block';
        }
    }
    
    reset() {
        this.isPlaying = false;
        this.currentVideo = 1;
        this.playBtn.disabled = false;
        
        // Pause and reset all videos
        this.video1.pause();
        this.video2.pause();
        this.video3.pause();
        this.video4.pause();
        this.video5.pause();
        this.video6.pause();
        this.video1.currentTime = 0;
        this.video2.currentTime = 0;
        this.video3.currentTime = 0;
        this.video4.currentTime = 0;
        this.video5.currentTime = 0;
        this.video6.currentTime = 0;
        
        // Show video 1
        this.showVideo(1);
    }
    
    updateStatus(message) {
        this.statusText.textContent = message;
        console.log('Status:', message);
    }
    
    preloadVideos() {
        // Force load all videos
        this.video1.load();
        this.video2.load();
        this.video3.load();
        this.video4.load();
        this.video5.load();
        this.video6.load();
    }
    
    onVideoLoaded() {
        this.videosLoaded++;
        if (this.videosLoaded === this.totalVideos) {
            this.startAutoplay();
        }
    }
    
    startAutoplay() {
        // Start autoplay once both videos are fully loaded
        this.isPlaying = true;
        this.currentVideo = 1;
        this.showVideo(1);
        this.video1.play().catch(error => {
            console.error('Error with autoplay:', error);
            this.isPlaying = false;
        });
    }
}

// Initialize the video player when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new VideoPlayer();
});


