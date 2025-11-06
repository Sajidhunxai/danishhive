# Sound Notification Setup

## Instructions

1. Place your `notification.mp3` file in the `/public` folder
2. The sound will automatically play when:
   - A new message is received (via polling every 10 seconds)
   - A message is sent (immediate feedback)
   - New messages arrive while viewing a conversation

## File Location
```
/public/notification.mp3
```

## Features
- Sound plays at 50% volume
- Preloads on app initialization for better performance
- Handles errors gracefully if sound file is missing
- Only plays for messages from other users (not your own sent messages)

## Testing
1. Add a `notification.mp3` file to the `public` folder
2. Send a message - you should hear the sound
3. Have someone else send you a message - you should hear the sound
4. Open a conversation and wait for new messages - sound should play

