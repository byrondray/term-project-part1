/*
 * Project: Milestone 1
 * File Name: IOhandler.js
 * Description: This program unzips a folder, takes only the images and then applies a filter to those images.
 *
 * Created Date: November 2, 2023
 * Author: Byron Dray
 *
 */

const { pipeline } = require("stream"),
  { createReadStream, createWriteStream } = require("fs"),
  PNG = require("pngjs").PNG,
  fs = require("fs/promises"),
  AdmZip = require("adm-zip"),
  path = require("path");

const checkExistsAndCreateFolder = (dirPath) => {
  return fs.readdir(dirPath).catch((err) => {
    if (err.code === "ENOENT") {
      return fs.mkdir(dirPath, { recursive: true }).then(() => []);
    }
    throw err;
  });
};

const unzip = (pathIn, pathOut) => {
  return checkExistsAndCreateFolder(pathOut)
    .then(() => {
      return new Promise((resolve, reject) => {
        try {
          const zip = new AdmZip(pathIn);
          zip.extractAllTo(pathOut, true);
          resolve();
        } catch (err) {
          console.error("An error occurred during extraction:", err);
          reject(err);
        }
      });
    })
    .catch((err) => {
      console.error("An error occurred:", err);
      throw err;
    });
};

const filterPngFiles = (files) => {
  return files.filter((file) => path.extname(file) === ".png");
};

const getFullPaths = (dir, files) => {
  return files.map((file) => path.join(dir, file));
};

const readDir = (dir) => {
  return fs
    .readdir(dir)
    .then(filterPngFiles)
    .then((pngFiles) => getFullPaths(dir, pngFiles));
};

const readImage = (path) => {
  return createReadStream(path);
};

const writeImage = (png, pathOut) => {
  return new Promise((resolve, reject) => {
    pipeline(png.pack(), createWriteStream(pathOut), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

const convertToGrayscale = (png) => {
  return new Promise((resolve, reject) => {
    for (let y = 0; y < png.height; y++) {
      for (let x = 0; x < png.width; x++) {
        let idx = (png.width * y + x) << 2;
        let red = png.data[idx];
        let green = png.data[idx + 1];
        let blue = png.data[idx + 2];
        let grayscale = Math.round((red + green + blue) / 3);
        png.data[idx] = grayscale;
        png.data[idx + 1] = grayscale;
        png.data[idx + 2] = grayscale;
      }
    }
    resolve(png);
  });
};

const convertToSepia = (png) => {
  return new Promise((resolve, reject) => {
    for (let y = 0; y < png.height; y++) {
      for (let x = 0; x < png.width; x++) {
        let idx = (png.width * y + x) << 2;
        let red = png.data[idx];
        let green = png.data[idx + 1];
        let blue = png.data[idx + 2];

        let sepiaRed = 0.393 * red + 0.769 * green + 0.189 * blue;
        let sepiaGreen = 0.349 * red + 0.686 * green + 0.168 * blue;
        let sepiaBlue = 0.272 * red + 0.534 * green + 0.131 * blue;

        png.data[idx] = sepiaRed > 255 ? 255 : sepiaRed;
        png.data[idx + 1] = sepiaGreen > 255 ? 255 : sepiaGreen;
        png.data[idx + 2] = sepiaBlue > 255 ? 255 : sepiaBlue;
      }
    }
    resolve(png);
  });
};

const applyFilter = (png, filterType) => {
  switch (filterType) {
    case "grayscale":
      return convertToGrayscale(png);
    case "sepia":
      return convertToSepia(png);
    default:
      return Promise.reject(new Error("Unknown filter type"));
  }
};

const chooseFilter = (pathIn, filterType) => {
  return new Promise((resolve, reject) => {
    const outputFilename = path.basename(pathIn);
    let outputPath;

    outputPath = getOutputPath(filterType, outputFilename);

    const readStream = readImage(pathIn);
    const pngStream = new PNG({});

    pngStream.on("parsed", function () {
      applyFilter(this, filterType)
        .then((filterApplied) => {
          return writeImage(filterApplied, outputPath);
        })
        .then(resolve)
        .catch(reject);
    });

    pipeline(readStream, pngStream, (err) => {
      if (err) {
        reject(err);
      }
    });
  });
};

const getOutputPath = (filterType, filename) => {
  switch (filterType) {
    case "grayscale":
      return path.join(__dirname, "grayscaled", filename);
    case "sepia":
      return path.join(__dirname, "sepia", filename);
    default:
      return null;
  }
};

module.exports = {
  unzip,
  readDir,
  chooseFilter,
};
