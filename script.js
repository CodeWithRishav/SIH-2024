let model;
async function loadModel() {
    try {
        model = await tf.loadGraphModel('./tfjs_model/model.json');
        const modeltag = document.getElementById('modelTag');
        modeltag.innerHTML = `<u>Try Model (Loaded!)</u>`;
        console.log('Model loaded successfully');
    } catch (error) {
        console.error('Failed to load model:', error);
    }
}

function handleImageUpload() {
    const imageInput = document.getElementById('imageInput');
    const img = document.getElementById('image');
    const imageContainer = document.getElementById('imageContainer');

    if (!imageInput || !img || !imageContainer) {
        console.error('One or more elements are missing: imageInput, image, imageContainer');
        return;
    }

    if (imageInput.files && imageInput.files[0]) {
        const file = imageInput.files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
            // Create a new Image object to load the file data
            const originalImg = new Image();
            originalImg.src = e.target.result;

            originalImg.onload = function () {
                // Create a canvas to resize the image
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Set canvas size to 512x512
                canvas.width = 512;
                canvas.height = 512;

                // Draw the resized image on the canvas
                ctx.drawImage(originalImg, 0, 0, canvas.width, canvas.height);

                // Get the resized image data from the canvas and display it
                const resizedImageData = canvas.toDataURL(); // Convert canvas to Data URL

                img.src = resizedImageData;  // Set the resized image as the source
                img.style.display = 'block'; // Show the image
                imageContainer.innerHTML = ''; // Clear previous images
                imageContainer.appendChild(img); // Display the resized image
            };
        };

        reader.readAsDataURL(file);
    }
}

async function detectImage() {
    if (!model) {
        console.error('Model not loaded yet');
        return;
    }

    const imageInput = document.getElementById('imageInput');
    const img = document.getElementById('image');
    const resultDiv = document.getElementById('resultDiv');  // Ensure resultDiv exists

    if (!imageInput || !img || !resultDiv) {
        console.error('One or more elements are missing: imageInput, image, resultDiv');
        return;
    }

    if (imageInput.files && imageInput.files[0]) {
        const file = imageInput.files[0];
        const reader = new FileReader();

        reader.onload = async function (e) {
            img.src = e.target.result;
            img.onload = async function () {

                // Create a canvas to resize and preprocess the image
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 512;  // Adjust as per your model input size
                canvas.height = 512; // Adjust as per your model input size
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Convert canvas image to tensor
                const imageTensor = tf.browser.fromPixels(canvas)
                    .toFloat()
                    .expandDims(0)  // Add batch dimension
                    .div(tf.scalar(255)); // Normalize

                // Make predictions (generated map output)
                const prediction = await model.predict(imageTensor);

                // Assuming the prediction is an image tensor, process and display it
                const predictedImageTensor = prediction.squeeze();  // Remove batch dimension if present

                // Create a canvas for displaying the generated image
                const displayCanvas = document.createElement('canvas');
                const displayCtx = displayCanvas.getContext('2d');

                // Get dimensions of the predicted image tensor
                const [height, width, channels] = predictedImageTensor.shape;

                // Set canvas size to the dimensions of the generated image
                displayCanvas.width = width;
                displayCanvas.height = height;

                // Create an ImageData object and fill it with the predicted image data
                const imageData = displayCtx.createImageData(width, height);
                const data = predictedImageTensor.dataSync();  // Get pixel data

                // Loop through the data and set pixel values (handle RGB or RGBA)
                for (let i = 0; i < data.length; i++) {
                    imageData.data[i] = data[i] * 255;  // Rescale the pixel value to [0, 255]
                }

                // Draw the image data on the canvas
                displayCtx.putImageData(imageData, 0, 0);

                // Clear the previous result and display the new image
                resultDiv.innerHTML = '';  // Clear previous result
                resultDiv.appendChild(displayCanvas);  // Display the generated image on the canvas
            };
        };

        reader.readAsDataURL(file);
    }
}




// Ensure the script runs after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
    loadModel();
    document.getElementById('imageInput').addEventListener('change', handleImageUpload);
    document.getElementById('process').addEventListener('click', detectImage);
});