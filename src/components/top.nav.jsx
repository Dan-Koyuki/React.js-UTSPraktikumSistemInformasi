import React, { useState } from 'react'
import ImageProcessing from './images-processing';
import AudioProcessing from './audio-processing';

const TopNav = () => {
  const [screenState, setScreen] = useState("image");

  return (
    <div className="flex flex-col">
      <div className="flex flex-row justify-between text-2xl px-6 pb-4 pt-2 border-black border-b-4 rounded-lg">
        <div className="font-bold cursor-default">Dan's Editor</div>
        <div className="flex flex-row gap-4">
          <p onClick={() => setScreen("image")} className="cursor-pointer font-bold">
            Image Resizer
          </p>
          <p onClick={() => setScreen("audio")} className="cursor-pointer font-bold">
            Audio Compressor
          </p>
          <a href="https://dan-koyuki-profile.vercel.app/home" className='font-medium'>About</a>
        </div>
      </div>
      {/* Conditional Rendering Based on screenState */}
      <div className='mt-4'>
        {screenState === "image" && <ImageProcessing />}
        {screenState === "audio" && <AudioProcessing />}
      </div>
    </div>
  );
}

export default TopNav