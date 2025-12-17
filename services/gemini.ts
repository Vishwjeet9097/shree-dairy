
import { GoogleGenAI, Type, FunctionDeclaration, LiveServerMessage, Modality } from "@google/genai";

// --- Standalone Text Services ---

export async function transliterateToHindi(text: string, apiKey?: string): Promise<string> {
  if (!text || text.trim().length === 0) return '';
  try {
    const keyToUse = apiKey || process.env.API_KEY || '';
    if (!keyToUse) throw new Error("No API Key available");

    const ai = new GoogleGenAI({ apiKey: keyToUse });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Transliterate the following English name/text into Hindi script. Return ONLY the Hindi text, nothing else. Text: "${text}"`,
    });

    return response.text ? response.text.trim() : '';
  } catch (e) {
    console.error("Transliteration failed", e);
    return '';
  }
}

// --- Tool Definitions ---
const TOOLS: FunctionDeclaration[] = [
  {
    name: 'add_milk_entry',
    description: 'Add milk entry. Use this for daily logs.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerName: { type: Type.STRING, description: 'Name of the customer' },
        quantity: { type: Type.NUMBER, description: 'Quantity in KG/Liters' },
        date: { type: Type.STRING, description: 'Date in YYYY-MM-DD format (default to today)' },
        isDelivered: { type: Type.BOOLEAN, description: 'True if delivered, false if absent' },
        slot: { type: Type.STRING, description: 'morning or evening' }
      },
      required: ['customerName']
    }
  },
  {
    name: 'mark_delivery_range',
    description: 'Mark milk delivery status for a range of dates.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerName: { type: Type.STRING, description: 'Name of the customer' },
        startDate: { type: Type.STRING, description: 'Start date YYYY-MM-DD' },
        endDate: { type: Type.STRING, description: 'End date YYYY-MM-DD' },
        isDelivered: { type: Type.BOOLEAN, description: 'TRUE if milk was given. FALSE if milk was NOT given.' },
        quantity: { type: Type.NUMBER, description: 'Optional quantity override if delivered.' },
        reason: { type: Type.STRING, description: 'Reason if not delivered (optional).' }
      },
      required: ['customerName', 'startDate', 'endDate', 'isDelivered']
    }
  },
  {
    name: 'add_payment',
    description: 'Record a payment received from a customer.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerName: { type: Type.STRING, description: 'Name of the customer' },
        amount: { type: Type.NUMBER, description: 'Amount in Rupees' },
        date: { type: Type.STRING, description: 'Date of payment YYYY-MM-DD (default today)' }
      },
      required: ['customerName', 'amount']
    }
  },
  {
    name: 'delete_payment',
    description: 'Delete a specific payment record.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerName: { type: Type.STRING, description: 'Name of the customer' },
        amount: { type: Type.NUMBER, description: 'Amount of the payment to delete' },
        date: { type: Type.STRING, description: 'Date of the payment YYYY-MM-DD' }
      },
      required: ['customerName', 'amount']
    }
  },
  {
    name: 'add_new_customer',
    description: 'Create a new customer profile. MANDATORY: Name, Rate, Quantity, Preferred Time.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Full name in English' },
        nameHi: { type: Type.STRING, description: 'Full name transliterated to Hindi script automatically' },
        rate: { type: Type.NUMBER, description: 'Rate per liter/kg (Price)' },
        quantity: { type: Type.NUMBER, description: 'Default daily quantity' },
        preferredTime: { 
            type: Type.STRING, 
            description: 'The preferred delivery slot. Must be one of: "morning", "evening", "both".',
            enum: ['morning', 'evening', 'both']
        },
        phone: { type: Type.STRING, description: 'Phone number (Optional)' },
        address: { type: Type.STRING, description: 'Address (Optional)' }
      },
      required: ['name', 'rate', 'quantity', 'preferredTime']
    }
  },
  {
    name: 'update_customer_profile',
    description: 'Update details for an existing customer.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerName: { type: Type.STRING, description: 'Name of the customer to update' },
        phone: { type: Type.STRING, description: 'New phone number' },
        address: { type: Type.STRING, description: 'New address' },
        rate: { type: Type.NUMBER, description: 'New rate per kg' },
        defaultQty: { type: Type.NUMBER, description: 'New default daily quantity' },
        isActive: { type: Type.BOOLEAN, description: 'Set status: true or false' },
        preferredTime: { type: Type.STRING, enum: ['morning', 'evening', 'both'] }
      },
      required: ['customerName']
    }
  },
  {
    name: 'delete_customer',
    description: 'Permanently DELETE a customer.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerName: { type: Type.STRING, description: 'Name of the customer to delete' }
      },
      required: ['customerName']
    }
  },
  {
    name: 'add_cattle_record',
    description: 'Record an insemination date for a cow.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        cowName: { type: Type.STRING, description: 'Name of the cow' },
        cowColor: { type: Type.STRING, description: 'Color or visual ID' },
        date: { type: Type.STRING, description: 'Date in YYYY-MM-DD format' },
      },
      required: ['cowName']
    }
  },
  {
    name: 'delete_cattle_record',
    description: 'Delete a cattle insemination record.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        cowName: { type: Type.STRING, description: 'Name of the cow' },
        date: { type: Type.STRING, description: 'Insemination Date YYYY-MM-DD' }
      },
      required: ['cowName']
    }
  },
  {
    name: 'get_cattle_records',
    description: 'List all cattle insemination records.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    }
  },
  {
    name: 'get_customer_status',
    description: 'Get financial summary.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerName: { type: Type.STRING, description: 'Name of the customer' }
      },
      required: ['customerName']
    }
  },
  {
    name: 'check_delivery',
    description: 'Check milk delivery status.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerName: { type: Type.STRING },
        date: { type: Type.STRING, description: 'YYYY-MM-DD' }
      },
      required: ['customerName', 'date']
    }
  },
  {
    name: 'get_payment_history',
    description: 'Get recent payments.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerName: { type: Type.STRING },
        limit: { type: Type.NUMBER, description: 'Number of records' }
      },
      required: ['customerName']
    }
  },
  {
    name: 'get_pending_list',
    description: 'Get list of defaulters.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    }
  },
  {
    name: 'get_daily_report',
    description: 'Get daily report.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        date: { type: Type.STRING, description: 'Date in YYYY-MM-DD format' }
      },
      required: ['date']
    }
  },
  {
    name: 'get_monthly_report',
    description: 'Get monthly report.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        yearMonth: { type: Type.STRING, description: 'Format YYYY-MM' }
      },
      required: ['yearMonth']
    }
  },
  {
    name: 'get_recent_activity',
    description: 'Get the last entries and customers created to verify actions.',
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  }
];

// ... (Audio Utils same as before) ...
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output.buffer;
}

function pcmToFloat32(data: Int16Array): Float32Array {
  const float32 = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) {
    float32[i] = data[i] / 32768.0;
  }
  return float32;
}

function downsampleBuffer(buffer: Float32Array, inputRate: number, outputRate: number): Float32Array {
    if (outputRate === inputRate) {
        return buffer;
    }
    const sampleRateRatio = inputRate / outputRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < result.length) {
        const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
        let accum = 0, count = 0;
        for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
            accum += buffer[i];
            count++;
        }
        result[offsetResult] = count > 0 ? accum / count : 0;
        offsetResult++;
        offsetBuffer = nextOffsetBuffer;
    }
    return result;
}

export class GeminiLive {
  private inputContext: AudioContext | null = null;
  private outputContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private nextStartTime = 0;
  private session: any = null;
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  
  public onToolCall: ((name: string, args: any) => Promise<any>) | null = null;
  public onVisualizerData: ((volume: number) => void) | null = null;
  public onStatusChange: ((status: string) => void) | null = null;

  constructor() {}

  async connect(customerNames: string[], apiKey?: string) {
    try {
      this.onStatusChange?.("Starting...");

      // Strictly check API key presence
      let keyToUse = apiKey && apiKey.trim().length > 0 ? apiKey : process.env.API_KEY;
      if (!keyToUse || keyToUse === 'undefined') {
          console.error("API Key Missing");
          this.onStatusChange?.("Config Error: Missing API Key");
          return;
      }

      const ai = new GoogleGenAI({ apiKey: keyToUse });

      // Initialize Audio Contexts
      this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.outputContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      if (this.outputContext.state === 'suspended') {
        await this.outputContext.resume();
      }
      if (this.inputContext.state === 'suspended') {
        await this.inputContext.resume();
      }

      // Request Microphone access BEFORE connecting to WebSocket to avoid timeout/race conditions
      this.onStatusChange?.("Requesting Mic...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1
        }
      });

      const today = new Date().toDateString();
      
      const systemInstruction = `
        You are 'Shree AI' (श्री AI), the intelligent manager for this dairy business.
        Today's date is ${today}.

        **CREATING USER RECORDS (CRITICAL):**
        1. **MANDATORY DATA**: To create a record, you MUST have: Name, Rate (Price), Quantity, and **Preferred Time**.
        2. **ASK FIRST**: If the user says "Add new customer Ramesh", you MUST ask: "What is the preferred time slot? Morning, Evening, or Both?".
        3. **DO NOT CREATE** until you have the time slot. Phone and Address are optional.
        4. Use \`add_new_customer\` ONLY when all mandatory fields are known.

        **OTHER DATA HANDLING:**
        - **Milk Entries**: Use \`add_milk_entry\`. If user says "Milk for [Unknown Person]", auto-creation is allowed IF you infer the details, otherwise ask.
        - **Hindi Input**: "Dudh gya" = Delivered (True), "Nahi gya" = Absent (False).
        
        **RESPONSE STYLE:**
        - Short, confident, and professional.
        - Hinglish (Hindi + English mix).
        - If creating a record, confirm details: "Created profile for Ramesh (Morning, 60/L)."

        Known Customers: ${customerNames.join(', ')}.
      `;

      this.onStatusChange?.("Connecting...");

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: TOOLS }],
          systemInstruction: systemInstruction,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } },
          },
        },
        callbacks: {
          onopen: () => {
            this.onStatusChange?.("Connected");
            this.startStreaming(stream, sessionPromise);
          },
          onmessage: async (msg: LiveServerMessage) => {
             this.handleMessage(msg, sessionPromise);
          },
          onclose: () => {
            this.onStatusChange?.("Disconnected");
            this.disconnect();
          },
          onerror: (err) => {
            console.error("Gemini Live Error", err); 
            this.onStatusChange?.("Connection Error");
            this.disconnect();
          }
        }
      });
      
      this.session = sessionPromise;
      
      // Wait for connection to verify it's established before finishing setup
      // This allows the outer catch to handle immediate network errors (like 403/404)
      await sessionPromise;

    } catch (err) {
      console.error("Connection Failed", err);
      // Clean up stream if we failed early
      if (this.stream) {
          this.stream.getTracks().forEach(t => t.stop());
          this.stream = null;
      }
      this.onStatusChange?.("Connection Failed");
    }
  }

  // ... (Stream handling methods) ...
  private async startStreaming(stream: MediaStream, sessionPromise: Promise<any>) {
    if (!this.inputContext) return;
    
    this.stream = stream;
    this.inputSource = this.inputContext.createMediaStreamSource(this.stream);
    this.processor = this.inputContext.createScriptProcessor(4096, 1, 1);

    const inputSampleRate = this.inputContext.sampleRate;
    const targetSampleRate = 16000;

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      let sum = 0;
      for (let i=0; i<inputData.length; i+=50) { sum += Math.abs(inputData[i]); }
      const avg = sum / (inputData.length / 50);
      this.onVisualizerData?.(avg);

      const downsampledData = downsampleBuffer(inputData, inputSampleRate, targetSampleRate);
      const pcm16 = floatTo16BitPCM(downsampledData);
      const base64Data = arrayBufferToBase64(pcm16);
      
      sessionPromise.then(session => {
          session.sendRealtimeInput({
              media: {
                  mimeType: "audio/pcm;rate=16000",
                  data: base64Data
              }
          });
      });
    };

    this.inputSource.connect(this.processor);
    this.processor.connect(this.inputContext.destination);
  }

  private async handleMessage(message: LiveServerMessage, sessionPromise: Promise<any>) {
    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioData && this.outputContext) {
      this.playAudio(audioData);
    }

    const toolCall = message.toolCall;
    if (toolCall && this.onToolCall) {
        const functionCalls = toolCall.functionCalls;
        const functionResponses = [];
        for (const call of functionCalls) {
            try {
                const result = await this.onToolCall(call.name, call.args);
                functionResponses.push({
                    id: call.id,
                    name: call.name,
                    response: { result: result }
                });
            } catch (e) {
                functionResponses.push({
                    id: call.id,
                    name: call.name,
                    response: { error: "Failed to execute tool" }
                });
            }
        }
        if (functionResponses.length > 0) {
            sessionPromise.then(session => {
                session.sendToolResponse({ functionResponses });
            });
        }
    }

    if (message.serverContent?.interrupted) {
       this.stopAllAudio();
    }
  }

  private async playAudio(base64Data: string) {
    if (!this.outputContext) return;
    try {
        if (this.outputContext.state === 'suspended') await this.outputContext.resume();
        const uint8 = base64ToUint8Array(base64Data);
        const int16 = new Int16Array(uint8.buffer);
        const float32 = pcmToFloat32(int16);
        const audioBuffer = this.outputContext.createBuffer(1, float32.length, 24000);
        audioBuffer.getChannelData(0).set(float32);
        const source = this.outputContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.outputContext.destination);
        source.start(this.nextStartTime);
        this.nextStartTime = Math.max(this.outputContext.currentTime, this.nextStartTime) + audioBuffer.duration;
        this.activeSources.add(source);
        source.onended = () => this.activeSources.delete(source);
    } catch (error) {
        console.error("Audio Playback Error", error);
    }
  }

  private stopAllAudio() {
      this.activeSources.forEach(source => {
          try { source.stop(); } catch(e) {}
      });
      this.activeSources.clear();
      this.nextStartTime = 0;
  }

  disconnect() {
    this.session?.then((s: any) => s.close());
    
    // Stop all media tracks to release microphone
    if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
    }

    this.processor?.disconnect();
    this.inputSource?.disconnect();
    this.inputContext?.close();
    this.outputContext?.close();
    this.stopAllAudio();
    this.session = null;
    this.inputContext = null;
    this.outputContext = null;
  }
}
