import React, { useEffect, useRef, useState } from 'react'

const ImagePicker = ({ id, label = 'Attach Image(s) (optional)', onChange, onChangeAll, maxSize = 1024, quality = 0.7 }) => {
  const fileRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const [images, setImages] = useState([]) // array of data URLs
  const [showCamera, setShowCamera] = useState(false)
  const [isStartingCamera, setIsStartingCamera] = useState(false)
  const [cameraError, setCameraError] = useState('')

  useEffect(() => {
    if (onChangeAll) onChangeAll(images)
    if (onChange) onChange(images.length ? images[images.length - 1] : null)
  }, [images, onChange, onChangeAll])

  useEffect(() => {
    return () => {
      // cleanup camera on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }
  }, [])

  const resizeImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = img
          if (width > height && width > maxSize) {
            height = Math.round((height * maxSize) / width)
            width = maxSize
          } else if (height > maxSize) {
            width = Math.round((width * maxSize) / height)
            height = maxSize
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          const dataUrl = canvas.toDataURL('image/jpeg', quality)
          resolve(dataUrl)
        }
        img.src = reader.result
      }
      reader.readAsDataURL(file)
    })
  }

  const handleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return
    const files = Array.from(fileList)
    const resized = []
    for (const file of files) {
      try {
        const dataUrl = await resizeImage(file)
        resized.push(dataUrl)
      } catch (e) {
        // skip bad file
      }
    }
    if (resized.length) {
      setImages(prev => [...prev, ...resized])
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleInputChange = (e) => {
    handleFiles(e.target.files)
  }

  const removeImageAt = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx))
  }

  const openFileDialog = () => {
    if (fileRef.current) fileRef.current.click()
  }

  const openCamera = async () => {
    setCameraError('')
    setShowCamera(true)
    setIsStartingCamera(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (err) {
      setCameraError('Unable to access camera. You can upload from files instead.')
    } finally {
      setIsStartingCamera(false)
    }
  }

  const closeCamera = () => {
    setShowCamera(false)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const vw = video.videoWidth
    const vh = video.videoHeight
    if (!vw || !vh) return

    // compute resized dims similar to file resize
    let width = vw
    let height = vh
    if (width > height && width > maxSize) {
      height = Math.round((height * maxSize) / width)
      width = maxSize
    } else if (height > maxSize) {
      width = Math.round((width * maxSize) / height)
      height = maxSize
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, width, height)
    const dataUrl = canvas.toDataURL('image/jpeg', quality)
    setImages(prev => [...prev, dataUrl])
    // keep camera open for more captures
  }

  return (
    <div className="image-picker">
      <label htmlFor={id}><i className="fas fa-image"></i> {label}</label>

      <div className="image-picker-buttons">
        <button type="button" className="image-button" onClick={openFileDialog}>
          <i className="fas fa-folder-open"></i> Choose Image(s)
        </button>
        <button type="button" className="image-button button-secondary" onClick={openCamera}>
          <i className="fas fa-camera"></i> Use Camera
        </button>
      </div>

      <input
        id={id}
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      {images.length > 0 && (
        <div className="image-previews">
          {images.map((src, idx) => (
            <div className="image-thumb" key={idx}>
              <img src={src} alt={`Selected ${idx + 1}`} />
              <button type="button" className="remove-thumb" onClick={() => removeImageAt(idx)} aria-label="Remove image">
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>
      )}

      {showCamera && (
        <div className="modal" style={{ display: 'block' }}>
          <div className="modal-content">
            <h3 style={{ marginTop: 0 }}><i className="fas fa-camera"></i> Camera</h3>
            {cameraError && <div style={{ color: 'red', marginBottom: '0.5rem' }}>{cameraError}</div>}
            <video ref={videoRef} id="camera-video-feed" autoPlay playsInline muted />
            <div className="modal-controls">
              <button type="button" onClick={capturePhoto} disabled={isStartingCamera}>
                {isStartingCamera ? <><i className="fas fa-spinner fa-spin"></i> Starting...</> : <><i className="fas fa-camera"></i> Capture</>}
              </button>
              <button type="button" className="button-secondary" onClick={closeCamera}><i className="fas fa-times"></i> Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImagePicker
