class VideoPlayer {
    constructor() {
        this.video1 = document.getElementById('video1');
        this.video2 = document.getElementById('video2');
        this.playBtn = document.getElementById('playBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.statusText = document.getElementById('statusText');
        
        this.isPlaying = false;
        this.currentVideo = 1;
        this.isLooping = true;
        this.videosLoaded = 0;
        this.totalVideos = 2;
        
        this.initializeEventListeners();
        this.preloadVideos();
    }
    
    initializeEventListeners() {
        this.playBtn.addEventListener('click', () => this.playSequence());
        this.resetBtn.addEventListener('click', () => this.reset());
        
        // Listen for video end events
        this.video1.addEventListener('ended', () => this.onVideoEnd());
        this.video2.addEventListener('ended', () => this.onVideoEnd());
        
        // Listen for video load events
        this.video1.addEventListener('canplaythrough', () => this.onVideoLoaded());
        this.video2.addEventListener('canplaythrough', () => this.onVideoLoaded());
        
        // Listen for play events
        this.video1.addEventListener('play', () => this.updateStatus('Playing: Center-Left Video'));
        this.video2.addEventListener('play', () => this.updateStatus('Playing: Center-Right Video'));
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
        } else {
            this.video2.pause();
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
        } else {
            // Video 2 ended, loop back to video 1 if looping is enabled
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
        if (videoNumber === 1) {
            this.video1.style.display = 'block';
            this.video2.style.display = 'none';
        } else {
            this.video1.style.display = 'none';
            this.video2.style.display = 'block';
        }
    }
    
    reset() {
        this.isPlaying = false;
        this.currentVideo = 1;
        this.playBtn.disabled = false;
        
        // Pause and reset both videos
        this.video1.pause();
        this.video2.pause();
        this.video1.currentTime = 0;
        this.video2.currentTime = 0;
        
        // Show video 1
        this.showVideo(1);
    }
    
    updateStatus(message) {
        this.statusText.textContent = message;
        console.log('Status:', message);
    }
    
    preloadVideos() {
        // Force load both videos
        this.video1.load();
        this.video2.load();
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


