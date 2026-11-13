// AudioWorklet capture processor for Watchtower Piano Defense.
// Captures mono audio in small transferable blocks. No pitch analysis happens
// in the real-time audio rendering thread.
class PianoCaptureProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const requested = options?.processorOptions?.chunkSize || 1024;
    this.chunkSize = Math.max(256, requested | 0);
    this.chunk = new Float32Array(this.chunkSize);
    this.offset = 0;
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    // Keep the output silent; the node exists only to receive microphone data.
    if (output) {
      for (let c = 0; c < output.length; c++) output[c].fill(0);
    }

    if (!input || !input.length || !input[0]) return true;
    const channels = input.length;
    const frames = input[0].length;

    for (let i = 0; i < frames; i++) {
      let sample = 0;
      for (let c = 0; c < channels; c++) sample += input[c][i] || 0;
      this.chunk[this.offset++] = sample / channels;

      if (this.offset >= this.chunkSize) {
        const completed = this.chunk;
        this.chunk = new Float32Array(this.chunkSize);
        this.offset = 0;
        this.port.postMessage({ type: 'audio', samples: completed }, [completed.buffer]);
      }
    }
    return true;
  }
}

registerProcessor('piano-capture', PianoCaptureProcessor);
