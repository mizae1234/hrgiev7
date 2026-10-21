/**
 * Camera & MediaStream lifecycle utilities
 * Ensures hardware camera tracks are completely stopped and resources released
 */

export function stopMediaStream(
  stream: MediaStream | null | undefined,
  videoElement?: HTMLVideoElement | null
) {
  if (stream) {
    try {
      const tracks = stream.getTracks();
      tracks.forEach((track) => {
        track.stop();
        track.enabled = false;
      });
    } catch (err) {
      console.warn("Failed to stop media track:", err);
    }
  }

  if (videoElement) {
    try {
      videoElement.pause();
      videoElement.srcObject = null;
    } catch {}
  }
}

/**
 * Comprehensive DOM & browser sweep to stop any running camera streams
 */
export function stopAllActiveMediaStreams() {
  if (typeof window === "undefined") return;

  try {
    // 1. Scan all video elements on page
    const videoElements = document.querySelectorAll("video");
    videoElements.forEach((video) => {
      if (video.srcObject && typeof (video.srcObject as MediaStream).getTracks === "function") {
        (video.srcObject as MediaStream).getTracks().forEach((t) => {
          try {
            t.stop();
            t.enabled = false;
          } catch {}
        });
        video.srcObject = null;
      }
      try {
        video.pause();
      } catch {}
    });

    // 2. Clear any globally attached streams
    if ((window as any).__currentMediaStream) {
      try {
        (window as any).__currentMediaStream.getTracks().forEach((t: MediaStreamTrack) => {
          t.stop();
          t.enabled = false;
        });
        (window as any).__currentMediaStream = null;
      } catch {}
    }
  } catch (err) {
    console.warn("Error in stopAllActiveMediaStreams:", err);
  }
}
