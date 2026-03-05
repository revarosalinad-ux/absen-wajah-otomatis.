const video = document.getElementById('video')

// Memuat model AI
Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models')
]).then(startVideo)

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: {} })
    .then(stream => {
      video.srcObject = stream
      document.getElementById('status').innerText = "Sistem Siap! Silakan Berdiri Depan Kamera"
    })
    .catch(err => console.error(err))
}

video.addEventListener('play', async () => {
  const labeledFaceDescriptors = await loadLabeledImages()
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
  
  const canvas = faceapi.createCanvasFromMedia(video)
  document.getElementById('video-container').append(canvas)
  const displaySize = { width: video.width, height: video.height }
  faceapi.matchDimensions(canvas, displaySize)

  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors()
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    
    resizedDetections.forEach(detection => {
      const result = faceMatcher.findBestMatch(detection.descriptor)
      
      if (result.label !== 'unknown') {
        document.getElementById('status').innerText = `TERIMA KASIH, ${result.label.toUpperCase()}! ABSEN BERHASIL.`
        document.getElementById('status').style.color = "#00ff00"
      } else {
        document.getElementById('status').innerText = "WAJAH TIDAK DIKENALI..."
        document.getElementById('status').style.color = "#ff0000"
      }

      const drawBox = new faceapi.draw.DrawBox(detection.detection.box, { label: result.toString() })
      drawBox.draw(canvas)
    })
  }, 1000)
})

function loadLabeledImages() {
  // GABUNGKAN NAMA JADI SATU BARIS
  const labels = ['Octavia Ade Firnanda Putri', 'Reva Rosalina Dewi'] 
  
  return Promise.all(
    labels.map(async label => {
      const descriptions = []
      for (let i = 1; i <= 1; i++) {
        // GUNAKAN TITIK (./) DAN TANDA BACKTICK ( ` ) 
        // Tombol backtick ada di sebelah angka 1
        const img = await faceapi.fetchImage(`./labeled_images/${label}/${i}.jpg`)
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
        descriptions.push(detections.descriptor)
      }
      return new faceapi.LabeledFaceDescriptors(label, descriptions)
    })
  )
}
