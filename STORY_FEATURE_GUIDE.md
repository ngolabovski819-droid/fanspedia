# 📱 OnlyFans Story Feature Integration Guide

## Overview
Display OnlyFans creator stories with an animated gradient ring (like Instagram) and video modal player.

## Demo
Open `story-demo.html` in your browser to see it working!

## Features
✅ Animated gradient ring around avatar when story exists  
✅ Play badge indicator  
✅ Full-screen video modal with controls  
✅ Mobile-responsive design  
✅ Keyboard shortcuts (ESC to close)  
✅ Click backdrop to close  

## Database Fields
Your scraper now captures these fields:
- `stories` - First story video URL (full quality)
- `stories_preview` - Preview/thumbnail URL (lower quality)

## Quick Integration Steps

### 1. Check if Creator Has Story
```javascript
const hasStory = creator.stories || creator.stories_preview;
if (hasStory) {
  // Show story indicator
}
```

### 2. Add Story Ring to Avatar
```html
<div class="avatar-container has-story" onclick="openStory(creator)">
  <img src="..." class="avatar-img">
  <div class="story-badge">
    <i class="fas fa-play"></i>
  </div>
</div>
```

### 3. Add CSS (from story-demo.html)
Copy these CSS classes:
- `.avatar-container.has-story::before` - Animated gradient ring
- `.story-badge` - Play icon badge
- `.story-modal` - Full-screen modal overlay
- `.story-content` - Video container
- `.story-controls` - Play/pause/mute buttons

### 4. Add Modal HTML (once per page)
```html
<div class="story-modal" id="storyModal">
  <div class="story-content">
    <div class="story-close" onclick="closeStoryModal()">
      <i class="fas fa-times"></i>
    </div>
    <div class="story-header">
      <img class="story-header-avatar" src="" alt="Avatar">
      <div class="story-header-info"></div>
    </div>
    <video class="story-video" id="storyVideo" controls autoplay playsinline>
      <source src="" type="video/mp4">
    </video>
    <div class="story-controls">
      <div class="story-btn" onclick="document.getElementById('storyVideo').currentTime = 0">
        <i class="fas fa-redo"></i>
      </div>
      <div class="story-btn" onclick="toggleStoryPlay()">
        <i class="fas fa-pause" id="playPauseIcon"></i>
      </div>
      <div class="story-btn" onclick="toggleStoryMute()">
        <i class="fas fa-volume-up" id="muteIcon"></i>
      </div>
    </div>
  </div>
</div>
```

### 5. Add JavaScript Functions
```javascript
function openStoryModal(creator) {
  const storyUrl = creator.stories || creator.stories_preview;
  if (!storyUrl) return;
  
  const modal = document.getElementById('storyModal');
  const video = document.getElementById('storyVideo');
  const source = video.querySelector('source');
  
  // Update content
  modal.querySelector('.story-header-avatar').src = creator.avatar;
  modal.querySelector('.story-header-info').textContent = creator.name || creator.username;
  source.src = storyUrl;
  video.load();
  
  // Show modal
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeStoryModal() {
  const modal = document.getElementById('storyModal');
  const video = document.getElementById('storyVideo');
  modal.classList.remove('active');
  video.pause();
  document.body.style.overflow = '';
}

function toggleStoryPlay() {
  const video = document.getElementById('storyVideo');
  video.paused ? video.play() : video.pause();
}

function toggleStoryMute() {
  const video = document.getElementById('storyVideo');
  video.muted = !video.muted;
  document.getElementById('muteIcon').className = 
    video.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
}
```

## Where to Add on Your Site

### On Search Results / Category Pages
```javascript
// In your card rendering function
if (creator.stories || creator.stories_preview) {
  avatarContainer.classList.add('has-story');
  avatarContainer.onclick = () => openStoryModal(creator);
  
  const badge = document.createElement('div');
  badge.className = 'story-badge';
  badge.innerHTML = '<i class="fas fa-play"></i>';
  avatarContainer.appendChild(badge);
}
```

### On Creator Profile Page
```javascript
// When rendering profile
if (currentCreator.stories || currentCreator.stories_preview) {
  profileAvatar.parentElement.classList.add('has-story');
  profileAvatar.parentElement.onclick = () => openStoryModal(currentCreator);
  
  // Add badge
  const badge = document.createElement('div');
  badge.className = 'story-badge';
  badge.innerHTML = '<i class="fas fa-play"></i>';
  profileAvatar.parentElement.appendChild(badge);
}
```

## API/Backend Integration

### When Fetching Creator Data
Your API already returns the `stories` and `stories_preview` fields from the database.

Example API response:
```json
{
  "id": 402490649,
  "username": "sharnabeckman",
  "name": "Sharna Beckman",
  "avatar": "https://...",
  "stories": "https://cdn.onlyfans.com/..../video.mp4",
  "stories_preview": "https://cdn.onlyfans.com/..../preview.mp4"
}
```

### Scraper Already Captures
The v2_id_scanner.py already extracts:
- `creator.stories` - First story file URL
- `creator.stories_preview` - Preview URL

Just run your scanner and the data will be in the database!

## Testing

1. Open `story-demo.html` in browser
2. Click the avatar or "View Story" button
3. Video modal should open with controls
4. Test play/pause, mute, restart buttons
5. Test ESC key and backdrop click to close

## Browser Compatibility
✅ Chrome/Edge (Chromium)  
✅ Firefox  
✅ Safari (iOS/macOS)  
✅ Mobile browsers  

## Performance Tips
- Use `loading="lazy"` on story modal HTML (it's hidden by default)
- Preload only when avatar is clicked (not on page load)
- Consider using `stories_preview` for faster loading on mobile

## Troubleshooting

**Story ring not showing:**
- Check if `creator.stories` or `creator.stories_preview` has value
- Verify CSS includes `.has-story::before` with gradient animation

**Video not playing:**
- Check video URL is accessible (not 404)
- Verify CORS headers if serving from different domain
- Try using `stories_preview` URL instead

**Modal not closing:**
- Ensure `closeStoryModal()` is defined globally
- Check modal backdrop click listener is attached
- Verify ESC key handler is registered

## Future Enhancements
- Story expiration timer (24hr like Instagram)
- Multiple stories carousel (swipe left/right)
- Story views counter
- Story upload timestamp
- Auto-advance to next creator's story

---

**Questions?** Check the demo file or reach out for support!
