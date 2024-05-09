import React, { useState } from "react";
import Resizer from "react-image-file-resizer";

const ImageProcessing = () => {
  const [uploadedImage, setImage] = useState(null);
  const [resizedImage, setResizedImage] = useState(null);
  const [originalURL, setOURL] = useState();
  const [resizedURL, setRURL] = useState();
  const [inputHeight, setHeight] = useState(0);
  const [inputWidth, setWidth] = useState(0);
  const [compressedFormat, setFormat] = useState("JPEG");

  console.log(inputHeight);

  const handleImageChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setImage(event.target.files[0]);
      setOURL(URL.createObjectURL(event.target.files[0]));
    }
  };

  const handleDelete = () => {
    setImage(null);
    setOURL(null);
  };

  const resizeFile = (file) =>
    new Promise((resolve) => {
      Resizer.imageFileResizer(
        file,
        inputWidth,
        inputHeight,
        compressedFormat,
        100,
        0,
        (uri) => {
          console.log("Resized URI:", uri);
          resolve(uri);
        },
        "file"
      );
    });

  const startResize = async () => {
    try {
      const resized = await resizeFile(uploadedImage);
      console.log(resized);
      setResizedImage(resized);
      setRURL(URL.createObjectURL(resized));
    } catch (error) {
      console.log(error);
    }
  };

  const handleDownload = async () => {
    if (!resizedImage) {
      console.error("No resized image available for download.");
      return;
    }

    const link = document.createElement("a");
    link.href = resizedURL;
    link.download = `resized.${compressedFormat}`; // Set a default filename

    link.click();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Image Resizer</h2>
        <p className="text-gray-600">
          Resize your images easily. (Supports PNG and JPEG)
        </p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-lg bg-gray-100 shadow py-4">
        {!uploadedImage && (
          <div className="flex flex-col items-center">
            <p className="text-lg font-medium text-gray-800">
              Upload your Image here!
            </p>
            <input type="file" onChange={handleImageChange} className="my-2" />
          </div>
        )}
        {uploadedImage && (
          <div className="relative">
            <button
              className="absolute top-0 right-0 z-10 text-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleDelete}
            >
              [X]
            </button>
            <img
              src={originalURL}
              alt="Uploaded"
              className="w-full rounded-lg object-cover"
            />
          </div>
        )}
      </div>
      <div className="flex flex-col space-y-4 items-center m-4">
        <div className="flex items-center">
          <label
            htmlFor="height"
            className="text-sm font-medium text-gray-700 mr-2"
          >
            New Height:
          </label>
          <input
            type="number"
            id="height"
            value={inputHeight}
            onChange={(e) => setHeight(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center">
          <label
            htmlFor="width"
            className="text-sm font-medium text-gray-700 mr-2"
          >
            New Width:
          </label>
          <input
            type="number"
            id="width"
            value={inputWidth}
            onChange={(e) => setWidth(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center">
          <label
            htmlFor="format"
            className="text-sm font-medium text-gray-700 mr-2"
          >
            Format:
          </label>
          <input
            type="text"
            id="format"
            value={compressedFormat}
            onChange={(e) => setFormat(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={startResize}
          className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-700"
        >
          Resize
        </button>
        {resizedImage && (
          <div>
            <img
              src={resizedURL}
              alt="Resized"
              className="w-full rounded-lg object-cover"
            />
            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Download
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageProcessing;
