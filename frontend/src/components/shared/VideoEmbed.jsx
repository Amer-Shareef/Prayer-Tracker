import React from 'react';

// Utility function to extract YouTube video ID from URL
const extractYouTubeVideoId = (url) => {
  if (!url) return null;
  
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
};

// Utility function to check if URL is a YouTube URL
const isYouTubeUrl = (url) => {
  if (!url) return false;
  return url.includes('youtube.com') || url.includes('youtu.be');
};

// Component to render video content
const VideoEmbed = ({ videoUrl, className = '' }) => {
  if (!videoUrl) return null;

  // Handle YouTube URLs
  if (isYouTubeUrl(videoUrl)) {
    const videoId = extractYouTubeVideoId(videoUrl);
    if (videoId) {
      return (
        <div className={`relative w-full ${className}`} style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
  }

  // Handle other video URLs (direct links to video files)
  if (videoUrl.match(/\.(mp4|webm|ogg)$/i)) {
    return (
      <video 
        className={`w-full rounded-lg ${className}`}
        controls
        preload="metadata"
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    );
  }

  // Fallback: display as a link
  return (
    <div className={`bg-gray-100 border rounded-lg p-4 ${className}`}>
      <div className="flex items-center">
        <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <a 
          href={videoUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Watch Video
        </a>
      </div>
    </div>
  );
};

// Component for feed display with video support
const FeedCard = ({ feed }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-4">
      {/* Feed Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{feed.title}</h3>
      
      {/* Feed Content */}
      <p className="text-gray-700 mb-4">{feed.content}</p>
      
      {/* Image */}
      {feed.image_url && (
        <div className="mb-4">
          <img 
            src={feed.image_url} 
            alt="Feed image"
            className="w-full rounded-lg"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}
      
      {/* Video */}
      {feed.video_url && (
        <div className="mb-4">
          <VideoEmbed videoUrl={feed.video_url} />
        </div>
      )}
      
      {/* Feed Meta Information */}
      <div className="flex items-center justify-between text-sm text-gray-500 mt-4 pt-4 border-t">
        <div className="flex items-center">
          <span className="mr-4">By: {feed.author_name || feed.author_full_name}</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            feed.priority === 'urgent' ? 'bg-red-100 text-red-800' :
            feed.priority === 'high' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {feed.priority}
          </span>
        </div>
        <span>{new Date(feed.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

export { VideoEmbed, FeedCard, extractYouTubeVideoId, isYouTubeUrl };
