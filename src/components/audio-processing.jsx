import React, { useState } from 'react'

const AudioProcessing = () => {

  const [uploadedFile, setUpoadedFile] = useState(null);
  const [uploadedLink, setUploadedLink] = useState(null);
  const [compressedFile, setCompressedFile] = useState(null);
  const [compressedLink, setCompressedLink] = useState(null);

  // Constants
  const BITS_PER_BYTE = 8;
  const BYTES_PER_KILOBYTE = 1024;
  const BYTES_PER_MEGABYTE = BYTES_PER_KILOBYTE * 1024;
  const MIN_FRAME_RATE = 1;
  const SAFETY_FACTOR = 0.95;

  const calcFileSizeInKb = (frameRate, bitDepth, channels, durationSec) => {
    const sizeInBits = frameRate * bitDepth * channels * durationSec;
    return sizeInBits / (BITS_PER_BYTE * BYTES_PER_KILOBYTE);
  }

  const calcNewFrameRate = (currentFrameRate, currentSizeKb) => {
    const targetSizeKb =
      (3 * BYTES_PER_MEGABYTE) / BYTES_PER_KILOBYTE;
    let reductionFactor = targetSizeKb / currentSizeKb;
    reductionFactor *= SAFETY_FACTOR;
    return Math.max(
      Math.floor(currentFrameRate * reductionFactor),
      MIN_FRAME_RATE
    );
  }

  const compress = async () => {
    try {
      console.log(`Starting compression for ${uploadedFile.name}`);
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const fileData = await uploadedFile.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(fileData);

      // Calculate new frame rate
      const currentFrameRate = audioBuffer.sampleRate;
      const currentSizeKb = calcFileSizeInKb(
        currentFrameRate,
        16, // Assuming 16-bit depth, replace with actual bit depth if different
        audioBuffer.numberOfChannels,
        audioBuffer.duration
      );
      const newFrameRate = calcNewFrameRate(
        currentFrameRate,
        currentSizeKb
      );
      console.log(`New frame rate calculated: ${newFrameRate} Hz`);

      // Modify the audio data to reduce the sample rate
      const newAudioBuffer = await changeSampleRate(audioBuffer, newFrameRate);

      // Encode the modified audio data back into a WAV file format
      const processedWavBlob = encodeAudioBufferToWav(newAudioBuffer);
      const compressedURL = URL.createObjectURL(processedWavBlob);
      setCompressedFile(processedWavBlob);
      setCompressedLink(compressedURL);
    } catch (e) {
      console.error(`Error processing file: ${e}`);
    }
  }

  const changeSampleRate = async (audioBuffer, newSampleRate) => {
    // Create an offline context with the new sample rate.
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      (audioBuffer.length * newSampleRate) / audioBuffer.sampleRate,
      newSampleRate
    );

    // Create a buffer source for the existing audioBuffer.
    const bufferSource = offlineContext.createBufferSource();
    bufferSource.buffer = audioBuffer;

    // Connect the source to the offline context.
    bufferSource.connect(offlineContext.destination);

    // Start the source.
    bufferSource.start();

    // Render the audio from the offline context.
    const renderedBuffer = await offlineContext.startRendering();

    console.log(`Sample rate changed to ${newSampleRate} Hz`);
    return renderedBuffer;
  };

  const encodeAudioBufferToWav = (audioBuffer) => {
    // Create a WAV file using the built-in functions and encode it into a Blob
    const bufferLength = audioBuffer.length;
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const bitsPerSample = 16; // Typical value for WAV files

    // Create a DataView with a buffer the size needed for the WAV file
    const wavHeaderSize = 44; // 44 bytes for the WAV header
    const wavBufferSize =
      (bufferLength * numberOfChannels * bitsPerSample) / 8 + wavHeaderSize;
    const wavBuffer = new ArrayBuffer(wavBufferSize);
    const view = new DataView(wavBuffer);

    // Write the WAV container headers
    // RIFF chunk descriptor
    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + bufferLength * numberOfChannels * 2, true);
    writeString(view, 8, "WAVE");
    // FMT sub-chunk
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(
      28,
      (sampleRate * numberOfChannels * bitsPerSample) / 8,
      true
    ); // ByteRate
    view.setUint16(32, (numberOfChannels * bitsPerSample) / 8, true); // BlockAlign
    view.setUint16(34, bitsPerSample, true);
    // Data sub-chunk
    writeString(view, 36, "data");
    view.setUint32(40, bufferLength * numberOfChannels * 2, true);

    // Write the PCM samples
    let offset = 44;
    for (let i = 0; i < bufferLength; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(
          -1,
          Math.min(1, audioBuffer.getChannelData(channel)[i])
        ); // Clamp the sample to -1, 1
        const intSample = sample < 0 ? sample * 32768 : sample * 32767; // Convert to 16-bit integer
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    // Create and return the Blob with the WAV file data
    const wavBlob = new Blob([view], {
      type: "audio/wav",
    });
    console.log("WAV file encoding complete.");
    return wavBlob;
  }

  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  const handleAudioChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setUpoadedFile(event.target.files[0]);
      setUploadedLink(URL.createObjectURL(event.target.files[0]));
    }
  };

  const handleDelete = () => {
    setUpoadedFile(null);
    setUploadedLink(null);
  };

  const handleDownload = async () => {
    if (!compressedFile) {
      console.error("No resized image available for download.");
      return;
    }

    const link = document.createElement("a");
    link.href = compressedLink;
    link.download = `compressed.wav`; // Set a default filename

    link.click();
  };

  return (
    <div>
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          WAV Audio Compressor
        </h2>
        <p className="text-gray-600">Compress your Audio into WAV files.</p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-lg bg-gray-100 shadow py-4">
        {!uploadedFile && (
          <div className="flex flex-col items-center">
            <p className="text-lg font-medium text-gray-800">
              Upload your Audio here!
            </p>
            <input type="file" onChange={handleAudioChange} className="my-2" />
          </div>
        )}
        {uploadedFile && (
          <div className="relative">
            <button
              className="absolute top-0 right-0 z-10 text-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleDelete}
            >
              [X]
            </button>
            <audio src={uploadedLink} controls />
            <div className='flex flex-row gap-4 justify-center'>
              <button
                onClick={compress}
                className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-700"
              >
                Compress
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Download
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AudioProcessing