export const audioRecorder = stream =>
  new Promise(async resolve => {
    const mediaRecorder = await new MediaRecorder(stream)
    const audioChunks = []

    mediaRecorder.addEventListener('dataavailable', event => {
      audioChunks.push(event.data)
    })

    const record = () => mediaRecorder.start()

    const stop = () =>
      new Promise(resolve => {
        mediaRecorder.addEventListener('stop', () => {
          const audioBlob = new Blob(audioChunks)
          const audioFile = new File([audioBlob], 'voice note', {
            type: 'audio/wav'
          })
          resolve({ audioFile })
        })

        mediaRecorder.stop()
      })

    resolve({ record, stop })
  })
