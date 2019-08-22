import React from 'react'

function AudioVisualizer({ audio }) {
  const canvasRef = React.useRef()
  const animationFrameRef = React.useRef()
  const audioSrcRef = React.useRef()
  const analyserRef = React.useRef()

  React.useEffect(() => {
    window.AudioContext =
      window.AudioContext || window.webkitAudioContext || window.mozAudioContext

    const audioContext = new AudioContext()
    analyserRef.current = audioContext.createAnalyser()
    audioSrcRef.current = audioContext.createMediaElementSource(audio)

    audioSrcRef.current.connect(analyserRef.current)
    analyserRef.current.connect(audioContext.destination)

    const cwidth = canvasRef.current.width
    const cheight = canvasRef.current.height - 2
    const meterWidth = 10
    const capHeight = 2
    const capStyle = '#fff'
    const meterNum = 800 / (10 + 2)
    const capYPositionArray = []
    const ctx = canvasRef.current.getContext('2d')
    const gradient = ctx.createLinearGradient(0, 0, 0, 300)

    gradient.addColorStop(1, '#0f0')
    gradient.addColorStop(0.5, '#ff0')
    gradient.addColorStop(0, '#f00')

    function renderFrame() {
      const array = new Uint8Array(analyserRef.current.frequencyBinCount)
      analyserRef.current.getByteFrequencyData(array)
      const step = Math.round(array.length / meterNum)

      ctx.clearRect(0, 0, cwidth, cheight)
      for (let i = 0; i < meterNum; i++) {
        const value = array[i * step]
        if (capYPositionArray.length < Math.round(meterNum)) {
          capYPositionArray.push(value)
        }
        ctx.fillStyle = capStyle

        if (value < capYPositionArray[i]) {
          ctx.fillRect(
            i * 12,
            cheight - --capYPositionArray[i],
            meterWidth,
            capHeight
          )
        } else {
          ctx.fillRect(i * 12, cheight - value, meterWidth, capHeight)
          capYPositionArray[i] = value
        }
        ctx.fillStyle = gradient
        ctx.fillRect(i * 12, cheight - value + capHeight, meterWidth, cheight)
      }
      animationFrameRef.current = requestAnimationFrame(renderFrame)
    }

    renderFrame()

    return () => {
      cancelAnimationFrame(animationFrameRef.current)
      audioSrcRef.current.disconnect()
      analyserRef.current.disconnect()
    }
  }, [audio])

  return <canvas ref={canvasRef} style={{ height: '60px', width: '50%' }} />
}

export default AudioVisualizer
